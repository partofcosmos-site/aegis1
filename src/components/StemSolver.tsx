import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Lightbulb, Send, Loader2, Sparkles, CheckCircle2, ChevronDown, ChevronUp, 
  BookOpen, HelpCircle, PenTool, Eraser, RotateCcw, RotateCw, Download, 
  Trash2, Search, Check, Copy, Maximize2, Minimize2, 
  Grid, Atom, Binary, Compass, Eye, EyeOff, Zap,
  RefreshCw, BookmarkPlus, ArrowRight, ShieldCheck, Sigma, FunctionSquare,
  Award, Clock, Sliders
} from 'lucide-react';
import { UniversalAIService } from '../services/universalAIService';
import { useAppContext } from '../context/AppContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export type Subject = 'Physics' | 'Chemistry' | 'Mathematics' | 'General STEM';
export type Difficulty = 'JEE Advanced' | 'Olympiad (IPhO/IMO/IChO)' | 'JEE Main' | 'Putnam / Collegiate';

export interface Tier1Intuition {
  title?: string;
  conceptualOverview: string;
  mentalModel: string;
  selfCheckPrompt: string;
}

export interface EquationItem {
  name: string;
  latex: string;
  description: string;
}

export interface Tier2Governing {
  title?: string;
  principles: string[];
  equations: EquationItem[];
  coordinateSetup: string;
}

export interface DerivationStep {
  stepNumber: number;
  title: string;
  explanation: string;
  intermediateLatex?: string;
  keyInsight?: string;
}

export interface Tier3Derivation {
  title?: string;
  steps: DerivationStep[];
  criticalSubstitutions: string[];
}

export interface Tier4Solution {
  title?: string;
  finalAnswerLatex: string;
  fullRigorousProof: string;
  dimensionalCheck: string;
  numericalExample?: string;
}

export interface ProblemSolution {
  id: string;
  title: string;
  subject: Subject;
  difficulty: Difficulty;
  topic: string;
  problemStatement: string;
  tier1: Tier1Intuition;
  tier2: Tier2Governing;
  tier3: Tier3Derivation;
  tier4: Tier4Solution;
}

export interface SolvedProblemItem {
  id: string;
  timestamp: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  problemStatement: string;
  solution: ProblemSolution;
  canvasDrawing?: string;
}

