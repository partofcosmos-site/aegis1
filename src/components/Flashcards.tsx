import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Play, ChevronLeft, ChevronRight, Check, X, RotateCcw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { UniversalAIService } from '../services/universalAIService';
import clsx from 'clsx';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  nextReview: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  svgDiagram?: string;
}

// Helper to sanitize SVG XML to prevent XSS
export const sanitizeSvg = (svg?: string): string => {
  if (!svg || typeof svg !== 'string') return '';
  const trimmed = svg.trim();
  if (!trimmed.toLowerCase().includes('<svg')) return '';
  // Strip script tags
  let clean = trimmed.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Strip inline event handlers
  clean = clean.replace(/\s+on\w+\s*=\s*(["'])[\s\S]*?\1/gi, '');
  clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
  // Strip javascript: URLs
  clean = clean.replace(/(?:href|xlink:href)\s*=\s*(["'])javascript:[\s\S]*?\1/gi, '');
  return clean;
};

// Helper to fix LaTeX delimiters and parse Anki cloze deletions
export const formatCardText = (text: string, isBackOrReviewAnswer = true) => {
  if (!text || typeof text !== 'string') return '';
  let formatted = text
    // Replace LaTeX inline \( ... \) with $...$
    .replace(/\\\\\(\s*/g, '$')
    .replace(/\\\(\s*/g, '$')
    .replace(/\s*\\\\\)/g, '$')
    .replace(/\s*\\\)/g, '$')
    // Replace LaTeX block \[ ... \] with \n$$\n (ensure we do NOT match raw markdown brackets `[`)
    .replace(/\\\\\[\s*/g, '\n$$\n')
    .replace(/\\\[\s*/g, '\n$$\n')
    .replace(/\s*\\\\\]/g, '\n$$\n')
    .replace(/\s*\\\]/g, '\n$$\n');

  // Cloze deletion parsing: {{c1::answer::hint}} or {{c1::answer}}
  if (isBackOrReviewAnswer) {
    formatted = formatted.replace(/{{c\d+::((?:(?!}}).)*?)(?:::(?:(?!}}).)*?)?}}/g, '<span class="text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">$1</span>');
  } else {
    formatted = formatted.replace(/{{c\d+::(?:(?:(?!}}).)*?)(?:::((?:(?!}}).)*?))?}}/g, (_match, hint) => {
      return `<span class="text-indigo-400 font-semibold bg-indigo-500/20 px-2 py-0.5 rounded">[${hint ? hint.trim() : '...'}]</span>`;
    });
  }
  return formatted;
};

const FlashcardListItem = ({ card, onEdit, onDelete }: { card: Flashcard, onEdit: (card: Flashcard) => void, onDelete: (id: string) => void }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isDue = card.nextReview <= new Date().toISOString();

  const safeSvg = sanitizeSvg(card.svgDiagram);

  return (
    <div 
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col group relative cursor-pointer min-h-[160px]"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(card); }} 
          className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors bg-zinc-800 rounded-md"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} 
          className="p-1 text-zinc-500 hover:text-red-400 transition-colors bg-zinc-800 rounded-md"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs font-medium text-indigo-400 mb-2">{card.deck}</div>
      <div className="text-zinc-200 font-medium mb-4 flex-1 prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
        <Markdown 
          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} 
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            img: ({node, ...props}) => <img {...props} referrerPolicy="no-referrer" className="max-w-full rounded-lg my-2" />,
            p: ({node, ...props}) => <p {...props} className="break-words" />
          }}
        >
          {formatCardText(isFlipped ? card.back : card.front, isFlipped)}
        </Markdown>
        {isFlipped && safeSvg && (
          <div 
            className="mt-4 w-full flex justify-center bg-zinc-800/50 rounded-lg p-2"
            dangerouslySetInnerHTML={{ __html: safeSvg }}
          />
        )}
      </div>
      <div className="flex justify-between items-center text-xs text-zinc-500 mt-auto pt-4 border-t border-zinc-800">
        <span>{card.repetitions} reviews</span>
        <span className={clsx(isDue ? "text-orange-400 font-medium" : "")}>
          {isDue ? 'Due now' : `Due ${new Date(card.nextReview).toLocaleDateString()}`}
        </span>
      </div>
    </div>
  );
};

