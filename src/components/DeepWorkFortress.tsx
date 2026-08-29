import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { X, BookOpen, Edit3, Maximize2 } from 'lucide-react';

interface DeepWorkFortressProps {
  onClose: () => void;
}

const FORMULA_SHEET = `
## Physics
- **Newton's Second Law**: $F = ma$
- **Kinematics**: $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 = u^2 + 2as$
- **Kinetic Energy**: $K = \\frac{1}{2}mv^2$
- **Rotational**: $\\tau = I\\alpha$, $L = I\\omega$
- **Wave Speed**: $v = f\\lambda$
- **Thermodynamics (Ideal Gas)**: $PV = nRT$

## Chemistry
- **Equilibrium Constant**: $K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}$
- **Nernst Equation**: $E = E^\\circ - \\frac{RT}{nF}\\ln Q$
- **pH Buffer (Henderson-Hasselbalch)**: $\\text{pH} = \\text{p}K_a + \\log\\left(\\frac{[A^-]}{[HA]}\\right)$
- **Periodic Trends**: Atomic radius decreases $\\rightarrow$, Electronegativity increases $\\rightarrow$

## Mathematics
- **Calculus Basics**: $\\frac{d}{dx}(x^n) = nx^{n-1}$, $\\int x^n dx = \\frac{x^{n+1}}{n+1}$
- **Trig Identities**: $\\sin^2\\theta + \\cos^2\\theta = 1$, $\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta$
- **Euler's Identity**: $e^{i\\pi} + 1 = 0$
- **Taylor Series**: $f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n$
`;

export const DeepWorkFortress: React.FC<DeepWorkFortressProps> = ({ onClose }) => {
  const [scratchpad, setScratchpad] = useState('');
  const [showFormulas, setShowFormulas] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Enter fullscreen
    document.documentElement.requestFullscreen().catch(() => {});

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[50] bg-zinc-950 flex flex-col overflow-hidden">
      {/* Ambient pulsing focus ring (centered) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-[1px] border-indigo-500/30 bg-indigo-500/5 animate-[ping_4s_ease-in-out_infinite] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border-[1px] border-cyan-500/20 bg-cyan-500/5 animate-[ping_6s_ease-in-out_infinite] pointer-events-none"></div>
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[55]">
        <div className="text-indigo-400 font-bold tracking-widest uppercase text-sm flex items-center gap-2">
          <Maximize2 className="w-4 h-4" /> Focus Fortress
        </div>
        <button 
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
            onClose();
          }}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg flex items-center gap-2 transition-colors border border-zinc-800 cursor-pointer"
        >
          <X className="w-4 h-4" /> Exit Fortress (Esc)
        </button>
      </div>

      {/* Side Panels */}
      <div className="absolute top-24 bottom-6 left-6 w-80 flex flex-col gap-4 z-[55]">
        <button 
          onClick={() => setShowFormulas(!showFormulas)}
          className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 flex items-center justify-center gap-2 transition-colors font-medium cursor-pointer"
        >
          <BookOpen className="w-4 h-4" /> 
          {showFormulas ? 'Hide Formula Sheet' : 'Show Formula Sheet'}
        </button>
        
        {showFormulas && (
          <div className="flex-1 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 p-4 overflow-y-auto scrollbar-thin text-sm text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {FORMULA_SHEET}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="absolute top-24 bottom-6 right-6 w-80 flex flex-col z-[55]">
        <div className="flex-1 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2 text-zinc-400 font-medium text-sm">
            <Edit3 className="w-4 h-4" /> KaTeX Scratchpad
          </div>
          <textarea
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="Type markdown & $math$ here..."
            className="flex-1 w-full bg-transparent p-4 text-sm text-zinc-300 focus:outline-none resize-none placeholder:text-zinc-700 font-mono"
          />
          <div className="h-1/2 border-t border-zinc-800 p-4 overflow-y-auto bg-zinc-950/50 text-sm text-zinc-300 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {scratchpad || '*Live preview will appear here*'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