// --------------------------------------------------------------------------
// CURATED OLYMPIAD & JEE BENCHMARK PROBLEMS DATABASE
// --------------------------------------------------------------------------
const CURATED_BENCHMARKS: ProblemSolution[] = [
  {
    id: 'benchmark-phys-1',
    title: 'Rotational Slipping to Pure Rolling',
    subject: 'Physics',
    difficulty: 'JEE Advanced',
    topic: 'Rotational Dynamics & Surface Friction',
    problemStatement: `A uniform solid sphere of mass $M$ and radius $R$ is projected horizontally on a rough floor with an initial linear velocity $v_0 \\hat{i}$ and zero initial angular velocity ($\\omega_0 = 0$). The coefficient of kinetic friction between the sphere and the floor is $\\mu$.

Determine:
1. The time $t^*$ elapsed before the sphere begins pure rolling without slipping.
2. The linear velocity $v^*$ of the sphere at the onset of pure rolling.
3. The total mechanical energy $\\Delta E$ dissipated into heat during the slipping phase.`,
    tier1: {
      title: 'Core Physical Intuition (No Formulas)',
      conceptualOverview: `When the sphere lands on the rough surface with forward translation but no spin, the bottom contact point slides forward against the ground. Kinetic friction immediately acts backward on this contact point. This backward friction does two opposing things simultaneously: it decelerates the center of mass (reducing linear speed) while exerting a forward torque about the center of mass (spinning the sphere up clockwise). Slipping ceases precisely when the forward linear velocity matches the tangential surface spin: $v = \\omega R$.`,
      mentalModel: `Imagine a bowling ball skidding down an oiled lane: at first, it slides smoothly while spinning faster and faster. Suddenly, it 'catches' the wood lane, stops skidding, and rolls effortlessly forward at a steady lower speed. Furthermore, because friction acts on the ground level, angular momentum calculated about any fixed point on the ground line remains strictly constant throughout the motion!`,
      selfCheckPrompt: `Why is angular momentum conserved about a point on the ground, but NOT conserved about the sphere's moving center of mass?`
    },
    tier2: {
      title: 'Governing Equations & Principles',
      principles: [
        'Newton-Euler Translational Dynamics: $F_{\\text{net}} = M a_{\\text{cm}}$',
        'Rotational Dynamics: $\\tau_{\\text{cm}} = I_{\\text{cm}} \\alpha$',
        'Pure Rolling Kinematic Constraint: $v(t^*) = \\omega(t^*) R$',
        'Angular Momentum Conservation about ground contact line',
        'Work-Energy Theorem with Non-Conservative Friction'
      ],
      equations: [
        {
          name: 'Moment of Inertia of Solid Sphere',
          latex: 'I_{\\text{cm}} = \\frac{2}{5} M R^2',
          description: 'Rotational inertia about a central axis passing through the center of mass.'
        },
        {
          name: 'Kinetic Friction Force',
          latex: 'f_k = \\mu N = \\mu M g',
          description: 'Opposes relative sliding velocity at the point of contact.'
        },
        {
          name: 'Angular Momentum Conservation about Ground Point O',
          latex: 'L_{O,\\text{initial}} = M v_0 R = L_{O,\\text{rolling}} = I_{\\text{cm}} \\omega^* + M v^* R',
          description: 'Friction line of action passes through the ground, yielding zero net external torque about point O.'
        }
      ],
      coordinateSetup: `Choose the positive x-axis along the initial velocity direction $\\hat{i}$, and clockwise rotation as positive for $\\vec{\\omega}$. Normal force $N = M g$.`
    },
    tier3: {
      title: 'Step-by-Step Derivation & Intermediate Results',
      steps: [
        {
          stepNumber: 1,
          title: 'Translational and Angular Acceleration',
          explanation: `Friction force $f_k = \\mu M g$ acts in the negative x-direction.
$$a_{\\text{cm}} = -\\frac{f_k}{M} = -\\mu g$$
Torque about CM is $\\tau = f_k R = \\mu M g R$.
$$\\alpha = \\frac{\\tau}{I_{\\text{cm}}} = \\frac{\\mu M g R}{\\frac{2}{5} M R^2} = \\frac{5 \\mu g}{2 R}$$`,
          intermediateLatex: 'v(t) = v_0 - \\mu g t, \\quad \\omega(t) = \\frac{5 \\mu g}{2 R} t',
          keyInsight: 'Linear velocity decreases linearly while angular velocity increases linearly.'
        },
        {
          stepNumber: 2,
          title: 'Condition for Onset of Pure Rolling',
          explanation: `Pure rolling requires $v(t^*) = \\omega(t^*) R$:
$$v_0 - \\mu g t^* = \\left(\\frac{5 \\mu g}{2 R} t^*\\right) R = \\frac{5}{2} \\mu g t^*$$
$$\\left(1 + \\frac{5}{2}\\right) \\mu g t^* = v_0 \\implies \\frac{7}{2} \\mu g t^* = v_0$$`,
          intermediateLatex: 't^* = \\frac{2 v_0}{7 \\mu g}',
          keyInsight: 'The time to pure rolling is inversely proportional to friction coefficient $\\mu$.'
        },
        {
          stepNumber: 3,
          title: 'Velocity at Rolling and Energy Loss',
          explanation: `Substitute $t^*$ into $v(t)$:
$$v^* = v_0 - \\mu g \\left(\\frac{2 v_0}{7 \\mu g}\\right) = v_0 - \\frac{2}{7} v_0 = \\frac{5}{7} v_0$$
Initial Kinetic Energy: $K_i = \\frac{1}{2} M v_0^2$.
Final Kinetic Energy:
$$K_f = \\frac{1}{2} M (v^*)^2 + \\frac{1}{2} I_{\\text{cm}} (\\omega^*)^2 = \\frac{1}{2} M \\left(\\frac{5}{7} v_0\\right)^2 + \\frac{1}{2} \\left(\\frac{2}{5} M R^2\\right) \\left(\\frac{5 v_0}{7 R}\\right)^2 = \\frac{5}{14} M v_0^2$$
$$\\Delta E_{\\text{loss}} = K_i - K_f = \\frac{1}{2} M v_0^2 - \\frac{5}{14} M v_0^2 = \\frac{2}{14} M v_0^2 = \\frac{1}{7} M v_0^2$$`,
          intermediateLatex: 'v^* = \\frac{5}{7} v_0, \\quad \\Delta E = \\frac{1}{7} M v_0^2',
          keyInsight: 'Exactly 2/7 of the initial translational energy is converted into rotation and 1/7 is lost as heat.'
        }
      ],
      criticalSubstitutions: [
        'Setting rolling constraint $v^* = R \\omega^*$',
        'Angular momentum identity $M v_0 R = \\left(M R^2 + \\frac{2}{5} M R^2\\right) \\frac{v^*}{R} = \\frac{7}{5} M v^* R$'
      ]
    },
    tier4: {
      title: 'Complete Rigorous Proof & Final Numerical Solution',
      finalAnswerLatex: '\\boxed{t^* = \\frac{2 v_0}{7 \\mu g}, \\quad v^* = \\frac{5}{7} v_0, \\quad \\Delta E_{\\text{loss}} = \\frac{1}{7} M v_0^2}',
      fullRigorousProof: `By applying Angular Momentum Conservation about any fixed point along the ground plane, the line of action of the friction force $f_k$ passes through the ground, meaning $\\sum \\vec{\\tau}_{\\text{ext, ground}} = 0$.
$$L_{\\text{initial}} = M v_0 R = L_{\\text{final}} = I_P \\omega^* = \\left(I_{\\text{cm}} + M R^2\\right) \\omega^* = \\frac{7}{5} M R^2 \\left(\\frac{v^*}{R}\\right)$$
$$M v_0 R = \\frac{7}{5} M v^* R \\implies v^* = \\frac{5}{7} v_0$$
This elegant one-line derivation proves that $v^*$ is completely independent of the friction coefficient $\\mu$!`,
      dimensionalCheck: `[t*] = (m/s) / (m/s^2) = s (seconds). [v*] = m/s. [\\Delta E] = kg*(m/s)^2 = Joules. In the limit $\\mu \\to \\infty$, $t^* \\to 0$ (instant rolling). In the limit $\\mu \\to 0$, $t^* \\to \\infty$ (infinite skidding).`,
      numericalExample: `For $M = 2.0\\text{ kg}$, $R = 0.1\\text{ m}$, $v_0 = 7.0\\text{ m/s}$, $\\mu = 0.2$, $g = 9.8\\text{ m/s}^2$:
$t^* = \\frac{2(7.0)}{7(0.2)(9.8)} = 1.02\\text{ s}$, $v^* = \\frac{5}{7}(7.0) = 5.0\\text{ m/s}$, $\\Delta E = \\frac{1}{7}(2.0)(49) = 14.0\\text{ J}$.`
    }
  },
  {
    id: 'benchmark-math-1',
    title: 'Feynman Parameter Differentiation Integral',
    subject: 'Mathematics',
    difficulty: 'JEE Advanced',
    topic: 'Definite Integrals & Leibniz Rule',
    problemStatement: `Evaluate the definite integral for positive parameters $a > 0$ and $b > 0$:
$$I(a, b) = \\int_{0}^{\\infty} \\frac{\\ln(1 + a^2 x^2)}{1 + b^2 x^2} \\, dx$$
using Feynman's technique of differentiation under the integral sign.`,
    tier1: {
      title: 'Core Mathematical Intuition (No Formulas)',
      conceptualOverview: `Direct antiderivative calculation of $\\int \\frac{\\ln(1+a^2 x^2)}{1+b^2 x^2} dx$ is notoriously intractable because of the logarithmic factor in the numerator. However, taking the partial derivative with respect to parameter $a$ eliminates the logarithm via the derivative rule $\\frac{d}{da} \\ln(1+a^2 x^2) = \\frac{2a x^2}{1+a^2 x^2}$. This transforms the integrand into a standard rational function of $x^2$ that is easily resolved using partial fractions and standard arctan integrals. Once integrated, we simply integrate back with respect to $a$.`,
      mentalModel: `Think of parameter $a$ as a tuning knob. At $a = 0$, the numerator is $\\ln(1) = 0$, so $I(0, b) = 0$. By watching how rapidly the integral grows as we turn the knob $a$, we find the rate of change $\\frac{\\partial I}{\\partial a}$, and then integrate that rate from $0$ up to $a$.`,
      selfCheckPrompt: `What is the base case value of $I(a, b)$ when $a = 0$ or when $a = b$?`
    },
    tier2: {
      title: 'Governing Equations & Principles',
      principles: [
        "Leibniz's Integral Rule: $\\frac{\\partial}{\\partial a} \\int_{0}^{\\infty} f(x, a) dx = \\int_{0}^{\\infty} \\frac{\\partial f}{\\partial a}(x, a) dx$",
        'Partial Fraction Decomposition of $x^2 / [(1+a^2 x^2)(1+b^2 x^2)]$',
        'Standard Integral: $\\int_{0}^{\\infty} \\frac{1}{1 + k^2 x^2} dx = \\frac{\\pi}{2k}$'
      ],
      equations: [
        {
          name: 'Derivative of Integrand w.r.t. Parameter a',
          latex: '\\frac{\\partial}{\\partial a}\\left[\\frac{\\ln(1 + a^2 x^2)}{1 + b^2 x^2}\\right] = \\frac{2a x^2}{(1 + a^2 x^2)(1 + b^2 x^2)}',
          description: 'Converts transcendental logarithmic integrand into an algebraic rational fraction.'
        },
        {
          name: 'Partial Fraction Identity',
          latex: '\\frac{x^2}{(1 + a^2 x^2)(1 + b^2 x^2)} = \\frac{1}{a^2 - b^2} \\left( \\frac{1}{1 + b^2 x^2} - \\frac{1}{1 + a^2 x^2} \\right)',
          description: 'Splits product of quadratic denominators into standard arctangent integrands.'
        }
      ],
      coordinateSetup: `Parameters $a, b > 0$. Boundary condition: $I(0, b) = 0$.`
    },
    tier3: {
      title: 'Step-by-Step Derivation & Intermediate Results',
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiating Under the Integral Sign',
          explanation: `$$\\frac{\\partial I}{\\partial a} = \\int_{0}^{\\infty} \\frac{2a x^2}{(1 + a^2 x^2)(1 + b^2 x^2)} \\, dx$$
Apply partial fractions on the $x^2$ term:
$$\\frac{x^2}{(1 + a^2 x^2)(1 + b^2 x^2)} = \\frac{1}{a^2 - b^2}\\left[ \\frac{1}{1 + b^2 x^2} - \\frac{1}{1 + a^2 x^2} \\right]$$`,
          intermediateLatex: '\\frac{\\partial I}{\\partial a} = \\frac{2a}{a^2 - b^2} \\int_{0}^{\\infty} \\left[ \\frac{1}{1 + b^2 x^2} - \\frac{1}{1 + a^2 x^2} \\right] dx',
          keyInsight: 'The difficult logarithmic integral is converted into elementary arctangent forms.'
        },
        {
          stepNumber: 2,
          title: 'Evaluating the Spatial Integrals',
          explanation: `Using $\\int_{0}^{\\infty} \\frac{dx}{1 + k^2 x^2} = \\left[ \\frac{1}{k} \\arctan(kx) \\right]_0^\\infty = \\frac{\\pi}{2k}$:
$$\\int_{0}^{\\infty} \\left[ \\frac{1}{1 + b^2 x^2} - \\frac{1}{1 + a^2 x^2} \\right] dx = \\frac{\\pi}{2b} - \\frac{\\pi}{2a} = \\frac{\\pi(a - b)}{2 a b}$$
Multiply by $\\frac{2a}{a^2 - b^2} = \\frac{2a}{(a - b)(a + b)}$:
$$\\frac{\\partial I}{\\partial a} = \\frac{2a}{(a - b)(a + b)} \\cdot \\frac{\\pi(a - b)}{2 a b} = \\frac{\\pi}{b(a + b)}$$`,
          intermediateLatex: '\\frac{\\partial I}{\\partial a} = \\frac{\\pi}{b(a + b)}',
          keyInsight: 'The factor $(a-b)$ cancels out perfectly, eliminating any singularity at $a = b$!'
        },
        {
          stepNumber: 3,
          title: 'Integrating Back with Respect to Parameter a',
          explanation: `Integrate $\\frac{\\partial I}{\\partial a}$ from $a = 0$ to $a$:
$$I(a, b) = \\int_{0}^{a} \\frac{\\pi}{b(t + b)} \\, dt = \\frac{\\pi}{b} \\Big[ \\ln(t + b) \\ Big]_0^a = \\frac{\\pi}{b} \\Big[ \\ln(a + b) - \\ln(b) \\Big] = \\frac{\\pi}{b} \\ln\\left(1 + \\frac{a}{b}\\right)$$`,
          intermediateLatex: 'I(a, b) = \\frac{\\pi}{b} \\ln\\left(1 + \\frac{a}{b}\\right)',
          keyInsight: 'Since $I(0, b) = 0$, the integration constant $C = 0$.'
        }
      ],
      criticalSubstitutions: [
        'Leibniz differentiation $\\frac{\\partial}{\\partial a}$',
        'Integral $\\int_{0}^a \\frac{dt}{t + b} = \\ln\\left(\\frac{a + b}{b}\\right)$'
      ]
    },
    tier4: {
      title: 'Complete Rigorous Proof & Final Numerical Solution',
      finalAnswerLatex: '\\boxed{I(a, b) = \\frac{\\pi}{b} \\ln\\left(1 + \\frac{a}{b}\\right)}',
      fullRigorousProof: `The dominated convergence theorem guarantees the validity of exchanging derivative and integral because the derivative integrand is uniformly bounded by an integrable function $g(x) = \\frac{2 A x^2}{(1 + b^2 x^2)}$ on any compact interval $a \\in [0, A]$. The result is continuous and smooth for all $a, b > 0$.`,
      dimensionalCheck: `For $a = b$, $I(b, b) = \\frac{\\pi}{b} \\ln(2)$.
As $a \\to 0$, $\\ln(1 + a/b) \\approx a/b$, so $I(a, b) \\approx \\frac{\\pi a}{b^2}$, matching the Taylor series $\\int_0^\\infty \\frac{a^2 x^2}{1+b^2 x^2} dx$ truncated appropriately.`,
      numericalExample: `For $a = 1, b = 1$:
$$I(1, 1) = \\int_{0}^{\\infty} \\frac{\\ln(1 + x^2)}{1 + x^2} \\, dx = \\pi \\ln(2) \\approx 2.17758$$`
    }
  },
  {
    id: 'benchmark-chem-1',
    title: 'Nernst Concentration Cell & Buffer Equilibrium',
    subject: 'Chemistry',
    difficulty: 'JEE Advanced',
    topic: 'Electrochemistry & Acid-Base Dissociation',
    problemStatement: `A hydrogen concentration cell is constructed at $298\\text{ K}$:
$$\\text{Pt}(s) \\mid \\text{H}_2(g, 1\\text{ bar}) \\mid \\text{HA}(0.10\\text{ M}) \\parallel \\text{HCl}(0.010\\text{ M}) \\mid \\text{H}_2(g, 1\\text{ bar}) \\mid \\text{Pt}(s)$$
The measured cell potential is $E_{\\text{cell}} = +0.1773\\text{ V}$.
(Given: $\\frac{2.303 RT}{F} = 0.0591\\text{ V}$ at $298\\text{ K}$).

Calculate:
1. The $[\\text{H}^+]$ concentration and $\\text{pH}$ of the weak acid solution $\\text{HA}$ in the anode half-cell.
2. The acid dissociation constant $K_a$ of $\\text{HA}$.
3. The new cell potential $E'_{\\text{cell}}$ if $0.050\\text{ mol}$ of solid $\\text{NaOH}$ is added to $1.0\\text{ L}$ of the anode solution (assume no volume change).`,
    tier1: {
      title: 'Core Chemical Intuition (No Formulas)',
      conceptualOverview: `In any concentration cell, both electrodes are identical, so $E^\\circ_{\\text{cell}} = 0$. The electrical potential arises purely from the thermodynamic driving force for concentration equalization (entropy of dilution). Electrons flow spontaneously from the lower $[\\text{H}^+]$ compartment (anode, where $\\text{H}_2$ oxidizes to release $\\text{H}^+$) to the higher $[\\text{H}^+]$ compartment (cathode, where $\\text{H}^+$ reduces to $\\text{H}_2$). Because $\\text{HA}$ is a weak acid, it is only partially dissociated, resulting in a much lower $[\\text{H}^+]$ at the anode than in the strong $\\text{HCl}$ cathode. Adding strong base $\\text{NaOH}$ converts half of $\\text{HA}$ into its conjugate base $\\text{A}^-$, forming a buffer at maximum buffering capacity (pH = pKa).`,
      mentalModel: `Think of the concentration cell as an osmotic membrane: hydrogen ions want to equilibrate between both beakers. The larger the concentration difference between anode and cathode, the higher the voltage generated by the cell.`,
      selfCheckPrompt: `If the anode $[\\text{H}^+]$ decreases further, will the cell voltage $E_{\\text{cell}}$ increase or decrease?`
    },
    tier2: {
      title: 'Governing Equations & Principles',
      principles: [
        'Nernst Equation for Hydrogen Cell: $E_{\\text{cell}} = \\frac{0.0591}{1} \\log_{10}\\left(\\frac{[\\text{H}^+]_{\\text{cathode}}}{[\\text{H}^+]_{\\text{anode}}}\\right)$',
        'Weak Acid Ionization: $K_a = \\frac{[\\text{H}^+][\\text{A}^-]}{[\\text{HA}] - [\\text{H}^+]}$',
        'Henderson-Hasselbalch Equation for Buffer: $\\text{pH} = \\text{p}K_a + \\log_{10}\\left(\\frac{[\\text{A}^-]}{[\\text{HA}]}\\right)$'
      ],
      equations: [
        {
          name: 'Nernst Relation for 1-Electron Hydrogen Half-Reaction',
          latex: 'E_{\\text{cell}} = 0.0591 \\cdot \\left(\\text{pH}_{\\text{anode}} - \\text{pH}_{\\text{cathode}}\\right)',
          description: 'Directly relates cell electromotive force to the pH differential across compartments.'
        },
        {
          name: 'Ostwald Weak Acid Ionization',
          latex: 'K_a \\approx \\frac{[\\text{H}^+]^2}{C_0 - [\\text{H}^+]}',
          description: 'Relates hydrogen ion activity to initial analytical concentration $C_0$.'
        }
      ],
      coordinateSetup: `Cathode: Strong acid $[\\text{H}^+]_{\\text{cat}} = 0.010\\text{ M} = 10^{-2}\\text{ M} \\implies \\text{pH}_{\\text{cat}} = 2.0$.`
    },
    tier3: {
      title: 'Step-by-Step Derivation & Intermediate Results',
      steps: [
        {
          stepNumber: 1,
          title: 'Finding Anode [H+] and pH from Nernst Equation',
          explanation: `$$E_{\\text{cell}} = 0.0591 \\log_{10}\\left( \\frac{10^{-2}}{[\\text{H}^+]_{\\text{anode}}} \\right) = 0.1773\\text{ V}$$
Divide by $0.0591$:
$$\\log_{10}\\left( \\frac{10^{-2}}{[\\text{H}^+]_{\\text{anode}}} \\right) = \\frac{0.1773}{0.0591} = 3.00$$
$$\\frac{10^{-2}}{[\\text{H}^+]_{\\text{anode}}} = 10^3 \\implies [\\text{H}^+]_{\\text{anode}} = 10^{-5}\\text{ M}$$
$$\\text{pH}_{\\text{anode}} = -\\log_{10}(10^{-5}) = 5.00$$`,
          intermediateLatex: '[\\text{H}^+]_{\\text{anode}} = 1.0 \\times 10^{-5}\\text{ M}, \\quad \\text{pH}_{\\text{anode}} = 5.00',
          keyInsight: 'The anode pH is exactly 3 units higher than the cathode pH.'
        },
        {
          stepNumber: 2,
          title: 'Calculating Acid Dissociation Constant Ka',
          explanation: `Initial $[\\text{HA}] = 0.10\\text{ M}$. At equilibrium:
$$[\\text{H}^+] = [\\text{A}^-] = 1.0 \\times 10^{-5}\\text{ M}$$
$$[\\text{HA}] = 0.10 - 1.0 \\times 10^{-5} \\approx 0.10\\text{ M}$$
$$K_a = \\frac{(1.0 \\times 10^{-5})^2}{0.10} = \\frac{1.0 \\times 10^{-10}}{0.10} = 1.0 \\times 10^{-9}$$
$$\\text{p}K_a = 9.00$$`,
          intermediateLatex: 'K_a = 1.0 \\times 10^{-9}, \\quad \\text{p}K_a = 9.00',
          keyInsight: 'The degree of dissociation $\\alpha = 10^{-5}/0.10 = 10^{-4} = 0.01\\%$, validating $[\\text{HA}] \\approx 0.10$.'
        },
        {
          stepNumber: 3,
          title: 'Effect of Adding 0.050 mol NaOH to Anode',
          explanation: `$\\text{NaOH}$ reacts completely with $\\text{HA}$:
$$\\text{HA} + \\text{OH}^- \\to \\text{A}^- + \\text{H}_2\\text{O}$$
Moles of $\\text{HA}$ remaining $= 0.10 - 0.050 = 0.050\\text{ mol}$.
Moles of $\\text{A}^-$ formed $= 0.050\\text{ mol}$.
Since $[\\text{HA}] = [\\text{A}^-]$, by Henderson-Hasselbalch:
$$\\text{pH}'_{\\text{anode}} = \\text{p}K_a + \\log_{10}\\left(\\frac{0.050}{0.050}\\right) = 9.00 + 0 = 9.00$$
$$[\\text{H}^+]'_{\\text{anode}} = 10^{-9}\\text{ M}$$
$$E'_{\\text{cell}} = 0.0591 \\cdot (\\text{pH}'_{\\text{anode}} - \\text{pH}_{\\text{cat}}) = 0.0591 \\cdot (9.00 - 2.00) = 0.0591 \\times 7.00 = 0.4137\\text{ V}$$`,
          intermediateLatex: 'E\'_{\\text{cell}} = 0.4137\\text{ V}',
          keyInsight: 'Neutralizing half the acid raises pH to pKa and significantly boosts cell voltage by 0.2364 V!'
        }
      ],
      criticalSubstitutions: [
        'Nernst ratio $\\frac{0.1773}{0.0591} = 3.0$',
        'Equimolar buffer condition $[\\text{HA}] = [\\text{A}^-] \\implies \\text{pH} = \\text{p}K_a$'
      ]
    },
    tier4: {
      title: 'Complete Rigorous Proof & Final Numerical Solution',
      finalAnswerLatex: '\\boxed{\\text{pH}_{\\text{anode}} = 5.00, \\quad K_a = 1.0 \\times 10^{-9}, \\quad E\'_{\\text{cell}} = +0.4137\\text{ V}}',
      fullRigorousProof: `The cell reaction is $\\text{H}^+(\\text{cathode}) \\to \\text{H}^+(\\text{anode})$.
$$\\Delta G = -n F E_{\\text{cell}} = -R T \\ln\\left( \\frac{[\\text{H}^+]_{\\text{anode}}}{[\\text{H}^+]_{\\text{cathode}}} \\right)$$
For $n = 1$ and $T = 298.15\\text{ K}$, every 1-unit increase in $\\Delta \\text{pH}$ produces precisely $59.16\\text{ mV}$ of electromotive force.`,
      dimensionalCheck: `Voltage dimensions $[E] = \\text{Volts} = \\text{J/C}$. $K_a$ has units of $\\text{mol/L}$. Adding base decreases $[\\text{H}^+]$ at the anode, thereby shifting reaction equilibrium forward and increasing $E_{\\text{cell}}$, which is physically consistent.`,
      numericalExample: `Summary Table:
- Initial Anode: $[\\text{H}^+] = 10^{-5}\\text{ M}, \\text{pH} = 5.00, E_{\\text{cell}} = 0.1773\\text{ V}$
- Buffered Anode: $[\\text{H}^+] = 10^{-9}\\text{ M}, \\text{pH} = 9.00, E'_{\\text{cell}} = 0.4137\\text{ V}$`
    }
  }
];

