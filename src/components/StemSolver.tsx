import React, { useState } from 'react';
import { Lightbulb, Send, Loader2, Sparkles, CheckCircle2, ChevronDown, ChevronUp, BookOpen, HelpCircle } from 'lucide-react';
import { UniversalAIService } from '../services/universalAIService';
import { AIVaultService } from '../services/aiVaultService';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface SocraticStep {
  title: string;
  explanation: string;
  formulaLatex?: string;
  hint: string;
}

interface ProblemSolution {
  topic: string;
  problemStatement: string;
  keyPrinciples: string[];
  steps: SocraticStep[];
  finalAnswerLatex: string;
}

export const StemSolver: React.FC = () => {
  const [problemText, setProblemText] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [revealedStepIndex, setRevealedStepIndex] = useState<number>(0);
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim()) return;

    setIsSolving(true);
    setErrorMsg(null);
    setSolution(null);
    setRevealedStepIndex(0);
    setRevealedHints({});

    const prompt = `Solve this competitive STEM / Olympiad problem step-by-step using a Socratic teaching structure.
Format all math in LaTeX ($...$ inline, $$...$$ block).
Problem: "${problemText}"`;

    const schemaDesc = `{
  "topic": "string (e.g. Classical Mechanics / Rotational Dynamics)",
  "problemStatement": "string",
  "keyPrinciples": ["string"],
  "steps": [
    {
      "title": "string (e.g. Coordinate Setup & Free-Body Diagram)",
      "explanation": "string",
      "formulaLatex": "string (optional LaTeX formula)",
      "hint": "string (a subtle guiding hint if the student is stuck)"
    }
  ],
  "finalAnswerLatex": "string (e.g. \\\\boxed{v = \\\\sqrt{2gh}})"
}`;

    try {
      const result = await UniversalAIService.executeJsonRequest<ProblemSolution>(prompt, schemaDesc);
      setSolution(result);
    } catch (err: any) {
      console.error('Solver error:', err);
      setErrorMsg(err.message || 'Failed to solve problem. Please check your AI API key in Settings.');
    } finally {
      setIsSolving(false);
    }
  };

  const toggleHint = (stepIdx: number) => {
    setRevealedHints(prev => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Socratic STEM & Olympiad Solver
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Step-by-step problem breakdown with progressive tiered hints and LaTeX formula derivations.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSolve} className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <textarea
            value={problemText}
            onChange={e => setProblemText(e.target.value)}
            placeholder="Paste a Physics, Math, or Chemistry Olympiad/JEE question (e.g. 'A uniform solid sphere of mass M and radius R rolls without slipping down an incline of angle θ. Find its linear acceleration...')"
            className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[120px] text-sm shadow-inner"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-zinc-500 flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Socratic Mode: Revealing steps progressively builds intuition.
            </span>

            <button
              type="submit"
              disabled={!problemText.trim() || isSolving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-medium text-sm transition-colors cursor-pointer shadow-lg"
            >
              {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSolving ? 'Synthesizing Derivation...' : 'Solve Step-by-Step'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 bg-red-950/20 border border-red-800/30 rounded-xl text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Solution Container */}
        {solution && (
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-8 shadow-2xl space-y-8">
            <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">
                  {solution.topic}
                </span>
                <h3 className="text-xl font-semibold text-zinc-100 mt-3">Structured Derivation</h3>
              </div>

              <button
                onClick={() => setRevealedStepIndex(solution.steps.length - 1)}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700/50"
              >
                Reveal All Steps
              </button>
            </div>

            {/* Key Principles */}
            {solution.keyPrinciples && solution.keyPrinciples.length > 0 && (
              <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Key Principles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {solution.keyPrinciples.map((p, i) => (
                    <span key={i} className="text-xs bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700/50 font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Progressive Socratic Steps */}
            <div className="space-y-6">
              {solution.steps.map((step, idx) => {
                const isRevealed = idx <= revealedStepIndex;
                if (!isRevealed) return null;

                return (
                  <div
                    key={idx}
                    className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4 relative transition-all animate-fadeIn"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-sm font-bold font-mono">
                          {idx + 1}
                        </span>
                        {step.title}
                      </h4>

                      {step.hint && (
                        <button
                          onClick={() => toggleHint(idx)}
                          className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          {revealedHints[idx] ? 'Hide Hint' : 'Need a Hint?'}
                        </button>
                      )}
                    </div>

                    {/* Hint reveal */}
                    {revealedHints[idx] && (
                      <div className="p-4 bg-amber-950/20 border border-amber-800/20 rounded-xl text-xs text-amber-200/90 italic">
                        💡 <strong>Hint:</strong> {step.hint}
                      </div>
                    )}

                    {/* Step Explanation with KaTeX */}
                    <div className="prose prose-invert prose-indigo max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      <Markdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                      >
                        {step.explanation}
                      </Markdown>
                    </div>

                    {/* Formula derivation block */}
                    {step.formulaLatex && (
                      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center overflow-x-auto shadow-inner">
                        <Markdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {`$$${step.formulaLatex.replace(/^\$\$|\$\$$/g, '')}$$`}
                        </Markdown>
                      </div>
                    )}

                    {/* Next step reveal trigger */}
                    {idx === revealedStepIndex && idx < solution.steps.length - 1 && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setRevealedStepIndex(idx + 1)}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/20"
                        >
                          Understood → Proceed to Step {idx + 2}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final Boxed Answer (Revealed when all steps are completed) */}
            {revealedStepIndex >= solution.steps.length - 1 && (
              <div className="p-6 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-500/30 rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Final Result
                </div>
                <div className="text-xl font-bold text-zinc-100 overflow-x-auto py-2">
                  <Markdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {`$$${solution.finalAnswerLatex.replace(/^\$\$|\$\$$/g, '')}$$`}
                  </Markdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
