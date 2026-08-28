import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Network, 
  Sparkles, 
  Search, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Trash2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Upload, 
  X, 
  AlertCircle, 
  Flame, 
  ArrowRight, 
  Link as LinkIcon, 
  Info, 
  Compass
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UniversalAIService } from '../services/universalAIService';

export type SubjectType = 'Physics' | 'Math' | 'Chemistry' | 'Computer Science' | 'General';

export type MasteryStatus = 'Mastered' | 'Practicing' | 'Needs Review' | 'Not Started';

export interface ConceptNode {
  id: string;
  label: string;
  subject: SubjectType;
  mastery: number; // 0 - 100
  status: MasteryStatus;
  x: number;
  y: number;
  prerequisites: string[]; // Node IDs that this concept depends on
  connections?: string[]; // Node IDs that depend on this or are linked
  description?: string;
  keyFormulas?: string;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

// Rich Initial Default Constellation for Savantix
const DEFAULT_CONCEPTS: ConceptNode[] = [
  // Physics Cluster
  {
    id: 'p1',
    label: 'Kinematics & Vectors',
    subject: 'Physics',
    mastery: 0,
    status: 'Not Started',
    x: 200,
    y: 130,
    prerequisites: [],
    description: 'Foundational 1D/2D kinematics, projectile motion, calculus of trajectories, and relative velocity frames.',
    keyFormulas: 'v = u + at, s = ut + 0.5at^2, v_rel = v_A - v_B'
  },
  {
    id: 'p2',
    label: "Newton's Laws & Friction",
    subject: 'Physics',
    mastery: 0,
    status: 'Not Started',
    x: 380,
    y: 90,
    prerequisites: ['p1'],
    description: 'Free-body diagrams, pseudo forces in non-inertial frames, static/kinetic friction cones.',
    keyFormulas: 'ΣF = ma, f_s ≤ μ_s N, F_pseudo = -m a_frame'
  },
  {
    id: 'p3',
    label: 'Work, Energy & Power',
    subject: 'Physics',
    mastery: 0,
    status: 'Not Started',
    x: 360,
    y: 220,
    prerequisites: ['p1'],
    description: 'Conservative vs non-conservative fields, Work-Energy Theorem, potential energy curves, and stable equilibria.',
    keyFormulas: 'W_net = ΔK, F = -dU/dx, P = F · v'
  },
  {
    id: 'p4',
    label: 'Rotational Dynamics & Torque',
    subject: 'Physics',
    mastery: 0,
    status: 'Not Started',
    x: 560,
    y: 120,
    prerequisites: ['p2', 'p3'],
    description: 'Moment of inertia tensors, torque, pure rolling without slipping, and angular momentum conservation.',
    keyFormulas: 'τ = Iα = dL/dt, K_total = 0.5mv_cm^2 + 0.5I_cmω^2'
  },
  {
    id: 'p5',
    label: 'Simple Harmonic Motion & Waves',
    subject: 'Physics',
    mastery: 0,
    status: 'Not Started',
    x: 550,
    y: 260,
    prerequisites: ['p3'],
    description: 'Linear & angular SHM, damped/forced oscillations, resonance, and wave superposition.',
    keyFormulas: 'd^2x/dt^2 + ω^2 x = 0, T = 2π√(m/k), y = A sin(kx - ωt)'
  },
  {
    id: 'p6',
    label: 'Electromagnetism & Induction',
    subject: 'Physics',
    mastery: 0,
    status: 'Not Started',
    x: 740,
    y: 180,
    prerequisites: ['p4', 'm3'],
    description: 'Gauss Law, Biot-Savart, Faraday induction, Lenz law, self/mutual inductance, and AC circuits.',
    keyFormulas: '∮E·dA = Q/ε0, ε = -dΦ_B/dt, E = -L(dI/dt)'
  },

  // Math Cluster
  {
    id: 'm1',
    label: 'Functions, Sets & Limits',
    subject: 'Math',
    mastery: 0,
    status: 'Not Started',
    x: 200,
    y: 380,
    prerequisites: [],
    description: 'Domain & range analysis, injectivity/surjectivity, epsilon-delta limits, and asymptotic behavior.',
    keyFormulas: 'lim(x→0) sin(x)/x = 1, f(g(x)) composition'
  },
  {
    id: 'm2',
    label: 'Differential Calculus',
    subject: 'Math',
    mastery: 0,
    status: 'Not Started',
    x: 370,
    y: 360,
    prerequisites: ['m1'],
    description: 'Chain rule, Mean Value Theorems, Taylor expansions, curvature, and multi-variable partial derivatives.',
    keyFormulas: "f'(x) = lim (f(x+h)-f(x))/h, L'Hopital Rule, LMVT"
  },
  {
    id: 'm3',
    label: 'Integral Calculus & Series',
    subject: 'Math',
    mastery: 0,
    status: 'Not Started',
    x: 550,
    y: 400,
    prerequisites: ['m2'],
    description: 'Riemann sums, integration by parts, trigonometric substitutions, improper integrals, and Leibniz integral rule.',
    keyFormulas: '∫ u dv = uv - ∫ v du, d/dx ∫_a(x)^b(x) f(t) dt'
  },
  {
    id: 'm4',
    label: 'Differential Equations',
    subject: 'Math',
    mastery: 0,
    status: 'Not Started',
    x: 740,
    y: 360,
    prerequisites: ['m3'],
    description: 'First-order linear ODEs, integrating factors, homogeneous equations, second-order linear ODEs with constant coefficients.',
    keyFormulas: 'dy/dx + P(x)y = Q(x) → IF = e^(∫P dx)'
  },
  {
    id: 'm5',
    label: 'Linear Algebra & Matrices',
    subject: 'Math',
    mastery: 0,
    status: 'Not Started',
    x: 550,
    y: 520,
    prerequisites: ['m2'],
    description: 'Matrix transformations, determinants, eigenvalues, eigenvectors, and orthogonal projections.',
    keyFormulas: 'det(A - λI) = 0, Av = λv, A^-1 = adj(A)/det(A)'
  },

  // Chemistry Cluster
  {
    id: 'c1',
    label: 'Atomic Structure & Bonding',
    subject: 'Chemistry',
    mastery: 0,
    status: 'Not Started',
    x: 200,
    y: 640,
    prerequisites: [],
    description: 'Quantum numbers, orbital hybridization (sp, sp2, sp3), VSEPR geometry, and Molecular Orbital Theory.',
    keyFormulas: 'Bond Order = 0.5(N_b - N_a), λ = h/(mv)'
  },
  {
    id: 'c2',
    label: 'Chemical Thermodynamics',
    subject: 'Chemistry',
    mastery: 0,
    status: 'Not Started',
    x: 370,
    y: 620,
    prerequisites: ['c1', 'p3'],
    description: 'First & Second Laws, enthalpy of reaction, entropy changes, Gibbs free energy, and spontaneity criteria.',
    keyFormulas: 'ΔG = ΔH - TΔS, ΔG° = -RT ln(K_eq)'
  },
  {
    id: 'c3',
    label: 'Chemical Kinetics & Equilibrium',
    subject: 'Chemistry',
    mastery: 0,
    status: 'Not Started',
    x: 550,
    y: 650,
    prerequisites: ['c2', 'm2'],
    description: 'Rate laws, Arrhenius temperature dependence, Le Chatelier principle, and reaction mechanisms.',
    keyFormulas: 'k = A e^(-E_a/RT), t_1/2 = 0.693/k (1st order)'
  },
  {
    id: 'c4',
    label: 'Organic Reaction Mechanisms',
    subject: 'Chemistry',
    mastery: 0,
    status: 'Not Started',
    x: 740,
    y: 620,
    prerequisites: ['c1', 'c3'],
    description: 'SN1/SN2 substitutions, E1/E2 eliminations, electrophilic aromatic substitution, carbonyl nucleophilic addition.',
    keyFormulas: 'Walden inversion (SN2), Carbocation stability 3° > 2° > 1°'
  },
  {
    id: 'c5',
    label: 'Electrochemistry & Redox',
    subject: 'Chemistry',
    mastery: 0,
    status: 'Not Started',
    x: 740,
    y: 740,
    prerequisites: ['c2', 'p6'],
    description: 'Galvanic cells, standard reduction potentials, Nernst equation, electrolytic cells, and Faraday laws of electrolysis.',
    keyFormulas: 'E_cell = E°_cell - (0.0591/n) log Q, ΔG° = -nFE°'
  }
];

// Extensive STEM Knowledge Decomposer Rules
const STEM_KNOWLEDGE_DECOMPOSITIONS: Record<string, { subject: SubjectType; nodes: Omit<ConceptNode, 'id' | 'x' | 'y'>[] }> = {
  'rotational dynamics': {
    subject: 'Physics',
    nodes: [
      { label: 'Torque & Static Equilibrium', subject: 'Physics', mastery: 85, status: 'Mastered', prerequisites: [], description: 'Vector cross products of force & lever arm, condition for rotational equilibrium Στ = 0.' },
      { label: 'Moment of Inertia & Parallel Axis', subject: 'Physics', mastery: 75, status: 'Practicing', prerequisites: ['Torque & Static Equilibrium'], description: 'Mass distribution integrals I = ∫ r^2 dm, Steiner parallel and perpendicular axis theorems.' },
      { label: 'Angular Momentum & Conservation', subject: 'Physics', mastery: 60, status: 'Practicing', prerequisites: ['Moment of Inertia & Parallel Axis'], description: 'L = Iω, conservation of angular momentum when net external torque is zero.' },
      { label: 'Rolling Motion without Slipping', subject: 'Physics', mastery: 45, status: 'Needs Review', prerequisites: ['Angular Momentum & Conservation', 'Torque & Static Equilibrium'], description: 'Kinematics and energy of combined translation and rotation: v_cm = Rω, a_cm = Rα.' },
      { label: 'Gyroscopic Precession & Top Dynamics', subject: 'Physics', mastery: 20, status: 'Not Started', prerequisites: ['Rolling Motion without Slipping'], description: 'Precession frequency Ω = τ / L, nutation, and Euler equations of rigid bodies.' }
    ]
  },
  'electromagnetism': {
    subject: 'Physics',
    nodes: [
      { label: 'Electrostatic Fields & Gauss Law', subject: 'Physics', mastery: 90, status: 'Mastered', prerequisites: [], description: 'Electric flux, symmetry surfaces, and divergence of electric fields.' },
      { label: 'Biot-Savart & Ampere Circuital Law', subject: 'Physics', mastery: 75, status: 'Practicing', prerequisites: ['Electrostatic Fields & Gauss Law'], description: 'Magnetic fields produced by moving charges and currents in arbitrary geometries.' },
      { label: 'Faraday Induction & Lenz Law', subject: 'Physics', mastery: 65, status: 'Practicing', prerequisites: ['Biot-Savart & Ampere Circuital Law'], description: 'Motional EMF, changing magnetic flux, and induced electric fields.' },
      { label: 'Maxwell Displacement Current', subject: 'Physics', mastery: 40, status: 'Needs Review', prerequisites: ['Faraday Induction & Lenz Law'], description: 'Correction to Ampere law and symmetry of time-varying electric & magnetic fields.' },
      { label: 'Electromagnetic Wave Equations', subject: 'Physics', mastery: 25, status: 'Not Started', prerequisites: ['Maxwell Displacement Current'], description: 'Wave propagation in vacuum and dielectrics, Poynting vector energy flux.' }
    ]
  },
  'quantum mechanics': {
    subject: 'Physics',
    nodes: [
      { label: 'Wave-Particle Duality & De Broglie', subject: 'Physics', mastery: 85, status: 'Mastered', prerequisites: [], description: 'Photoelectric effect, Compton scattering, and matter waves λ = h/p.' },
      { label: 'Schrodinger Wave Equation', subject: 'Physics', mastery: 60, status: 'Practicing', prerequisites: ['Wave-Particle Duality & De Broglie'], description: 'Time-dependent and time-independent wave equations, Hamiltonian operator.' },
      { label: 'Particle in a 1D Potential Box', subject: 'Physics', mastery: 55, status: 'Practicing', prerequisites: ['Schrodinger Wave Equation'], description: 'Infinite square well boundary conditions, quantization of energy levels.' },
      { label: 'Quantum Harmonic Oscillator', subject: 'Physics', mastery: 35, status: 'Needs Review', prerequisites: ['Particle in a 1D Potential Box'], description: 'Hermite polynomials, zero-point energy E_0 = 0.5ℏω, and ladder operators.' }
    ]
  },
  'differential calculus': {
    subject: 'Math',
    nodes: [
      { label: 'Limits & Continuous Functions', subject: 'Math', mastery: 95, status: 'Mastered', prerequisites: [], description: 'Rigorous limits, squeeze theorem, and Weierstrass intermediate value theorem.' },
      { label: 'Derivatives & Differentiation Rules', subject: 'Math', mastery: 90, status: 'Mastered', prerequisites: ['Limits & Continuous Functions'], description: 'Product rule, quotient rule, chain rule, and implicit differentiation.' },
      { label: 'Mean Value Theorems & Optimization', subject: 'Math', mastery: 75, status: 'Practicing', prerequisites: ['Derivatives & Differentiation Rules'], description: 'Rolle theorem, Lagrange MVT, Cauchy MVT, and critical point concavity tests.' },
      { label: 'Taylor & Maclaurin Series', subject: 'Math', mastery: 60, status: 'Practicing', prerequisites: ['Mean Value Theorems & Optimization'], description: 'Polynomial approximation of analytic functions with remainder estimation.' }
    ]
  },
  'organic mechanisms': {
    subject: 'Chemistry',
    nodes: [
      { label: 'Electrophiles & Nucleophiles', subject: 'Chemistry', mastery: 90, status: 'Mastered', prerequisites: [], description: 'Electron density, carbocation and carbanion stabilities, inductive & mesomeric effects.' },
      { label: 'SN1 vs SN2 Nucleophilic Substitution', subject: 'Chemistry', mastery: 70, status: 'Practicing', prerequisites: ['Electrophiles & Nucleophiles'], description: 'Stereochemistry (inversion vs racemization), solvent effects, leaving group kinetics.' },
      { label: 'E1 vs E2 Elimination Reactions', subject: 'Chemistry', mastery: 60, status: 'Practicing', prerequisites: ['SN1 vs SN2 Nucleophilic Substitution'], description: 'Saytzeff vs Hofmann alkenes, anti-periplanar transition state requirements.' },
      { label: 'Electrophilic Aromatic Substitution', subject: 'Chemistry', mastery: 45, status: 'Needs Review', prerequisites: ['E1 vs E2 Elimination Reactions'], description: 'Arenium ion intermediates, ortho/para vs meta directing groups on benzene rings.' }
    ]
  }
};

export const ConceptGraph: React.FC = () => {
  const { user, logs } = useAppContext();

  // Storage key based on user or guest
  const storageKey = useMemo(() => {
    return `savantix_concept_graph_${user?.uid || 'guest'}`;
  }, [user?.uid]);

  // Main Nodes State
  const [nodes, setNodes] = useState<ConceptNode[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load saved concept graph from localStorage:", e);
    }
    return DEFAULT_CONCEPTS;
  });

  // Active Subject Filter & Search
  const [selectedSubject, setSelectedSubject] = useState<'All' | SubjectType>('All');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => nodes[3]?.id || 'p4');
  const [searchQuery, setSearchQuery] = useState('');

  // Canvas View Transform (Pan & Zoom)
  const [viewTransform, setViewTransform] = useState<{ x: number; y: number; scale: number }>({
    x: 50,
    y: 30,
    scale: 0.9
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging Node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Modals & Panels
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDecomposeModalOpen, setIsDecomposeModalOpen] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [decomposeTopicInput, setDecomposeTopicInput] = useState('');
  const [decomposeSubject, setDecomposeSubject] = useState<SubjectType>('Physics');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // New Concept Form state
  const [newConceptForm, setNewConceptForm] = useState<{
    label: string;
    subject: SubjectType;
    mastery: number;
    status: MasteryStatus;
    prerequisites: string[];
    description: string;
    keyFormulas: string;
  }>({
    label: '',
    subject: 'Physics',
    mastery: 50,
    status: 'Practicing',
    prerequisites: [],
    description: '',
    keyFormulas: ''
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Show temporary toast notification
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  }, []);

  // Save to localStorage whenever nodes change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nodes));
    } catch (e) {
      console.warn("Failed to persist concept graph to localStorage:", e);
    }
  }, [nodes, storageKey]);

  // Load whenever storageKey changes (e.g. login/logout)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNodes(parsed);
          setSelectedNodeId(parsed[0]?.id || null);
          return;
        }
      }
    } catch {}
    setNodes(DEFAULT_CONCEPTS);
    setSelectedNodeId(DEFAULT_CONCEPTS[0]?.id || null);
  }, [storageKey]);

  // Calculate dynamic mastery boost from recent study logs if relevant
  const enrichedNodes = useMemo(() => {
    return nodes.map(node => {
      const relatedLogs = logs.filter(l => 
        l.topic?.toLowerCase().includes(node.label.toLowerCase()) ||
        node.label.toLowerCase().includes(l.topic?.toLowerCase() || '___')
      );

      const totalProblems = relatedLogs.reduce((acc, l) => acc + (Number(l.problemsSolved) || 0), 0);
      const logBoost = totalProblems > 0 ? Math.min(20, Math.round(totalProblems * 1.5)) : 0;
      
      // Keep mastery bounded 0 - 100
      const effectiveMastery = Math.min(100, Math.max(0, node.mastery));
      
      return {
        ...node,
        effectiveMastery,
        logBoost,
        relatedLogsCount: relatedLogs.length
      };
    });
  }, [nodes, logs]);

  // Selected Node Object
  const selectedNode = useMemo(() => {
    return enrichedNodes.find(n => n.id === selectedNodeId) || null;
  }, [enrichedNodes, selectedNodeId]);

  // Filtered nodes by Subject & Search
  const filteredNodes = useMemo(() => {
    return enrichedNodes.filter(n => {
      const matchSub = selectedSubject === 'All' || n.subject === selectedSubject;
      const matchSearch = searchQuery.trim() === '' || 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSub && matchSearch;
    });
  }, [enrichedNodes, selectedSubject, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = nodes.length;
    const mastered = nodes.filter(n => n.status === 'Mastered' || n.mastery >= 85).length;
    const practicing = nodes.filter(n => n.status === 'Practicing' && n.mastery < 85).length;
    const needsReview = nodes.filter(n => n.status === 'Needs Review').length;
    const notStarted = nodes.filter(n => n.status === 'Not Started' || n.mastery === 0).length;
    const avgMastery = total > 0 ? Math.round(nodes.reduce((acc, n) => acc + n.mastery, 0) / total) : 0;

    return { total, mastered, practicing, needsReview, notStarted, avgMastery };
  }, [nodes]);

  // Visual color scheme based on mastery / status
  const getStatusVisuals = (node: ConceptNode) => {
    if (node.status === 'Mastered' || node.mastery >= 85) {
      return {
        stroke: '#10B981', // Emerald-500
        fill: '#064E3B',   // Emerald-900
        glow: 'rgba(16, 185, 129, 0.6)',
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        label: 'Mastered'
      };
    }
    if (node.status === 'Practicing' || (node.mastery >= 50 && node.mastery < 85)) {
      return {
        stroke: '#6366F1', // Indigo-500
        fill: '#312E81',   // Indigo-900
        glow: 'rgba(99, 102, 241, 0.6)',
        badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        label: 'Practicing'
      };
    }
    if (node.status === 'Needs Review' || (node.mastery >= 25 && node.mastery < 50)) {
      return {
        stroke: '#F59E0B', // Amber-500
        fill: '#78350F',   // Amber-900
        glow: 'rgba(245, 158, 11, 0.6)',
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        label: 'Needs Review'
      };
    }
    return {
      stroke: '#71717A', // Zinc-500
      fill: '#27272A',   // Zinc-800
      glow: 'rgba(113, 113, 122, 0.3)',
      badgeBg: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50',
      label: 'Not Started'
    };
  };

  const getSubjectColor = (subject: SubjectType) => {
    switch (subject) {
      case 'Physics': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Math': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Chemistry': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Computer Science': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default: return 'bg-zinc-800/80 text-zinc-300 border-zinc-700';
    }
  };

  // Convert Screen/Mouse coordinates to SVG Graph Space
  const screenToGraphCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - viewTransform.x) / viewTransform.scale;
    const y = (clientY - rect.top - viewTransform.y) / viewTransform.scale;
    return { x, y };
  }, [viewTransform]);

  // Pointer Down on Canvas (Pan initiation)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== svgRef.current && (e.target as HTMLElement).tagName !== 'svg' && (e.target as HTMLElement).id !== 'grid-canvas-bg') {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y });
  };

  // Pointer Down on Node (Drag initiation)
  const handleNodePointerDown = (e: React.PointerEvent, node: ConceptNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);

    const coords = screenToGraphCoordinates(e.clientX, e.clientY);
    setDragOffset({
      x: coords.x - node.x,
      y: coords.y - node.y
    });
  };

  // Global Pointer Move (Handles Dragging or Panning)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingNodeId) {
      const coords = screenToGraphCoordinates(e.clientX, e.clientY);
      const newX = Math.round(coords.x - dragOffset.x);
      const newY = Math.round(coords.y - dragOffset.y);

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      setViewTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    }
  }, [draggingNodeId, isPanning, panStart, dragOffset, screenToGraphCoordinates]);

  // Global Pointer Up (Stops Dragging or Panning)
  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  // Wheel Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setViewTransform(prev => {
      const nextScale = Math.min(2.2, Math.max(0.35, prev.scale * zoomFactor));
      return {
        ...prev,
        scale: nextScale
      };
    });
  }, []);

  // Reset Canvas View to Center
  const handleResetView = () => {
    if (nodes.length === 0) {
      setViewTransform({ x: 50, y: 30, scale: 0.9 });
      return;
    }
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const svgWidth = svgRef.current?.clientWidth || 700;
    const svgHeight = svgRef.current?.clientHeight || 500;

    setViewTransform({
      scale: 0.85,
      x: svgWidth / 2 - centerX * 0.85,
      y: svgHeight / 2 - centerY * 0.85
    });
  };

  // Node CRUD Handlers
  const handleAddConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConceptForm.label.trim()) return;

    // Determine coordinate near center of existing view or offset
    const svgWidth = svgRef.current?.clientWidth || 600;
    const svgHeight = svgRef.current?.clientHeight || 450;
    const centerGraph = screenToGraphCoordinates(svgWidth / 2 + (Math.random() * 80 - 40), svgHeight / 2 + (Math.random() * 80 - 40));

    const newId = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 5);
    const newNode: ConceptNode = {
      id: newId,
      label: newConceptForm.label.trim(),
      subject: newConceptForm.subject,
      mastery: Number(newConceptForm.mastery) || 50,
      status: newConceptForm.status,
      x: Math.round(centerGraph.x),
      y: Math.round(centerGraph.y),
      prerequisites: newConceptForm.prerequisites,
      description: newConceptForm.description.trim() || undefined,
      keyFormulas: newConceptForm.keyFormulas.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);
    setIsAddModalOpen(false);
    setNewConceptForm({
      label: '',
      subject: 'Physics',
      mastery: 50,
      status: 'Practicing',
      prerequisites: [],
      description: '',
      keyFormulas: ''
    });
    showToast(`Added concept "${newNode.label}" to the constellation!`, 'success');
  };

  const handleUpdateNode = (id: string, updates: Partial<ConceptNode>) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        const next = { ...n, ...updates, updatedAt: Date.now() };
        // If mastery was changed, auto-suggest status if not explicitly updated
        if (updates.mastery !== undefined && updates.status === undefined) {
          if (updates.mastery >= 85) next.status = 'Mastered';
          else if (updates.mastery >= 50) next.status = 'Practicing';
          else if (updates.mastery >= 25) next.status = 'Needs Review';
          else next.status = 'Not Started';
        }
        return next;
      }
      return n;
    }));
  };

  const handleDeleteNode = (id: string) => {
    const targetNode = nodes.find(n => n.id === id);
    if (!targetNode) return;

    if (window.confirm(`Are you sure you want to remove "${targetNode.label}" from your concept graph?`)) {
      setNodes(prev => {
        const remaining = prev.filter(n => n.id !== id);
        // Clean up prerequisites references pointing to deleted node
        return remaining.map(n => ({
          ...n,
          prerequisites: n.prerequisites.filter(pId => pId !== id)
        }));
      });

      if (selectedNodeId === id) {
        setSelectedNodeId(null);
      }
      showToast(`Removed "${targetNode.label}"`, 'info');
    }
  };

  const handleTogglePrerequisite = (targetNodeId: string, prereqId: string) => {
    if (targetNodeId === prereqId) return; // Cannot be prerequisite of itself

    setNodes(prev => prev.map(n => {
      if (n.id === targetNodeId) {
        const exists = n.prerequisites.includes(prereqId);
        const nextPrereqs = exists 
          ? n.prerequisites.filter(p => p !== prereqId)
          : [...n.prerequisites, prereqId];
        return {
          ...n,
          prerequisites: nextPrereqs,
          updatedAt: Date.now()
        };
      }
      return n;
    }));
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset concept constellation to standard Olympiad/STEM curriculum defaults? Custom nodes will be restored.")) {
      setNodes(DEFAULT_CONCEPTS);
      setSelectedNodeId(DEFAULT_CONCEPTS[0].id);
      handleResetView();
      showToast("Restored default concept constellation.", 'info');
    }
  };

  // AI & Heuristic Topic Decomposer Execution
  const handleDecomposeTopic = async () => {
    const topic = decomposeTopicInput.trim();
    if (!topic) return;

    setIsDecomposing(true);

    try {
      let subNodes: { label: string; subject: SubjectType; mastery: number; status: MasteryStatus; prerequisites: string[]; description?: string }[] = [];

      // 1. Check local STEM knowledge base first for rapid zero-latency response
      const normalizedTopic = topic.toLowerCase();
      const matchedKey = Object.keys(STEM_KNOWLEDGE_DECOMPOSITIONS).find(k => normalizedTopic.includes(k) || k.includes(normalizedTopic));

      if (matchedKey) {
        const preset = STEM_KNOWLEDGE_DECOMPOSITIONS[matchedKey];
        subNodes = preset.nodes.map(n => ({
          ...n,
          subject: decomposeSubject || preset.subject
        }));
      } else {
        // 2. Attempt AI Generation via UniversalAIService
        try {
          const aiPrompt = `Decompose the STEM academic topic "${topic}" (Subject: ${decomposeSubject}) into 4 to 5 structured learning sub-concepts/prerequisites arranged in a logical dependency hierarchy.`;
          const schemaDesc = `[
            {
              "label": "Concept Name",
              "mastery": 40,
              "status": "Practicing",
              "prerequisites": ["Name of prerequisite concept from this list if any, or empty"],
              "description": "Short explanation of the physical/mathematical mechanism"
            }
          ]`;

          const aiResult = await UniversalAIService.executeJsonRequest<any[]>(aiPrompt, schemaDesc);
          if (Array.isArray(aiResult) && aiResult.length >= 2) {
            subNodes = aiResult.map(item => ({
              label: String(item.label || '').trim(),
              subject: decomposeSubject,
              mastery: Number(item.mastery) || 50,
              status: (item.status as MasteryStatus) || 'Practicing',
              prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [],
              description: String(item.description || '').trim()
            }));
          }
        } catch (aiErr) {
          console.warn("AI Concept Decomposer fallback to dynamic heuristic generator:", aiErr);
        }

        // 3. Fallback Heuristic Generator if AI was unavailable
        if (subNodes.length === 0) {
          subNodes = [
            {
              label: `${topic}: Fundamentals & Axioms`,
              subject: decomposeSubject,
              mastery: 80,
              status: 'Practicing',
              prerequisites: [],
              description: `Fundamental definitions, physical dimensions, and governing laws of ${topic}.`
            },
            {
              label: `${topic}: Governing Equations & Proofs`,
              subject: decomposeSubject,
              mastery: 60,
              status: 'Practicing',
              prerequisites: [`${topic}: Fundamentals & Axioms`],
              description: `Core theoretical derivations, equilibrium states, and algebraic relations in ${topic}.`
            },
            {
              label: `${topic}: Advanced Problem Solving`,
              subject: decomposeSubject,
              mastery: 40,
              status: 'Needs Review',
              prerequisites: [`${topic}: Governing Equations & Proofs`],
              description: `Complex multi-concept synthesis, boundary conditions, and non-ideal constraints.`
            },
            {
              label: `${topic}: Olympiad Edge Cases & Synthesis`,
              subject: decomposeSubject,
              mastery: 20,
              status: 'Not Started',
              prerequisites: [`${topic}: Advanced Problem Solving`],
              description: `High-difficulty competitive problems, asymptotic limits, and interdisciplinary applications.`
            }
          ];
        }
      }

      // Calculate spatial positions for new nodes in a clean cascade
      const startX = 250 + Math.random() * 100;
      const startY = 150 + Math.random() * 100;
      
      const createdNodes: ConceptNode[] = [];
      const labelToIdMap: Record<string, string> = {};

      subNodes.forEach((sn, idx) => {
        const id = 'ai_' + Date.now().toString(36) + '_' + idx + '_' + Math.random().toString(36).substring(2, 5);
        labelToIdMap[sn.label.toLowerCase()] = id;

        // Hierarchical position layout
        const posX = Math.round(startX + (idx * 160) + (Math.sin(idx) * 30));
        const posY = Math.round(startY + (idx * 80) + (idx % 2 === 0 ? -40 : 40));

        createdNodes.push({
          id,
          label: sn.label,
          subject: sn.subject,
          mastery: sn.mastery,
          status: sn.status,
          x: posX,
          y: posY,
          prerequisites: [], // will resolve below
          description: sn.description,
          createdAt: Date.now()
        });
      });

      // Link prerequisite IDs
      createdNodes.forEach((cn, idx) => {
        const originalPrereqs = subNodes[idx].prerequisites;
        const resolvedPrereqs: string[] = [];

        originalPrereqs.forEach(pLabel => {
          const matchId = labelToIdMap[pLabel.toLowerCase()] || 
            createdNodes.find(c => c.label.toLowerCase().includes(pLabel.toLowerCase()))?.id;
          if (matchId && matchId !== cn.id && !resolvedPrereqs.includes(matchId)) {
            resolvedPrereqs.push(matchId);
          }
        });

        // If no explicit prereq and not first node, connect to previous node in chain
        if (resolvedPrereqs.length === 0 && idx > 0) {
          resolvedPrereqs.push(createdNodes[idx - 1].id);
        }

        cn.prerequisites = resolvedPrereqs;
      });

      setNodes(prev => [...prev, ...createdNodes]);
      setSelectedNodeId(createdNodes[0]?.id || null);
      setIsDecomposeModalOpen(false);
      setDecomposeTopicInput('');
      showToast(`Successfully decomposed "${topic}" into ${createdNodes.length} mastery nodes!`, 'success');
    } catch (err: any) {
      showToast(`Decomposition error: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsDecomposing(false);
    }
  };

  // Export JSON Map
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `savantix_concept_constellation_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Concept constellation exported successfully!", 'success');
  };

  // Import JSON Map
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].label) {
            setNodes(parsed);
            setSelectedNodeId(parsed[0].id);
            showToast(`Imported ${parsed.length} concepts into graph!`, 'success');
          } else {
            showToast("Invalid concept graph JSON file structure.", 'error');
          }
        } catch {
          showToast("Failed to parse JSON file.", 'error');
        }
      };
    }
  };

  // Calculate directed connection arrows between prerequisites and targets
  const connectionLines = useMemo(() => {
    const lines: Array<{
      id: string;
      source: ConceptNode;
      target: ConceptNode;
      isHighlighted: boolean;
      isPrerequisiteOfSelected: boolean;
      isDependentOfSelected: boolean;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    nodes.forEach(target => {
      target.prerequisites.forEach(prereqId => {
        const source = nodes.find(n => n.id === prereqId);
        if (!source) return;

        const isPrerequisiteOfSelected = selectedNodeId === target.id;
        const isDependentOfSelected = selectedNodeId === source.id;
        const isHighlighted = isPrerequisiteOfSelected || isDependentOfSelected;

        // Calculate offset so arrow stops at node boundary (~26px radius)
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const radius = 26;

        const x1 = source.x + (dx / dist) * radius;
        const y1 = source.y + (dy / dist) * radius;
        const x2 = target.x - (dx / dist) * (radius + 6);
        const y2 = target.y - (dy / dist) * (radius + 6);

        lines.push({
          id: `${source.id}->${target.id}`,
          source,
          target,
          isHighlighted,
          isPrerequisiteOfSelected,
          isDependentOfSelected,
          x1,
          y1,
          x2,
          y2
        });
      });
    });

    return lines;
  }, [nodes, selectedNodeId]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden select-none relative"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
          feedbackToast.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50' :
          feedbackToast.type === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-950/50' :
          'bg-indigo-950/90 text-indigo-300 border-indigo-500/40 shadow-indigo-950/50'
        }`}>
          {feedbackToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
           feedbackToast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> :
           <Info className="w-4 h-4 text-indigo-400" />}
          {feedbackToast.message}
        </div>
      )}

      {/* Top Header & Constellation Stats */}
      <div className="p-4 sm:p-5 bg-zinc-900/40 backdrop-blur-xl border-b border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Network className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">Concept Mastery Constellation</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Interactive Graph
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">
              Drag nodes, link prerequisites with arrows, edit mastery sliders, and decompose topics with AI.
            </p>
          </div>
        </div>

        {/* Constellation Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Total:</span>
            <span className="font-bold text-zinc-200">{stats.total}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/30 rounded-xl border border-emerald-500/20 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="font-semibold">Mastered: {stats.mastered}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-950/30 rounded-xl border border-indigo-500/20 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="font-semibold">Practicing: {stats.practicing}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/30 rounded-xl border border-amber-500/20 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="font-semibold">Review: {stats.needsReview}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-400">Avg Mastery:</span>
            <span className="font-bold text-emerald-400">{stats.avgMastery}%</span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Action Controls */}
      <div className="px-4 py-2.5 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900/70 rounded-xl border border-zinc-800">
          {(['All', 'Physics', 'Math', 'Chemistry', 'Computer Science'] as const).map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search concepts or laws..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons: Add Node, Decompose, Reset, Export/Import */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            title="Create a new custom concept node"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Concept</span>
          </button>

          <button
            onClick={() => setIsDecomposeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            title="Decompose any complex topic with AI into structured prerequisites"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Decompose</span>
          </button>

          <div className="h-5 w-[1px] bg-zinc-800 mx-1 hidden sm:block" />

          <button
            onClick={handleExportJSON}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors"
            title="Export Graph to JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label 
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
            title="Import Graph from JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleResetDefaults}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl border border-zinc-800 transition-colors"
            title="Reset to default constellation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace: SVG Graph Viewport + Interactive Node Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* SVG Interactive Canvas */}
        <div 
          className="flex-1 relative overflow-hidden bg-zinc-950 cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onPointerDown={handleCanvasPointerDown}
        >
          {/* Canvas Floating Controls */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1 bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 shadow-xl">
            <button
              onClick={() => setViewTransform(prev => ({ ...prev, scale: Math.min(2.2, prev.scale * 1.15) }))}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewTransform(prev => ({ ...prev, scale: Math.max(0.35, prev.scale * 0.85) }))}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewTransform(prev => ({ ...prev, scale: 1.0 }))}
              className="px-2.5 py-1 text-[11px] font-mono font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Reset Zoom to 100%"
            >
              {Math.round(viewTransform.scale * 100)}%
            </button>
            <button
              onClick={handleResetView}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Center and fit all nodes"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas Legend Overlay */}
          <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mastered (≥85%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Practicing (50-84%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Review (25-49%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Not Started (&lt;25%)</span>
            </div>
          </div>

          {/* SVG Canvas Element */}
          <svg
            ref={svgRef}
            id="concept-graph-canvas"
            className="w-full h-full"
          >
            {/* Definitions: Gradients, Filters, Arrow Markers */}
            <defs>
              {/* Star Grid Pattern */}
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#27272A" opacity="0.6" />
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#18181B" strokeWidth="0.5" />
              </pattern>

              {/* Glowing Filters */}
              <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-indigo" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Arrow Markers */}
              <marker
                id="marker-arrow-normal"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#52525B" />
              </marker>

              <marker
                id="marker-arrow-highlight"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#818CF8" />
              </marker>

              <marker
                id="marker-arrow-incoming"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#34D399" />
              </marker>
            </defs>

            {/* Background Grid Pattern Rect */}
            <rect
              id="grid-canvas-bg"
              x="-2000"
              y="-2000"
              width="6000"
              height="6000"
              fill="url(#grid-pattern)"
            />

            {/* Graph Group subjected to Pan & Zoom transforms */}
            <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.scale})`}>
              {/* Directed Connection Arrows (Edges) */}
              {connectionLines.map(line => {
                const markerUrl = line.isPrerequisiteOfSelected 
                  ? 'url(#marker-arrow-incoming)'
                  : line.isHighlighted 
                  ? 'url(#marker-arrow-highlight)' 
                  : 'url(#marker-arrow-normal)';

                const strokeColor = line.isPrerequisiteOfSelected
                  ? '#34D399' // Emerald-400
                  : line.isDependentOfSelected
                  ? '#818CF8' // Indigo-400
                  : '#3F3F46'; // Zinc-700

                const strokeWidth = line.isHighlighted ? 2.5 : 1.5;

                return (
                  <g key={line.id}>
                    {/* Shadow line for glow when highlighted */}
                    {line.isHighlighted && (
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={strokeColor}
                        strokeWidth="6"
                        strokeOpacity="0.25"
                        strokeLinecap="round"
                      />
                    )}
                    <line
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={line.isHighlighted ? 'none' : '4 4'}
                      markerEnd={markerUrl}
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Concept Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isPrereqOfSelected = selectedNode?.prerequisites.includes(node.id);
                const isDependentOfSelected = node.prerequisites.includes(selectedNodeId || '');
                const visuals = getStatusVisuals(node);
                const radius = 26;

                // Circumference for progress ring (2 * π * r) with r = 24
                const ringRadius = 24;
                const circumference = 2 * Math.PI * ringRadius;
                const strokeDashoffset = circumference - (node.effectiveMastery / 100) * circumference;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onPointerDown={(e) => handleNodePointerDown(e, node)}
                    className="cursor-pointer group select-none"
                  >
                    {/* Outer Pulsing Glow Halo for Selected Node */}
                    {isSelected && (
                      <circle
                        r={radius + 12}
                        fill={visuals.stroke}
                        opacity="0.2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Prerequisite / Dependent indicator halo */}
                    {(isPrereqOfSelected || isDependentOfSelected) && !isSelected && (
                      <circle
                        r={radius + 8}
                        fill={isPrereqOfSelected ? '#10B981' : '#6366F1'}
                        opacity="0.15"
                      />
                    )}

                    {/* Node Core Background Circle */}
                    <circle
                      r={radius}
                      fill={visuals.fill}
                      stroke={visuals.stroke}
                      strokeWidth={isSelected ? '3' : '1.5'}
                      className="transition-all duration-300 group-hover:scale-110 shadow-2xl"
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 10px ${visuals.glow})` : undefined
                      }}
                    />

                    {/* Concentric Mastery Progress Ring */}
                    <circle
                      r={ringRadius}
                      fill="none"
                      stroke={visuals.stroke}
                      strokeWidth="2.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform={`rotate(-90)`}
                      className="transition-all duration-500"
                    />

                    {/* Center Percentage Display */}
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="10.5"
                      fontWeight="bold"
                      fill="#FFFFFF"
                      className="pointer-events-none font-mono tracking-tight"
                    >
                      {node.effectiveMastery}%
                    </text>

                    {/* Subject Pill Badge Above Node */}
                    <g transform="translate(0, -36)">
                      <rect
                        x="-30"
                        y="-8"
                        width="60"
                        height="16"
                        rx="8"
                        fill="#18181B"
                        stroke="#27272A"
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#A1A1AA"
                        className="pointer-events-none uppercase tracking-wider"
                      >
                        {node.subject.slice(0, 4)}
                      </text>
                    </g>

                    {/* Concept Label Pill Below Node */}
                    <g transform="translate(0, 36)">
                      <rect
                        x={-Math.min(100, Math.max(35, node.label.length * 3.4))}
                        y="-9"
                        width={Math.min(200, Math.max(70, node.label.length * 6.8))}
                        height="18"
                        rx="9"
                        fill={isSelected ? '#18181B' : '#09090B'}
                        stroke={isSelected ? visuals.stroke : '#27272A'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        opacity="0.95"
                      />
                      <text
                        textAnchor="middle"
                        dy="3"
                        fontSize="10"
                        fontWeight={isSelected ? '700' : '500'}
                        fill={isSelected ? '#FFFFFF' : '#D4D4D8'}
                        className="pointer-events-none truncate"
                      >
                        {node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right Sidebar: Dynamic Inspector & Node Editor Drawer */}
        <div className="w-full lg:w-96 bg-zinc-900/70 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-zinc-800/80 flex flex-col max-h-[460px] lg:max-h-full overflow-y-auto z-10 shadow-2xl">
          {selectedNode ? (
            <div className="p-5 space-y-5">
              {/* Header: Subject & Label */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getSubjectColor(selectedNode.subject)}`}>
                      {selectedNode.subject}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusVisuals(selectedNode).badgeBg}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={e => handleUpdateNode(selectedNode.id, { label: e.target.value })}
                    className="text-lg font-bold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none w-full py-0.5"
                    title="Click to edit concept name"
                  />
                </div>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete concept from graph"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Mastery Slider */}
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Mastery Rating
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-400">{selectedNode.effectiveMastery}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedNode.mastery}
                  onChange={e => handleUpdateNode(selectedNode.id, { mastery: Number(e.target.value) })}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex items-center justify-between gap-1 pt-1">
                  <button
                    onClick={() => handleUpdateNode(selectedNode.id, { mastery: Math.max(0, selectedNode.mastery - 10) })}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[11px] font-semibold text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleUpdateNode(selectedNode.id, { mastery: Math.min(100, selectedNode.mastery + 10) })}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[11px] font-semibold text-zinc-300 border border-zinc-800 transition-colors"
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => handleUpdateNode(selectedNode.id, { mastery: 100, status: 'Mastered' })}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-semibold border border-emerald-500/30 transition-colors"
                  >
                    Mastered 100%
                  </button>
                </div>

                {selectedNode.logBoost > 0 && (
                  <div className="text-[11px] text-amber-400/90 flex items-center gap-1.5 pt-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>+{selectedNode.logBoost}% boost from {selectedNode.relatedLogsCount} logged study sessions</span>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Learning Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Mastered', 'Practicing', 'Needs Review', 'Not Started'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateNode(selectedNode.id, { status: st })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all text-left flex items-center justify-between ${
                        selectedNode.status === st
                          ? 'bg-zinc-800 text-zinc-100 border-indigo-500/60 shadow-sm'
                          : 'bg-zinc-950/40 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                      }`}
                    >
                      <span>{st}</span>
                      {selectedNode.status === st && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prerequisites Manager (Dynamic Directed Linking) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Prerequisites ({selectedNode.prerequisites.length})
                  </label>
                  <span className="text-[10px] text-zinc-500">Toggle to link</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {nodes.filter(n => n.id !== selectedNode.id).map(otherNode => {
                    const isPrereq = selectedNode.prerequisites.includes(otherNode.id);
                    return (
                      <div
                        key={otherNode.id}
                        onClick={() => handleTogglePrerequisite(selectedNode.id, otherNode.id)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                          isPrereq
                            ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-zinc-950/40 text-zinc-400 border-zinc-800/60 hover:bg-zinc-900 hover:text-zinc-200'
                        }`}
                      >
                        <span className="font-medium truncate max-w-[180px]">{otherNode.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500">{otherNode.mastery}%</span>
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isPrereq ? 'bg-emerald-500 border-emerald-400 text-zinc-950' : 'border-zinc-700'
                          }`}>
                            {isPrereq && '✓'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description & Formulas */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Core Mechanism / Concept Notes
                  </label>
                  <textarea
                    rows={2}
                    value={selectedNode.description || ''}
                    onChange={e => handleUpdateNode(selectedNode.id, { description: e.target.value })}
                    placeholder="Add brief conceptual notes, key intuition, or Olympiad tips..."
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Key Formulas / Equations
                  </label>
                  <input
                    type="text"
                    value={selectedNode.keyFormulas || ''}
                    onChange={e => handleUpdateNode(selectedNode.id, { keyFormulas: e.target.value })}
                    placeholder="e.g. τ = Iα, E = mc^2, ΔG = ΔH - TΔS"
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Connected Unlocked Next Concepts */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  Direct Downstream Dependents
                </h4>
                {nodes.filter(n => n.prerequisites.includes(selectedNode.id)).length > 0 ? (
                  <div className="space-y-1.5">
                    {nodes.filter(n => n.prerequisites.includes(selectedNode.id)).map(depNode => (
                      <div
                        key={depNode.id}
                        onClick={() => setSelectedNodeId(depNode.id)}
                        className="flex items-center justify-between p-2.5 bg-zinc-950/40 hover:bg-zinc-800/60 rounded-xl text-xs text-zinc-300 cursor-pointer border border-zinc-800 transition-colors"
                      >
                        <span className="font-medium">{depNode.label}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic p-2 bg-zinc-950/30 rounded-xl border border-zinc-800/40">
                    Terminal concept. No higher-tier topics depend on this yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center text-zinc-500 h-full space-y-3">
              <Network className="w-10 h-10 text-zinc-700" />
              <h3 className="text-sm font-semibold text-zinc-300">Select or Add a Concept</h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Click any node to adjust its mastery slider, edit notes, link prerequisites, or drag to reposition.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                + Create First Concept
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New Concept Node */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Concept Node
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddConcept} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Concept / Topic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Non-inertial Reference Frames & Coriolis Force"
                  value={newConceptForm.label}
                  onChange={e => setNewConceptForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Subject</label>
                  <select
                    value={newConceptForm.subject}
                    onChange={e => setNewConceptForm(prev => ({ ...prev, subject: e.target.value as SubjectType }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Math">Math</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Status</label>
                  <select
                    value={newConceptForm.status}
                    onChange={e => setNewConceptForm(prev => ({ ...prev, status: e.target.value as MasteryStatus }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Mastered">Mastered (85-100%)</option>
                    <option value="Practicing">Practicing (50-84%)</option>
                    <option value="Needs Review">Needs Review (25-49%)</option>
                    <option value="Not Started">Not Started (0-24%)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-zinc-400 font-semibold">Initial Mastery</span>
                  <span className="font-bold text-emerald-400">{newConceptForm.mastery}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newConceptForm.mastery}
                  onChange={e => setNewConceptForm(prev => ({ ...prev, mastery: Number(e.target.value) }))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Prerequisites (Optional)</label>
                <div className="max-h-28 overflow-y-auto p-2 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
                  {nodes.map(n => {
                    const isSelected = newConceptForm.prerequisites.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNewConceptForm(prev => ({
                            ...prev,
                            prerequisites: isSelected 
                              ? prev.prerequisites.filter(id => id !== n.id)
                              : [...prev.prerequisites, n.id]
                          }));
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer ${
                          isSelected ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40' : 'text-zinc-400 hover:bg-zinc-900'
                        }`}
                      >
                        <span>{n.label}</span>
                        <span className="font-mono text-[10px] text-zinc-500">{n.subject}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Create Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI / Heuristic Concept Decomposer */}
      {isDecomposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Topic Decomposer
              </h3>
              <button
                onClick={() => !isDecomposing && setIsDecomposeModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
                disabled={isDecomposing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Input any topic (e.g. <span className="text-indigo-300 font-semibold">"Rotational Dynamics"</span>, <span className="text-indigo-300 font-semibold">"Differential Equations"</span>, or <span className="text-indigo-300 font-semibold">"Organic Chemistry"</span>).
              The AI will decompose it into 3-5 structured prerequisite nodes with directed connection arrows!
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Target Topic *</label>
                <input
                  type="text"
                  placeholder="e.g. Rotational Dynamics, Quantum Mechanics, Complex Analysis..."
                  value={decomposeTopicInput}
                  onChange={e => setDecomposeTopicInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isDecomposing && handleDecomposeTopic()}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Subject Area</label>
                <select
                  value={decomposeSubject}
                  onChange={e => setDecomposeSubject(e.target.value as SubjectType)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="Physics">Physics</option>
                  <option value="Math">Math</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Quick Topic Chips */}
              <div>
                <span className="text-[10px] text-zinc-500 block mb-1.5">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Rotational Dynamics', 'Quantum Mechanics', 'Differential Calculus', 'Organic Mechanisms', 'Electromagnetism'].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDecomposeTopicInput(sug)}
                      className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-[10px] font-medium border border-zinc-800/80 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDecomposeModalOpen(false)}
                disabled={isDecomposing}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDecomposing || !decomposeTopicInput.trim()}
                onClick={handleDecomposeTopic}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                {isDecomposing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Decomposing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Constellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