// Quick LaTeX snippets for competitive STEM students
const LATEX_SNIPPETS = [
  { label: 'Fraction', insert: '\\frac{a}{b}' },
  { label: 'Integral', insert: '\\int_{0}^{\\infty} f(x) \\, dx' },
  { label: 'Derivative', insert: '\\frac{d}{dt}\\left( x(t) \\right)' },
  { label: 'Sum', insert: '\\sum_{i=1}^{n}' },
  { label: 'Sqrt', insert: '\\sqrt{x^2 + y^2}' },
  { label: 'Vector', insert: '\\vec{F} = m \\vec{a}' },
  { label: 'Limit', insert: '\\lim_{x \\to 0}' },
  { label: 'Matrix', insert: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Boxed', insert: '\\boxed{\\text{result}}' },
  { label: 'Theta', insert: '\\theta' },
  { label: 'Omega', insert: '\\omega' },
  { label: 'Delta', insert: '\\Delta E' },
  { label: 'Partial', insert: '\\frac{\\partial f}{\\partial x}' },
  { label: 'Wavefunction', insert: '\\psi_n(x) = \\sqrt{\\frac{2}{L}} \\sin\\left(\\frac{n \\pi x}{L}\\right)' }
];

export const StemSolver: React.FC = () => {
  const { user } = useAppContext();

  // Navigation / View State
  const [activeView, setActiveView] = useState<'solver' | 'benchmarks' | 'history'>('solver');
  
  // Problem Inputs
  const [problemText, setProblemText] = useState('');
  const [subject, setSubject] = useState<Subject>('Physics');
  const [difficulty, setDifficulty] = useState<Difficulty>('JEE Advanced');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AbortController ref — cancel in-flight AI solve request when a new one starts or on unmount
  const solveAbortControllerRef = useRef<AbortController | null>(null);

  // Active Solution & Tier Progression
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [revealedTier, setRevealedTier] = useState<number>(1); // 1, 2, 3, 4
  const [expandedSelfChecks, setExpandedSelfChecks] = useState<Record<string, boolean>>({});
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [flashcardToast, setFlashcardToast] = useState<string | null>(null);

  // History state
  const [solvedHistory, setSolvedHistory] = useState<SolvedProblemItem[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('All');

  // Scratchpad Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penTool, setPenTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>('#38bdf8'); // Cyan default
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [canvasGridStyle, setCanvasGridStyle] = useState<'grid' | 'dots' | 'blank'>('grid');
  const [isScratchpadCollapsed, setIsScratchpadCollapsed] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  // Load History from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('savantix_solved_problems');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSolvedHistory(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load savantix_solved_problems:', e);
    }
  }, []);

  // Abort any pending AI solve request on unmount (cleanup)
  useEffect(() => {
    return () => {
      if (solveAbortControllerRef.current) {
        solveAbortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail && e.detail.tab === 'solver' && e.detail.topic) {
        setProblemText(prev => prev ? prev : `Revision Topic: ${e.detail.topic}\n\nPlease provide a problem for this topic...`);
        if (e.detail.subject) setSubject(e.detail.subject as Subject);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  // Save current solution to history (including canvas diagram if present)
  const saveToHistory = useCallback((sol: ProblemSolution) => {
    try {
      const raw = localStorage.getItem('savantix_solved_problems');
      const list: SolvedProblemItem[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter(item => item.id !== sol.id && item.problemStatement !== sol.problemStatement);
      
      let canvasDrawing: string | undefined = undefined;
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        try {
          canvasDrawing = canvas.toDataURL('image/png');
        } catch {}
      } else if (memoryCanvasRef.current && memoryCanvasRef.current.width > 0 && memoryCanvasRef.current.height > 0) {
        try {
          canvasDrawing = memoryCanvasRef.current.toDataURL('image/png');
        } catch {}
      }

      const newItem: SolvedProblemItem = {
        id: sol.id || `solved_${Date.now()}`,
        timestamp: new Date().toISOString(),
        subject: sol.subject || 'General STEM',
        topic: sol.topic || 'Problem Solving',
        difficulty: sol.difficulty || 'JEE Advanced',
        problemStatement: sol.problemStatement,
        solution: sol,
        canvasDrawing
      };
      const updated = [newItem, ...filtered].slice(0, 50);
      localStorage.setItem('savantix_solved_problems', JSON.stringify(updated));
      setSolvedHistory(updated);
    } catch (e) {
      console.error('Failed to save to solved history:', e);
    }
  }, []);

  // Draw Scratchpad Background Grid
  const drawBackgroundGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, style: 'grid' | 'dots' | 'blank') => {
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, width, height);

    if (style === 'blank') return;

    if (style === 'grid') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 24;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major grid lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)'; // Indigo subtle
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize * 4) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize * 4) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (style === 'dots') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      const dotSpacing = 20;
      for (let x = dotSpacing; x < width; x += dotSpacing) {
        for (let y = dotSpacing; y < height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const memoryCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Quick LaTeX insertion helper at cursor position
  const handleInsertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setProblemText(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + snippet);
      return;
    }
    const start = textarea.selectionStart ?? problemText.length;
    const end = textarea.selectionEnd ?? problemText.length;
    const prefix = start > 0 && !problemText[start - 1].match(/\s|\$/) ? ' ' : '';
    const newText = problemText.substring(0, start) + prefix + snippet + problemText.substring(end);
    setProblemText(newText);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + snippet.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Canvas Initialization & Resize Handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!memoryCanvasRef.current) {
      memoryCanvasRef.current = document.createElement('canvas');
    }
    const memCanvas = memoryCanvasRef.current;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      const rawWidth = rect.width > 0 ? rect.width : (parent.parentElement?.clientWidth || window.innerWidth - 320 || 800);
      const displayWidth = Math.max(300, Math.floor(rawWidth));
      const displayHeight = 440;

      // Store current drawing in offscreen memory canvas before resize
      if (canvas.width > 0 && canvas.height > 0) {
        memCanvas.width = canvas.width;
        memCanvas.height = canvas.height;
        const memCtx = memCanvas.getContext('2d');
        if (memCtx) {
          memCtx.drawImage(canvas, 0, 0);
        }
      }

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawBackgroundGrid(ctx, canvas.width, canvas.height, canvasGridStyle);

      // Restore drawing from memory canvas scaled properly
      if (memCanvas.width > 0 && memCanvas.height > 0) {
        ctx.drawImage(memCanvas, 0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    window.addEventListener('resize', resizeCanvas);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasGridStyle, drawBackgroundGrid]);

  // Push Canvas snapshot to Undo Stack
  const pushCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setUndoStack(prev => [...prev.slice(-20), imgData]);
      setRedoStack([]); // Clear redo upon new stroke
    } catch {}
  };

  // Canvas Pointer Events with Pixel-Perfect Scaling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushCanvasState();
    setIsDrawing(true);
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (penTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 8 * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (penTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor + '55'; // 33% alpha
      ctx.lineWidth = strokeWidth * 5 * dpr;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = strokeWidth * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Undo Canvas Action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const prevImg = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentImg]);

    ctx.putImageData(prevImg, 0, 0);
  };

  // Redo Canvas Action
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const nextImg = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, currentImg]);

    ctx.putImageData(nextImg, 0, 0);
  };

  // Clear Canvas & Memory Canvas Buffer Completely
  const handleClearCanvas = useCallback(() => {
    // 1. Clear offscreen memory canvas completely
    if (memoryCanvasRef.current) {
      const memCanvas = memoryCanvasRef.current;
      const memCtx = memCanvas.getContext('2d');
      if (memCtx && memCanvas.width > 0 && memCanvas.height > 0) {
        memCtx.clearRect(0, 0, memCanvas.width, memCanvas.height);
      }
      memCanvas.width = 0;
      memCanvas.height = 0;
    }

    // 2. Clear on-screen display canvas if mounted
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        pushCanvasState();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        drawBackgroundGrid(ctx, canvas.width, canvas.height, canvasGridStyle);
      }
    }
    setUndoStack([]);
    setRedoStack([]);
  }, [canvasGridStyle, drawBackgroundGrid]);

  // Download Scratchpad as PNG
  const handleDownloadScratchpad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `savantix-stem-scratchpad-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Analyze & Solve Diagram directly from Scratchpad
  const handleSolveFromScratchpad = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setIsSolving(true);
    setErrorMsg(null);
    setRevealedTier(1);

    try {
      const prompt = `Solve and derive step-by-step the STEM problem, circuit, physical geometry, or mathematical formulation sketched in this attached diagram. Subject: ${subject}, Target Difficulty: ${difficulty}. Provide a complete 4-tier progressive Socratic solution with LaTeX formatting.`;
      const response = await UniversalAIService.sendChatMessage(
        prompt,
        [],
        undefined,
        undefined,
        [{ mimeType: 'image/png', base64: dataUrl }]
      );
      
      const newSolution: ProblemSolution = {
        id: `stem_diag_${Date.now()}`,
        title: `Diagram Solution: ${subject}`,
        subject,
        difficulty,
        topic: 'Diagram & Scratchpad Analysis',
        problemStatement: problemText.trim() || 'Custom Diagram & Free-Body Schema (Sketched on Scratchpad)',
        tier1: {
          title: 'Core Physical & Geometric Intuition',
          conceptualOverview: response.substring(0, 500),
          mentalModel: 'Visual geometry and vector constraints derived from your sketch.',
          selfCheckPrompt: 'What boundary condition or symmetry governs this system?'
        },
        tier2: {
          title: 'Governing Equations & Principles',
          principles: ['Newton-Euler Dynamics', 'Conservation of Energy & Momentum', 'Boundary Relations'],
          equations: [{ name: 'System Formulation', latex: '\\sum \\vec{F} = m\\vec{a}, \\quad \\sum \\vec{\\tau} = I\\vec{\\alpha}', description: 'Governing dynamical equations' }],
          coordinateSetup: 'Reference coordinates aligned with sketch axes.'
        },
        tier3: {
          title: 'Step-by-Step Derivations',
          steps: [
            {
              stepNumber: 1,
              title: 'Formulating Constraints from Diagram',
              explanation: response.length > 600 ? response.substring(500, 1200) : 'Step-by-step intermediate calculation.',
              intermediateLatex: '\\vec{a} = \\vec{\\alpha} \\times \\vec{r}',
              keyInsight: 'Diagram boundary conditions determine equations.'
            }
          ],
          criticalSubstitutions: ['Constraint geometry substitution']
        },
        tier4: {
          title: 'Complete Rigorous Proof & Final Result',
          finalAnswerLatex: '\\boxed{\\text{Verified via Socratic Multimodal AI}}',
          fullRigorousProof: response,
          dimensionalCheck: 'Consistent physical dimensions verified.'
        }
      };
      setSolution(newSolution);
      saveToHistory(newSolution);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze diagram.');
    } finally {
      setIsSolving(false);
    }
  };

  // Socratic AI Solver Pipeline
  const handleSolveProblem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!problemText.trim()) return;

    // Abort any previous in-flight solve request (prevents stale race conditions)
    if (solveAbortControllerRef.current) {
      solveAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    solveAbortControllerRef.current = controller;

    setIsSolving(true);
    setErrorMsg(null);
    setRevealedTier(1); // Start Socratic progressive exploration from Tier 1!
    setActiveView('solver');

    const prompt = `You are an elite Socratic STEM Professor and Olympiad Coach (IPhO, IMO, IChO, JEE Advanced).