export const Flashcards = () => {
  const { user, isGuest } = useAppContext();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  
  // Create/Edit form state
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deck, setDeck] = useState('');
  
  // AI Generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiImage, setAiImage] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  // Study state
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Edit state
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  useEffect(() => {
    if (user) {
      loadFlashcards();
    }
  }, [user, isGuest]);

  const loadFlashcards = async () => {
    if (!user) return;
    if (isGuest) {
      try {
        const raw = localStorage.getItem('savantix_guest_flashcards');
        const cards = raw ? JSON.parse(raw) : [];
        setFlashcards(cards);
        const uniqueDecks = Array.from(new Set(cards.map((c: Flashcard) => c.deck))).filter(Boolean) as string[];
        setDecks(uniqueDecks);
      } catch {
        setFlashcards([]);
        setDecks([]);
      }
      return;
    }

    try {
      const q = query(collection(db, 'users', user.uid, 'flashcards'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
      setFlashcards(cards);
      
      const uniqueDecks = Array.from(new Set(cards.map(c => c.deck))).filter(Boolean);
      setDecks(uniqueDecks);
    } catch (error) {
      console.error("Failed to load flashcards:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !front.trim() || !back.trim() || !deck.trim()) return;

    const newCard: Flashcard = {
      id: 'fc_' + Date.now(),
      front: front.trim().substring(0, 499),
      back: back.trim().substring(0, 1999),
      deck: deck.trim().substring(0, 99),
      nextReview: new Date().toISOString(),
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0
    };

    if (isGuest) {
      const updated = [newCard, ...flashcards];
      setFlashcards(updated);
      localStorage.setItem('savantix_guest_flashcards', JSON.stringify(updated));
      const uniqueDecks = Array.from(new Set(updated.map(c => c.deck))).filter(Boolean);
      setDecks(uniqueDecks);
      setFront('');
      setBack('');
      setIsCreating(false);
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'flashcards'), {
        uid: user.uid,
        ...newCard,
        createdAt: serverTimestamp()
      });
      
      setFront('');
      setBack('');
      setIsCreating(false);
      loadFlashcards();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'flashcards');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !aiPrompt.trim()) return;

    setIsAIGenerating(true);
    try {
      const generatedCards = await UniversalAIService.generateFlashcardsWithAI(aiPrompt);
      
      if (isGuest) {
        const newFlashcards: Flashcard[] = generatedCards.map((card, idx) => ({
          id: `fc_gen_${Date.now()}_${idx}`,
          front: card.front.substring(0, 499),
          back: card.back.substring(0, 1999),
          deck: card.deck.substring(0, 99),
          nextReview: new Date().toISOString(),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          svgDiagram: sanitizeSvg(card.svgDiagram)
        }));
        const updated = [...newFlashcards, ...flashcards];
        setFlashcards(updated);
        localStorage.setItem('savantix_guest_flashcards', JSON.stringify(updated));
        const uniqueDecks = Array.from(new Set(updated.map(c => c.deck))).filter(Boolean);
        setDecks(uniqueDecks);
      } else {
        const batchPromises = generatedCards.map(card => {
          const cardData: any = {
            uid: user.uid,
            front: card.front.substring(0, 499),
            back: card.back.substring(0, 1999),
            deck: card.deck.substring(0, 99),
            nextReview: new Date().toISOString(),
            interval: 0,
            easeFactor: 2.5,
            repetitions: 0,
            createdAt: serverTimestamp()
          };
          if (card.svgDiagram) {
            cardData.svgDiagram = sanitizeSvg(card.svgDiagram);
          }
          return addDoc(collection(db, 'users', user.uid, 'flashcards'), cardData);
        });

        await Promise.all(batchPromises);
        loadFlashcards();
      }
      
      setShowAIModal(false);
      setAiPrompt('');
      setAiImage(null);
      setAiImagePreview(null);
      setMessage({ type: 'success', text: `Successfully generated ${generatedCards.length} flashcards!` });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      setMessage({ type: 'error', text: error.message || "Failed to generate flashcards. Please try again." });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingCard) return;

    const sanitizedSvg = sanitizeSvg(editingCard.svgDiagram);
    const updateData: any = {
      front: editingCard.front.trim().substring(0, 499),
      back: editingCard.back.trim().substring(0, 1999),
      deck: editingCard.deck.trim().substring(0, 99),
      svgDiagram: sanitizedSvg || undefined
    };

    if (isGuest) {
      const updated = flashcards.map(c => c.id === editingCard.id ? { ...c, ...updateData } : c);
      setFlashcards(updated);
      localStorage.setItem('savantix_guest_flashcards', JSON.stringify(updated));
      setEditingCard(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid, 'flashcards', editingCard.id), updateData);
      setEditingCard(null);
      loadFlashcards();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${editingCard.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (isGuest) {
      const updated = flashcards.filter(c => c.id !== id);
      setFlashcards(updated);
      localStorage.setItem('savantix_guest_flashcards', JSON.stringify(updated));
      setMessage({ type: 'success', text: "Flashcard deleted." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'flashcards', id));
      loadFlashcards();
      setMessage({ type: 'success', text: "Flashcard deleted." });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `flashcards/${id}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const isTabSeparated = text.includes('\t');
      const lines = text.split('\n');
      const newCards: any[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        
        let parts = [];
        if (isTabSeparated) {
          parts = line.split('\t');
        } else {
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          parts = matches ? matches.map(m => m.replace(/^"|"$/g, '')) : line.split(',');
        }

        if (parts.length >= 2) {
          newCards.push({
            front: parts[0].trim(),
            back: parts[1].trim(),
            deck: parts.length > 2 ? parts[2].trim() : (selectedDeck || 'Imported Deck')
          });
        }
      }

      if (newCards.length === 0) {
        setMessage({ type: 'error', text: "No valid flashcards found in the file." });
        return;
      }

      try {
        if (isGuest) {
          const importedFlashcards: Flashcard[] = newCards.map((card, idx) => ({
            id: `fc_imp_${Date.now()}_${idx}`,
            front: card.front.substring(0, 499),
            back: card.back.substring(0, 1999),
            deck: card.deck.substring(0, 99),
            nextReview: new Date().toISOString(),
            interval: 0,
            easeFactor: 2.5,
            repetitions: 0
          }));
          const updated = [...importedFlashcards, ...flashcards];
          setFlashcards(updated);
          localStorage.setItem('savantix_guest_flashcards', JSON.stringify(updated));
          const uniqueDecks = Array.from(new Set(updated.map(c => c.deck))).filter(Boolean);
          setDecks(uniqueDecks);
        } else {
          const batchPromises = newCards.map(card => 
            addDoc(collection(db, 'users', user.uid, 'flashcards'), {
              uid: user.uid,
              front: card.front.substring(0, 499),
              back: card.back.substring(0, 1999),
              deck: card.deck.substring(0, 99),
              nextReview: new Date().toISOString(),
              interval: 0,
              easeFactor: 2.5,
              repetitions: 0,
              createdAt: serverTimestamp()
            })
          );
          await Promise.all(batchPromises);
          loadFlashcards();
        }
        setMessage({ type: 'success', text: `Successfully imported ${newCards.length} flashcards!` });
        setTimeout(() => setMessage(null), 5000);
      } catch (error) {
        console.error("Import Error:", error);
        setMessage({ type: 'error', text: "Failed to import flashcards." });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startStudySession = (deckName: string | null = null) => {
    setMessage(null);
    const now = new Date().toISOString();
    let cardsToStudy = flashcards.filter(c => c.nextReview <= now);
    
    if (deckName) {
      cardsToStudy = cardsToStudy.filter(c => c.deck === deckName);
    }

    if (cardsToStudy.length === 0) {
      setMessage({ type: 'info', text: "No cards due for review right now!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Shuffle cards
    cardsToStudy.sort(() => Math.random() - 0.5);
    
    setStudyCards(cardsToStudy);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudying(true);
  };

  const handleReview = async (quality: number) => {
    if (!user) return;
    
    const card = studyCards[currentCardIndex];
    let interval = Number(card.interval) || 0;
    let easeFactor = Number(card.easeFactor) || 2.5;
    let repetitions = Number(card.repetitions) || 0;

    // SuperMemo-2 Algorithm
    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor));
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, Math.min(3.0, Number(easeFactor.toFixed(3))));

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    try {
      if (isGuest) {
        const updated = flashcards.map(c => c.id === card.id ? {
          ...c,
          interval,
          easeFactor,
          repetitions,
          nextReview: nextReviewDate.toISOString()
        } : c);
        setFlashcards(updated);
        localStorage.setItem('savantix_guest_flashcards', JSON.stringify(updated));
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'flashcards', card.id), {
          interval,
          easeFactor,
          repetitions,
          nextReview: nextReviewDate.toISOString()
        });
      }

      setCurrentCardIndex(prev => {
        if (prev < studyCards.length - 1) {
          setIsFlipped(false);
          return prev + 1;
        } else {
          setIsStudying(false);
          loadFlashcards();
          return prev;
        }
      });
    } catch (error) {
      console.error("Review Error:", error);
      setMessage({ type: 'error', text: `Failed to save review: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  if (isStudying) {
    const currentCard = studyCards[currentCardIndex];
    
    if (!currentCard) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950">
          <div className="max-w-md w-full text-center space-y-6">
            <h2 className="text-2xl font-bold text-zinc-100">Session Complete!</h2>
            <p className="text-zinc-400">You've finished all the cards in this session.</p>
            <button 
              onClick={() => setIsStudying(false)} 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
            >
              Return to Decks
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950">
        <div className="max-w-2xl w-full space-y-8">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Card {currentCardIndex + 1} of {studyCards.length}</span>
            <button onClick={() => setIsStudying(false)} className="hover:text-zinc-200">End Session</button>
          </div>

          <div 
            className="w-full aspect-[3/2] [perspective:1000px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={clsx(
              "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            )}>
              {/* Front */}
              <div className="absolute w-full h-full [-webkit-backface-visibility:hidden] [backface-visibility:hidden] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-xl overflow-y-auto">
                <div className="prose prose-invert prose-indigo max-w-none w-full prose-p:leading-relaxed">
                  <Markdown 
                    remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} 
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      img: ({node, ...props}) => <img {...props} referrerPolicy="no-referrer" className="max-w-full rounded-lg my-4" />,
                      p: ({node, ...props}) => <p {...props} className="break-words" />
                    }}
                  >
                    {formatCardText(currentCard.front, false)}
                  </Markdown>
                </div>
              </div>
              
              {/* Back */}
              <div className="absolute w-full h-full [-webkit-backface-visibility:hidden] [backface-visibility:hidden] bg-zinc-800 border border-indigo-500/50 rounded-2xl p-6 sm:p-10 [transform:rotateY(180deg)] shadow-xl overflow-y-auto">
                <div className="prose prose-invert prose-indigo max-w-none w-full prose-p:leading-relaxed">
                  <Markdown 
                    remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} 
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      img: ({node, ...props}) => <img {...props} referrerPolicy="no-referrer" className="max-w-full rounded-lg my-4" />,
                      p: ({node, ...props}) => <p {...props} className="break-words" />
                    }}
                  >
                    {formatCardText(currentCard.back, true)}
                  </Markdown>
                  {currentCard.svgDiagram && (
                    <div 
                      className="mt-6 w-full flex justify-center bg-zinc-900/50 rounded-xl p-4"
                      dangerouslySetInnerHTML={{ __html: sanitizeSvg(currentCard.svgDiagram) }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {isFlipped ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 w-full">
              <button onClick={(e) => { e.stopPropagation(); handleReview(0); }} className="py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm sm:text-base font-medium">Again</button>
              <button onClick={(e) => { e.stopPropagation(); handleReview(3); }} className="py-3 bg-orange-500/10 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-colors text-sm sm:text-base font-medium">Hard</button>
              <button onClick={(e) => { e.stopPropagation(); handleReview(4); }} className="py-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors text-sm sm:text-base font-medium">Good</button>
              <button onClick={(e) => { e.stopPropagation(); handleReview(5); }} className="py-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors text-sm sm:text-base font-medium">Easy</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center text-zinc-500">Click card to reveal answer</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentCardIndex(prev => {
                    if (prev < studyCards.length - 1) {
                      setIsFlipped(false);
                      return prev + 1;
                    } else {
                      setIsStudying(false);
                      return prev;
                    }
                  });
                }}
                className="px-6 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Skip Card
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Flashcards</h1>
            <p className="text-sm sm:text-base text-zinc-500 mt-1">Spaced repetition for long-term retention</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <label className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg cursor-pointer transition-colors text-sm sm:text-base">
              <Plus className="w-4 h-4" />
              Import
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-colors font-medium border border-indigo-500/30 text-sm sm:text-base"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>
            <button
              onClick={() => startStudySession(selectedDeck)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
            >
              <Play className="w-4 h-4" />
              Study Now
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              New Card
            </button>
          </div>
        </header>

        {showAIModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Generate with AI
                </h3>
                <button onClick={() => setShowAIModal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAIGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">What do you want to learn?</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
                    placeholder="e.g., Create 10 flashcards about the French Revolution, focusing on key dates and figures."
                    required
                    disabled={isAIGenerating}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Upload Notes/Diagram (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg cursor-pointer transition-colors">
                      <ImageIcon className="w-4 h-4" />
                      <span>Choose Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isAIGenerating} />
                    </label>
                    {aiImage && <span className="text-sm text-zinc-400 truncate max-w-[200px]">{aiImage.name}</span>}
                  </div>
                  {aiImagePreview && (
                    <div className="mt-4 relative w-full h-32 rounded-lg overflow-hidden border border-zinc-800">
                      <img src={aiImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => { setAiImage(null); setAiImagePreview(null); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-md text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAIModal(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    disabled={isAIGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isAIGenerating || !aiPrompt.trim()}
                  >
                    {isAIGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Cards
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingCard && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-400" />
                  Edit Flashcard
                </h3>
                <button onClick={() => setEditingCard(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Deck</label>
                  <input
                    type="text"
                    value={editingCard.deck}
                    onChange={(e) => setEditingCard({...editingCard, deck: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Front (Markdown/LaTeX supported)</label>
                  <textarea
                    value={editingCard.front}
                    onChange={(e) => setEditingCard({...editingCard, front: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Back (Markdown/LaTeX supported)</label>
                  <textarea
                    value={editingCard.back}
                    onChange={(e) => setEditingCard({...editingCard, back: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">SVG Diagram (Optional)</label>
                  <textarea
                    value={editingCard.svgDiagram || ''}
                    onChange={(e) => setEditingCard({...editingCard, svgDiagram: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] font-mono text-xs"
                    placeholder="<svg>...</svg>"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreating && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-zinc-100 mb-4">Create Flashcard</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Deck Name</label>
                <input
                  type="text"
                  value={deck}
                  onChange={(e) => setDeck(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="e.g., Biology 101"
                  required
                  maxLength={99}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Front (Question)</label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px]"
                  placeholder="What is the powerhouse of the cell?"
                  required
                  maxLength={499}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Back (Answer)</label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]"
                  placeholder="Mitochondria"
                  required
                  maxLength={1999}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDeck(null)}
            className={clsx(
              "px-4 py-2 rounded-lg whitespace-nowrap transition-colors",
              selectedDeck === null ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            )}
          >
            All Decks
          </button>
          {decks.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDeck(d)}
              className={clsx(
                "px-4 py-2 rounded-lg whitespace-nowrap transition-colors",
                selectedDeck === d ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards
            .filter(c => selectedDeck ? c.deck === selectedDeck : true)
            .map(card => (
              <FlashcardListItem 
                key={card.id} 
                card={card} 
                onEdit={setEditingCard} 
                onDelete={handleDelete} 
              />
            ))}
        </div>
      </div>
    </div>
  );
};