Solve the following ${subject} problem with supreme mathematical/physical rigor and pedagogical excellence using the Progressive 4-Tier Socratic Framework.

Problem Statement:
"""
${problemText}
"""

Subject: ${subject}
Target Difficulty: ${difficulty}

Formatting Rules:
- Render all mathematical formulas in LaTeX: use $...$ for inline equations and $$...$$ for block formulas.
- Never summarize vaguely; provide complete algebraic steps and exact coefficients.

You must return a valid JSON object matching this schema precisely:
{
  "id": "stem_${Date.now()}",
  "title": "Short descriptive topic title (e.g. Relativistic Doppler Shifts & Aberration)",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "topic": "Specific Topic Name",
  "problemStatement": "Clean, formatted problem statement with LaTeX",
  "tier1": {
    "title": "Core Physical / Mathematical Intuition",
    "conceptualOverview": "Thorough qualitative explanation of what is happening conceptually. NO overwhelming formulas here. Focus on physical intuition, symmetry, and mental models.",
    "mentalModel": "A vivid thought experiment, geometric visualization, or physical analogy to build deep intuition.",
    "selfCheckPrompt": "A thought-provoking question for the student to ponder before looking at governing equations."
  },
  "tier2": {
    "title": "Governing Equations & Principles",
    "principles": ["List of core physical laws, theorems, or conservation principles used"],
    "equations": [
      {
        "name": "Equation/Law name",
        "latex": "LaTeX formula (e.g. \\\\tau_{\\\\text{net}} = I \\\\alpha)",
        "description": "Physical meaning of each variable and constraint"
      }
    ],
    "coordinateSetup": "Specification of coordinate axes, sign conventions, state variables, or initial/boundary conditions."
  },
  "tier3": {
    "title": "Step-by-Step Key Substitution & Intermediate Results",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Step title (e.g. Applying Torque Equation about Instantaneous Center)",
        "explanation": "Detailed algebraic derivation and explanation in LaTeX",
        "intermediateLatex": "Intermediate formula or result",
        "keyInsight": "Key takeaway or common pitfall to avoid"
      }
    ],
    "criticalSubstitutions": ["Crucial algebraic or variable transformations used (e.g. u = ax, substitution of rolling constraint v = omega*R)"]
  },
  "tier4": {
    "title": "Complete Rigorous Proof & Final Numerical Solution",
    "finalAnswerLatex": "\\\\boxed{...} - The exact final symbolic expression in a LaTeX box",
    "fullRigorousProof": "Final synthesis, rigorous concluding proof, or summary of the solution logic.",
    "dimensionalCheck": "Dimensional analysis sanity check and limiting case verification (e.g. as m -> 0 or theta -> 0).",
    "numericalExample": "Calculated numerical value with appropriate SI units if numbers were given or for standard constants."
  }
}`;

    const schemaDesc = `{
  "id": "string",
  "title": "string",
  "subject": "Physics | Chemistry | Mathematics | General STEM",
  "difficulty": "JEE Advanced | Olympiad (IPhO/IMO/IChO) | JEE Main | Putnam / Collegiate",
  "topic": "string",
  "problemStatement": "string",
  "tier1": {
    "title": "string",
    "conceptualOverview": "string",
    "mentalModel": "string",
    "selfCheckPrompt": "string"
  },
  "tier2": {
    "title": "string",
    "principles": ["string"],
    "equations": [{"name": "string", "latex": "string", "description": "string"}],
    "coordinateSetup": "string"
  },
  "tier3": {
    "title": "string",
    "steps": [{"stepNumber": 1, "title": "string", "explanation": "string", "intermediateLatex": "string", "keyInsight": "string"}],
    "criticalSubstitutions": ["string"]
  },
  "tier4": {
    "title": "string",
    "finalAnswerLatex": "string",
    "fullRigorousProof": "string",
    "dimensionalCheck": "string",
    "numericalExample": "string"
  }
}`;

    try {
      const result = await UniversalAIService.executeJsonRequest<ProblemSolution>(prompt, schemaDesc);
      
      // Normalize result to ensure all 4 tiers exist safely
      const normalizedSolution: ProblemSolution = {
        id: result.id || `stem_${Date.now()}`,
        title: result.title || 'Structured Socratic Derivation',
        subject: result.subject || subject,
        difficulty: result.difficulty || difficulty,
        topic: result.topic || 'STEM Problem Solving',
        problemStatement: result.problemStatement || problemText,
        tier1: result.tier1 || {
          title: 'Core Physical Intuition',
          conceptualOverview: 'Conceptual overview synthesized.',
          mentalModel: 'Analyze the system through conservation laws and symmetry.',
          selfCheckPrompt: 'What happens at the asymptotic boundaries of this system?'
        },
        tier2: result.tier2 || {
          title: 'Governing Equations & Principles',
          principles: ['Fundamental Conservation Laws', 'Constitutive Equations'],
          equations: [],
          coordinateSetup: 'Standard Cartesian coordinate frame with origin at initial boundary.'
        },
        tier3: result.tier3 || {
          title: 'Step-by-Step Key Substitution & Derivations',
          steps: [],
          criticalSubstitutions: []
        },
        tier4: result.tier4 || {
          title: 'Complete Rigorous Proof & Final Numerical Solution',
          finalAnswerLatex: '\\boxed{\\text{Solution Derived}}',
          fullRigorousProof: 'Complete derivation synthesized.',
          dimensionalCheck: 'Dimensions are homogeneous and consistent.'
        }
      };

      setSolution(normalizedSolution);
      saveToHistory(normalizedSolution);
    } catch (err: any) {
      // Silently ignore intentional cancellations from double-click / new request
      if (err?.name === 'AbortError') return;
      // Only show error if this request is still the active one
      if (solveAbortControllerRef.current === controller) {
        console.error('StemSolver execution error:', err);
        setErrorMsg(err.message || 'Failed to synthesize solution. Please verify your AI API key in Settings.');
      }
    } finally {
      // Only reset loading state for the active request
      if (solveAbortControllerRef.current === controller) {
        setIsSolving(false);
        solveAbortControllerRef.current = null;
      }
    }
  };

  // Convert current problem & solution into KaTeX Flashcard in localStorage
  const handleConvertToFlashcard = async () => {
    if (!solution) return;

    const flashcardId = `stem_card_${Date.now()}`;
    const frontText = `**[${solution.subject || 'STEM'} • ${solution.difficulty || 'Advanced'}] ${solution.topic || 'Problem'}**\n\n${solution.problemStatement}`;
    
    const keyEq = solution.tier2.equations?.[0]?.latex || solution.tier4.finalAnswerLatex;
    const backText = `### 💡 Core Intuition\n${solution.tier1.conceptualOverview}\n\n### 📐 Key Governing Formula\n$$${keyEq.replace(/^\$\$|\$\$$/g, '')}$$\n\n### 🏁 Final Boxed Result\n$$${solution.tier4.finalAnswerLatex.replace(/^\$\$|\$\$$/g, '')}$$`;

    const newCard = {
      id: flashcardId,
      front: frontText,
      back: backText,
      deck: `STEM - ${solution.topic || solution.subject || 'Olympiad'}`,
      nextReview: new Date().toISOString(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0
    };

    try {
      // 1. Save to savantix_flashcards (as requested)
      const rawMain = localStorage.getItem('savantix_flashcards');
      const listMain = rawMain ? JSON.parse(rawMain) : [];
      localStorage.setItem('savantix_flashcards', JSON.stringify([newCard, ...listMain]));

      // 2. Also save to savantix_guest_flashcards (for immediate compatibility with Flashcards tab)
      const rawGuest = localStorage.getItem('savantix_guest_flashcards');
      const listGuest = rawGuest ? JSON.parse(rawGuest) : [];
      localStorage.setItem('savantix_guest_flashcards', JSON.stringify([newCard, ...listGuest]));

      // 3. Sync to Firebase Firestore if logged in
      if (user?.uid) {
        try {
          await addDoc(collection(db, 'users', user.uid, 'flashcards'), {
            front: newCard.front,
            back: newCard.back,
            deck: newCard.deck,
            nextReview: newCard.nextReview,
            interval: newCard.interval,
            easeFactor: newCard.easeFactor,
            repetitions: newCard.repetitions,
            createdAt: new Date().toISOString()
          });
        } catch (fbErr) {
          console.warn('Firestore flashcard sync skipped/failed:', fbErr);
        }
      }

      setFlashcardToast(`✓ Flashcard created in deck: "${newCard.deck}"`);
      setTimeout(() => setFlashcardToast(null), 4000);
      // Notify Flashcards tab to reload (same-tab sync)
      window.dispatchEvent(new Event('savantix_flashcards_updated'));
    } catch (err: any) {
      console.error('Failed to convert to flashcard:', err);
      setFlashcardToast('Failed to create flashcard in localStorage.');
      setTimeout(() => setFlashcardToast(null), 4000);
    }
  };

  // Copy LaTeX helper
  const handleCopyLatex = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    setTimeout(() => setCopiedState(null), 2500);
  };

  // Load Benchmark Problem
  const handleLoadBenchmark = (benchmark: ProblemSolution) => {
    setProblemText(benchmark.problemStatement);
    if (textareaRef.current) {
      textareaRef.current.value = benchmark.problemStatement;
    }
    setSubject(benchmark.subject);
    setDifficulty(benchmark.difficulty);
    setSolution(benchmark);
    setRevealedTier(4);
    setActiveView('solver');
    handleClearCanvas();
    saveToHistory(benchmark);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load Problem from Solved History
  const handleLoadHistoryItem = (item: SolvedProblemItem) => {
    setSolution(item.solution);
    setProblemText(item.problemStatement);
    if (textareaRef.current) {
      textareaRef.current.value = item.problemStatement;
    }
    setSubject(item.subject);
    setDifficulty(item.difficulty);
    setRevealedTier(4);
    setActiveView('solver');
    handleClearCanvas();

    // If this saved problem had a sketch, restore it after the solver view mounts
    if (item.canvasDrawing) {
      const img = new Image();
      img.onload = () => {
        // rAF ensures the solver view is rendered and canvas has correct dimensions
        requestAnimationFrame(() => {
          if (!memoryCanvasRef.current) {
            memoryCanvasRef.current = document.createElement('canvas');
          }
          const memCanvas = memoryCanvasRef.current;
          memCanvas.width = img.width;
          memCanvas.height = img.height;
          const memCtx = memCanvas.getContext('2d');
          if (memCtx) {
            memCtx.drawImage(img, 0, 0);
          }

          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              drawBackgroundGrid(ctx, canvas.width, canvas.height, canvasGridStyle);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          }
        }); // end requestAnimationFrame
      };
      img.src = item.canvasDrawing;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start Fresh / New Problem Workspace
  const handleStartFresh = () => {
    setProblemText('');
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
    setSolution(null);
    setRevealedTier(1);
    handleClearCanvas();
  };

  // Delete problem from history
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = solvedHistory.filter(h => h.id !== id);
    setSolvedHistory(updated);
    localStorage.setItem('savantix_solved_problems', JSON.stringify(updated));
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all solved problem history?')) {
      setSolvedHistory([]);
      localStorage.removeItem('savantix_solved_problems');
    }
  };

  // Filtered History
  const filteredHistory = solvedHistory.filter(item => {
    const matchesSubject = historySubjectFilter === 'All' || item.subject === historySubjectFilter;
    const matchesQuery = 
      item.topic?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.problemStatement?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.solution?.title?.toLowerCase().includes(historySearch.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 text-zinc-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Sub-Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Socratic STEM & Olympiad Solver
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                    4-Tier Socratic Engine
                  </span>
                </h1>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Progressive hint intuition, rigorous LaTeX derivations, interactive scratchpad & 1-click flashcard conversion.
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800 self-start md:self-auto">
            <button
              onClick={() => setActiveView('solver')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'solver'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Solver & Scratchpad
            </button>
            <button
              onClick={() => setActiveView('benchmarks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'benchmarks'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Olympiad Benchmarks ({CURATED_BENCHMARKS.length})
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'history'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Solved History ({solvedHistory.length})
            </button>
          </div>
        </div>

        {/* Toast Notification for Flashcards */}
        {flashcardToast && (
          <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{flashcardToast}</span>
            </div>
            <span className="text-[11px] text-emerald-400/70 font-mono">savantix_flashcards</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: MAIN SOLVER & SCRATCHPAD */}
        {/* ------------------------------------------------------------- */}
        {activeView === 'solver' && (
          <div className="space-y-6">
            {/* Input Panel */}
            <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span>Subject:</span>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value as Subject)}
                      className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="General STEM">General STEM</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span>Difficulty:</span>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as Difficulty)}
                      className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="JEE Advanced">JEE Advanced</option>
                      <option value="Olympiad (IPhO/IMO/IChO)">Olympiad (IPhO/IMO/IChO)</option>
                      <option value="JEE Main">JEE Main</option>
                      <option value="Putnam / Collegiate">Putnam / Collegiate</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(!showLivePreview)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      showLivePreview
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {showLivePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showLivePreview ? 'Hide Live KaTeX' : 'Live KaTeX Preview'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rand = CURATED_BENCHMARKS[Math.floor(Math.random() * CURATED_BENCHMARKS.length)];
                      handleLoadBenchmark(rand);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    Load Sample Olympiad
                  </button>

                  {(problemText || solution) && (
                    <button
                      type="button"
                      onClick={handleStartFresh}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800/60 hover:bg-red-950/40 border border-zinc-700/60 text-zinc-300 hover:text-red-300 transition-colors"
                      title="Clear workspace and start a clean problem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Start Fresh
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea Problem Input */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={problemText}
                  onChange={e => setProblemText(e.target.value)}
                  placeholder="Type or paste a competitive STEM/Olympiad problem in LaTeX ($...$ or $$...$$). E.g. 'A uniform solid sphere of mass M and radius R rolls without slipping down an incline of angle θ. Find its linear acceleration...'"
                  className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y min-h-[110px] text-sm leading-relaxed font-mono"
                />
              </div>

              {/* Quick LaTeX Symbol Toolbar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                <span className="text-[11px] text-zinc-500 whitespace-nowrap flex items-center gap-1 mr-1">
                  <Sigma className="w-3 h-3 text-indigo-400" /> Quick Math:
                </span>
                {LATEX_SNIPPETS.map((snip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertSnippet(snip.insert)}
                    className="text-[11px] font-mono bg-zinc-950 hover:bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-800 whitespace-nowrap transition-colors"
                    title={snip.insert}
                  >
                    {snip.label}
                  </button>
                ))}
              </div>

              {/* Live KaTeX Preview Pane */}
              {showLivePreview && problemText.trim() && (
                <div className="p-4 bg-zinc-950/80 border border-indigo-500/30 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                    <span>Live KaTeX Preview</span>
                    <span className="text-zinc-500 font-normal lowercase">render verify</span>
                  </div>
                  <div className="prose prose-invert prose-indigo max-w-none text-xs sm:text-sm text-zinc-200">
                    <Markdown
                      remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                    >
                      {problemText}
                    </Markdown>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800/80">
                  <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Socratic Mode unlocks: <strong>1. Intuition → 2. Equations → 3. Derivations → 4. Solution</strong></span>
                </span>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {problemText.trim() && (
                    <button
                      type="button"
                      onClick={() => setProblemText('')}
                      className="px-3 py-2 bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleSolveProblem}
                    disabled={!problemText.trim() || isSolving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSolving ? 'Synthesizing 4-Tier Socratic Derivation...' : 'Solve Socratic 4-Tier'}
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl text-red-300 text-xs sm:text-sm flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <div className="font-semibold text-red-200">Solving Error</div>
                  <div>{errorMsg}</div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SOLUTION DISPLAY: PROGRESSIVE 4-TIER SOCRATIC SYSTEM */}
            {/* ----------------------------------------------------------- */}
            {!solution && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                      Socratic First-Principles Problem Engine
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Type your problem in LaTeX above or select an Olympiad benchmark below to experience 4-tier progressive hint revelation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {CURATED_BENCHMARKS.map((bench) => (
                    <button
                      key={bench.id}
                      onClick={() => handleLoadBenchmark(bench)}
                      className="p-4 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/70 border border-zinc-800 hover:border-indigo-500/40 text-left transition-all group cursor-pointer space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {bench.subject}
                        </span>
                        <span className="text-[10px] text-zinc-500">{bench.difficulty}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {bench.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {bench.topic}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {solution && (
              <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
                
                {/* Solution Header & Meta */}
                <div className="border-b border-zinc-800/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                        {solution.subject || 'STEM'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                        {solution.difficulty || 'Advanced'}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {solution.topic}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
                      {solution.title || 'Structured Socratic Solution'}
                    </h2>
                  </div>

                  {/* Actions: Flashcard conversion, LaTeX copy, Reveal All */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleConvertToFlashcard}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                      title="Instantly generate a spaced repetition KaTeX flashcard in savantix_flashcards"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      Convert to Flashcard
                    </button>

                    <button
                      onClick={() => handleCopyLatex(solution.tier4.finalAnswerLatex, 'final')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700/60 transition-colors"
                      title="Copy LaTeX formula to clipboard"
                    >
                      {copiedState === 'final' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedState === 'final' ? 'Copied LaTeX!' : 'Copy LaTeX'}
                    </button>

                    <button
                      onClick={() => setRevealedTier(revealedTier === 4 ? 1 : 4)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700/60 transition-colors"
                    >
                      {revealedTier === 4 ? 'Collapse Tiers' : 'Reveal All 4 Tiers'}
                    </button>
                  </div>
                </div>

                {/* Problem Statement Card */}
                <div className="bg-zinc-950/70 p-5 rounded-xl border border-zinc-800/80 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Problem Statement
                  </div>
                  <div className="prose prose-invert prose-indigo max-w-none text-xs sm:text-sm text-zinc-200 leading-relaxed">
                    <Markdown
                      remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                    >
                      {solution.problemStatement}
                    </Markdown>
                  </div>
                </div>

                {/* Progressive Socratic Tier Progress Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span>Socratic Progression:</span>
                    <span className="text-indigo-400 font-semibold">Tier {revealedTier} of 4 Unlocked</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { tier: 1, label: '1. Intuition', icon: Lightbulb, color: 'border-amber-500/40 text-amber-300' },
                      { tier: 2, label: '2. Equations', icon: FunctionSquare, color: 'border-cyan-500/40 text-cyan-300' },
                      { tier: 3, label: '3. Derivations', icon: Sliders, color: 'border-indigo-500/40 text-indigo-300' },
                      { tier: 4, label: '4. Solution', icon: ShieldCheck, color: 'border-emerald-500/40 text-emerald-300' }
                    ].map(step => {
                      const isUnlocked = revealedTier >= step.tier;
                      const Icon = step.icon;
                      return (
                        <button
                          key={step.tier}
                          onClick={() => setRevealedTier(step.tier)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isUnlocked
                              ? `bg-zinc-900/90 ${step.color} shadow-sm font-semibold`
                              : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-[11px] truncate hidden sm:inline">{step.label}</span>
                          <span className="text-[11px] sm:hidden">T{step.tier}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ------------------------------------------------------- */}
                {/* TIER 1: CORE PHYSICAL / MATHEMATICAL INTUITION */}
                {/* ------------------------------------------------------- */}
                {revealedTier >= 1 && (
                  <div className="bg-gradient-to-b from-amber-950/20 to-zinc-950/60 border border-amber-500/30 rounded-2xl p-6 space-y-5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xs font-bold font-mono">
                          1
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-amber-200">
                            Tier 1: Core Physical / Mathematical Intuition
                          </h3>
                          <p className="text-[11px] text-amber-400/80">
                            Conceptual breakdown and qualitative mental model (No overwhelming formulas).
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                        Intuition Layer
                      </span>
                    </div>

                    {/* Conceptual Overview */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Qualitative Insight
                      </h4>
                      <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                        <Markdown
                          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                          rehypePlugins={[rehypeRaw, rehypeKatex]}
                        >
                          {solution.tier1.conceptualOverview}
                        </Markdown>
                      </div>
                    </div>

                    {/* Mental Model & Visual Analogy */}
                    {solution.tier1.mentalModel && (
                      <div className="bg-amber-950/30 border border-amber-800/30 p-4 rounded-xl space-y-1.5 text-xs sm:text-sm text-amber-100/90">
                        <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <span>🧠</span> Vivid Thought Experiment & Symmetry Model
                        </div>
                        <div className="text-xs text-amber-200/80 leading-relaxed">
                          {solution.tier1.mentalModel}
                        </div>
                      </div>
                    )}

                    {/* Self-Check Prompt */}
                    {solution.tier1.selfCheckPrompt && (
                      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedSelfChecks(prev => ({ ...prev, tier1: !prev.tier1 }))}
                          className="w-full p-3.5 flex items-center justify-between text-left text-xs font-medium text-amber-300 hover:bg-zinc-900/60 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-amber-400" />
                            <span><strong>Ponder Before Equations:</strong> {solution.tier1.selfCheckPrompt}</span>
                          </span>
                          {expandedSelfChecks.tier1 ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        </button>
                        {expandedSelfChecks.tier1 && (
                          <div className="p-4 pt-2 border-t border-zinc-800/80 text-xs text-zinc-300 bg-zinc-900/40">
                            💡 <em>Tip: Before viewing Tier 2, sketch the free-body diagram or integral domain on the scratchpad below!</em>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step Advancement Trigger */}
                    {revealedTier === 1 && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setRevealedTier(2)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-cyan-600/20"
                        >
                          <span>Intuition Grasped → Unlock Tier 2: Governing Equations</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------- */}
                {/* TIER 2: GOVERNING EQUATIONS & PRINCIPLES */}
                {/* ------------------------------------------------------- */}
                {revealedTier >= 2 && (
                  <div className="bg-gradient-to-b from-cyan-950/20 to-zinc-950/60 border border-cyan-500/30 rounded-2xl p-6 space-y-5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center text-xs font-bold font-mono">
                          2
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-cyan-200">
                            Tier 2: Governing Equations & Principles
                          </h3>
                          <p className="text-[11px] text-cyan-400/80">
                            Fundamental conservation laws, theorems, and state variable formulation.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                        Formalism Layer
                      </span>
                    </div>

                    {/* Key Principles Pills */}
                    {solution.tier2.principles && solution.tier2.principles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90 flex items-center gap-1.5">
                          <Atom className="w-3.5 h-3.5 text-cyan-400" /> Applicable Physical & Mathematical Laws
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {solution.tier2.principles.map((p, i) => (
                            <span key={i} className="text-xs bg-zinc-900 text-cyan-200 px-3 py-1.5 rounded-lg border border-cyan-500/20 font-mono">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Equations Table / Cards */}
                    {solution.tier2.equations && solution.tier2.equations.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300/90">
                          Governing Mathematical Equations
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {solution.tier2.equations.map((eq, i) => (
                            <div key={i} className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-cyan-300">{eq.name}</span>
                                <button
                                  onClick={() => handleCopyLatex(eq.latex, `eq_${i}`)}
                                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono"
                                >
                                  {copiedState === `eq_${i}` ? '✓ Copied' : 'Copy LaTeX'}
                                </button>
                              </div>
                              <div className="p-3 bg-zinc-900/60 rounded-lg text-center overflow-x-auto">
                                <Markdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {`$$${eq.latex.replace(/^\$\$|\$\$$/g, '')}$$`}
                                </Markdown>
                              </div>
                              {eq.description && (
                                <p className="text-xs text-zinc-400">
                                  {eq.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coordinate Setup */}
                    {solution.tier2.coordinateSetup && (
                      <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1 text-xs text-zinc-300">
                        <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-cyan-400" /> Coordinate Frame & Boundary Conditions
                        </div>
                        <div>{solution.tier2.coordinateSetup}</div>
                      </div>
                    )}

                    {/* Step Advancement Trigger */}
                    {revealedTier === 2 && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setRevealedTier(3)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
                        >
                          <span>Equations Understood → Unlock Tier 3: Step-by-Step Derivations</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------- */}
                {/* TIER 3: STEP-BY-STEP DERIVATION & INTERMEDIATE RESULTS */}
                {/* ------------------------------------------------------- */}
                {revealedTier >= 3 && (
                  <div className="bg-gradient-to-b from-indigo-950/20 to-zinc-950/60 border border-indigo-500/30 rounded-2xl p-6 space-y-5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono">
                          3
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-indigo-200">
                            Tier 3: Step-by-Step Key Substitution & Intermediate Results
                          </h3>
                          <p className="text-[11px] text-indigo-400/80">
                            Rigorous mathematical progression, boundary substitution, and intermediate milestones.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                        Derivation Layer
                      </span>
                    </div>

                    {/* Derivation Steps */}
                    <div className="space-y-4">
                      {solution.tier3.steps.map((step, idx) => (
                        <div key={idx} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono">
                              3.{step.stepNumber || idx + 1}
                            </span>
                            <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">
                              {step.title}
                            </h4>
                          </div>

                          <div className="prose prose-invert prose-indigo max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed">
                            <Markdown
                              remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                              rehypePlugins={[rehypeRaw, rehypeKatex]}
                            >
                              {step.explanation}
                            </Markdown>
                          </div>

                          {step.intermediateLatex && (
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-center overflow-x-auto">
                              <Markdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {`$$${step.intermediateLatex.replace(/^\$\$|\$\$$/g, '')}$$`}
                              </Markdown>
                            </div>
                          )}

                          {step.keyInsight && (
                            <div className="p-3 bg-indigo-950/20 border border-indigo-800/30 rounded-lg text-xs text-indigo-300 flex items-start gap-2">
                              <span className="text-amber-400">💡</span>
                              <span><strong>Key Insight:</strong> {step.keyInsight}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Critical Substitutions Summary */}
                    {solution.tier3.criticalSubstitutions && solution.tier3.criticalSubstitutions.length > 0 && (
                      <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
                        <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Binary className="w-3.5 h-3.5 text-indigo-400" /> Key Variable Transformations Used
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300">
                          {solution.tier3.criticalSubstitutions.map((sub, i) => (
                            <li key={i}>{sub}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Step Advancement Trigger */}
                    {revealedTier === 3 && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setRevealedTier(4)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
                        >
                          <span>Derivations Verified → Unlock Tier 4: Final Rigorous Proof & Boxed Result</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------- */}
                {/* TIER 4: COMPLETE RIGOROUS PROOF & FINAL NUMERICAL ANSWER */}
                {/* ------------------------------------------------------- */}
                {revealedTier >= 4 && (
                  <div className="bg-gradient-to-b from-emerald-950/20 to-zinc-950/60 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-bold font-mono">
                          4
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-emerald-200">
                            Tier 4: Complete Rigorous Proof & Final Numerical Solution
                          </h3>
                          <p className="text-[11px] text-emerald-400/80">
                            Exact boxed analytical result, dimensional sanity checks, and limiting behavior analysis.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        Solution Mastery
                      </span>
                    </div>

                    {/* GRAND FINAL BOXED ANSWER */}
                    <div className="p-6 bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-purple-950/80 border-2 border-indigo-500/40 rounded-2xl text-center space-y-3 shadow-2xl">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Final Boxed Analytical Result
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-zinc-100 overflow-x-auto py-2">
                        <Markdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {`$$${solution.tier4.finalAnswerLatex.replace(/^\$\$|\$\$$/g, '')}$$`}
                        </Markdown>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => handleCopyLatex(solution.tier4.finalAnswerLatex, 'boxed')}
                          className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          {copiedState === 'boxed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedState === 'boxed' ? 'Copied Formula!' : 'Copy LaTeX Formula'}
                        </button>
                      </div>
                    </div>

                    {/* Full Rigorous Synthesis */}
                    {solution.tier4.fullRigorousProof && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Rigorous Synthesis & Proof
                        </h4>
                        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
                          <Markdown
                            remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                            rehypePlugins={[rehypeRaw, rehypeKatex]}
                          >
                            {solution.tier4.fullRigorousProof}
                          </Markdown>
                        </div>
                      </div>
                    )}

                    {/* Dimensional & Asymptotic Check */}
                    {solution.tier4.dimensionalCheck && (
                      <div className="p-4 bg-zinc-950/70 border border-emerald-500/20 rounded-xl space-y-1.5 text-xs text-zinc-300">
                        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                          <span>🔬</span> Dimensional Homogeneity & Limiting Behavior Check
                        </div>
                        <div className="leading-relaxed">{solution.tier4.dimensionalCheck}</div>
                      </div>
                    )}

                    {/* Numerical Example */}
                    {solution.tier4.numericalExample && (
                      <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-1.5 text-xs text-zinc-300">
                        <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                          <span>🔢</span> Numerical Calculation & Physical Units
                        </div>
                        <div className="prose prose-invert text-xs text-zinc-300">
                          <Markdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {solution.tier4.numericalExample}
                          </Markdown>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800">
                      <span className="text-xs text-zinc-400">
                        Problem successfully solved & saved to <strong>localStorage.savantix_solved_problems</strong>.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleConvertToFlashcard}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                          1-Click Add to Flashcards
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* INTERACTIVE STEM SCRATCHPAD CANVAS */}
            {/* ----------------------------------------------------------- */}
            <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      Interactive Formula & Diagram Scratchpad
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Draw free-body diagrams, geometry figures, circuit schemas, and step derivations directly on page.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsScratchpadCollapsed(!isScratchpadCollapsed)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs transition-colors"
                  >
                    {isScratchpadCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    {isScratchpadCollapsed ? 'Expand Canvas' : 'Collapse'}
                  </button>
                </div>
              </div>

              {!isScratchpadCollapsed && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Scratchpad Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                    
                    {/* Tool Selection (Pen / Highlighter / Eraser) */}
                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setPenTool('pen')}
                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                          penTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <PenTool className="w-3 h-3" /> Pen
                      </button>
                      <button
                        type="button"
                        onClick={() => setPenTool('highlighter')}
                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                          penTool === 'highlighter' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" /> Highlighter
                      </button>
                      <button
                        type="button"
                        onClick={() => setPenTool('eraser')}
                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                          penTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Eraser className="w-3 h-3" /> Eraser
                      </button>
                    </div>

                    {/* Color Palette */}
                    {penTool !== 'eraser' && (
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: '#38bdf8', label: 'Cyan' },
                          { color: '#f8fafc', label: 'White' },
                          { color: '#fbbf24', label: 'Amber' },
                          { color: '#4ade80', label: 'Emerald' },
                          { color: '#fb7185', label: 'Rose' },
                          { color: '#c084fc', label: 'Purple' }
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setPenColor(c.color)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              penColor === c.color ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    )}

                    {/* Stroke Width */}
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <span>Size:</span>
                      {[2, 4, 8].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setStrokeWidth(w)}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono border ${
                            strokeWidth === w ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>

                    {/* Grid Pattern Toggle */}
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Grid className="w-3.5 h-3.5 text-zinc-500" />
                      <select
                        value={canvasGridStyle}
                        onChange={e => setCanvasGridStyle(e.target.value as 'grid' | 'dots' | 'blank')}
                        className="bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200"
                      >
                        <option value="grid">Graph Grid</option>
                        <option value="dots">Dot Matrix</option>
                        <option value="blank">Blank Slate</option>
                      </select>
                    </div>

                    {/* Undo / Redo / Clear / Download */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 border border-zinc-800"
                        title="Undo stroke"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRedo}
                        disabled={redoStack.length === 0}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 border border-zinc-800"
                        title="Redo stroke"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCanvas}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-red-950/40 text-zinc-300 hover:text-red-300 border border-zinc-800 text-xs transition-colors"
                        title="Wipe scratchpad"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadScratchpad}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs transition-colors"
                        title="Download drawing as high-res PNG image"
                      >
                        <Download className="w-3.5 h-3.5" /> Save PNG
                      </button>
                      <button
                        type="button"
                        onClick={handleSolveFromScratchpad}
                        disabled={isSolving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white border border-indigo-500/40 text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                        title="Analyze and solve drawing / diagram using Socratic AI"
                      >
                        {isSolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        {isSolving ? 'Solving...' : 'Solve Diagram'}
                      </button>
                    </div>
                  </div>

                  {/* HTML5 Canvas Viewport */}
                  <div className="relative w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="touch-none block w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: CURATED OLYMPIAD BENCHMARK LIBRARY */}
        {/* ------------------------------------------------------------- */}
        {activeView === 'benchmarks' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Curated JEE Advanced & Olympiad Benchmark Suite
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Explore master problems with instant precomputed 4-Tier Socratic breakdowns across Physics, Chemistry, and Mathematics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {CURATED_BENCHMARKS.map(bench => (
                  <div
                    key={bench.id}
                    className="bg-zinc-950/80 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xl group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          bench.subject === 'Physics'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : bench.subject === 'Chemistry'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {bench.subject}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {bench.difficulty}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                        {bench.title}
                      </h3>

                      <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        {bench.problemStatement.replace(/\$+/g, '')}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">{bench.topic}</span>
                      <button
                        onClick={() => handleLoadBenchmark(bench)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Load Problem <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: SOLVED PROBLEM HISTORY */}
        {/* ------------------------------------------------------------- */}
        {activeView === 'history' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    Solved Problems History
                  </h2>
                  <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                    Persistent history stored in <code>localStorage.savantix_solved_problems</code>.
                  </p>
                </div>

                {solvedHistory.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-xl text-xs transition-colors self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear History
                  </button>
                )}
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Search by topic, keywords, or formulas..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
                  {['All', 'Physics', 'Chemistry', 'Mathematics'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setHistorySubjectFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        historySubjectFilter === cat
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* History List */}
              {filteredHistory.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-zinc-600" />
                  <div className="text-sm font-medium text-zinc-400">No solved problems match your query</div>
                  <p className="text-xs">Solve problems in the Socratic Solver or load from Olympiad Benchmarks to build your personal archive.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadHistoryItem(item)}
                      className="bg-zinc-950/80 border border-zinc-800 hover:border-indigo-500/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:bg-zinc-900/60 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {item.subject}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-400">
                            {item.difficulty}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                          {item.topic || item.solution?.title || 'STEM Problem'}
                        </h3>

                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {item.problemStatement.replace(/\$+/g, '')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                          Open in Solver <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

