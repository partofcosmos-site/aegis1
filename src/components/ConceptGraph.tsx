import React, { useState, useMemo } from 'react';
import { Network, Sparkles, Layers, Search, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ConceptNode {
  id: string;
  label: string;
  subject: 'Physics' | 'Math' | 'Chemistry';
  mastery: number; // 0 - 100
  x: number;
  y: number;
  connections: string[]; // Node IDs connected to
  prerequisites: string[];
}

const DEFAULT_CONCEPTS: ConceptNode[] = [
  // Physics Cluster
  { id: 'p1', label: 'Kinematics & Vectors', subject: 'Physics', mastery: 95, x: 200, y: 150, connections: ['p2', 'p3'], prerequisites: [] },
  { id: 'p2', label: "Newton's Laws & Friction", subject: 'Physics', mastery: 85, x: 320, y: 100, connections: ['p1', 'p4'], prerequisites: ['p1'] },
  { id: 'p3', label: 'Work, Energy & Power', subject: 'Physics', mastery: 90, x: 300, y: 220, connections: ['p1', 'p4', 'p5'], prerequisites: ['p1'] },
  { id: 'p4', label: 'Rotational Dynamics & Torque', subject: 'Physics', mastery: 70, x: 450, y: 140, connections: ['p2', 'p3', 'p6'], prerequisites: ['p2', 'p3'] },
  { id: 'p5', label: 'Simple Harmonic Motion', subject: 'Physics', mastery: 80, x: 420, y: 260, connections: ['p3'], prerequisites: ['p3'] },
  { id: 'p6', label: 'Electromagnetism & Induction', subject: 'Physics', mastery: 65, x: 580, y: 180, connections: ['p4'], prerequisites: ['p4'] },

  // Math Cluster
  { id: 'm1', label: 'Functions & Limits', subject: 'Math', mastery: 90, x: 220, y: 380, connections: ['m2'], prerequisites: [] },
  { id: 'm2', label: 'Differential Calculus', subject: 'Math', mastery: 85, x: 350, y: 360, connections: ['m1', 'm3', 'p1'], prerequisites: ['m1'] },
  { id: 'm3', label: 'Integral Calculus', subject: 'Math', mastery: 75, x: 480, y: 390, connections: ['m2', 'm4', 'p3'], prerequisites: ['m2'] },
  { id: 'm4', label: 'Differential Equations', subject: 'Math', mastery: 60, x: 600, y: 350, connections: ['m3', 'p5'], prerequisites: ['m3'] },

  // Chemistry Cluster
  { id: 'c1', label: 'Chemical Bonding & Structure', subject: 'Chemistry', mastery: 90, x: 250, y: 520, connections: ['c2'], prerequisites: [] },
  { id: 'c2', label: 'Chemical Thermodynamics', subject: 'Chemistry', mastery: 75, x: 380, y: 500, connections: ['c1', 'c3', 'p3'], prerequisites: ['c1'] },
  { id: 'c3', label: 'Chemical Kinetics & Equilibrium', subject: 'Chemistry', mastery: 70, x: 520, y: 510, connections: ['c2', 'm2'], prerequisites: ['c2'] }
];

export const ConceptGraph: React.FC = () => {
  const { logs } = useAppContext();
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Math' | 'Chemistry'>('All');
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(DEFAULT_CONCEPTS[3]); // Rotational Dynamics default
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically compute mastery based on logged study minutes & problems
  const nodes = useMemo(() => {
    return DEFAULT_CONCEPTS.map(node => {
      const relatedLogs = logs.filter(l => 
        l.topic?.toLowerCase().includes(node.label.toLowerCase()) ||
        node.label.toLowerCase().includes(l.topic?.toLowerCase() || '___')
      );

      const totalProblems = relatedLogs.reduce((acc, l) => acc + (Number(l.problemsSolved) || 0), 0);
      const calculatedMastery = Math.min(100, Math.max(node.mastery, totalProblems > 0 ? 50 + totalProblems * 2 : node.mastery));

      return {
        ...node,
        mastery: calculatedMastery
      };
    });
  }, [logs]);

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchSub = selectedSubject === 'All' || n.subject === selectedSubject;
      const matchSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSub && matchSearch;
    });
  }, [nodes, selectedSubject, searchQuery]);

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 90) return { stroke: '#10B981', fill: '#064E3B', label: 'Olympiad Master' }; // Emerald
    if (mastery >= 75) return { stroke: '#6366F1', fill: '#312E81', label: 'Proficient' };       // Indigo
    if (mastery >= 60) return { stroke: '#F59E0B', fill: '#78350F', label: 'Practicing' };       // Amber
    return { stroke: '#EF4444', fill: '#7F1D1D', label: 'Needs Focus' };                         // Red
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Network className="w-6 h-6 text-indigo-400" />
              Topic Mastery & Concept Constellation
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Visual dependency graph mapping conceptual prerequisites and dynamic mastery levels.
            </p>
          </div>

          {/* Subject Filter Bar */}
          <div className="flex gap-2">
            {(['All', 'Physics', 'Math', 'Chemistry'] as const).map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedSubject === sub
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search concepts, physical laws, or topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Interactive Graph Canvas + Inspector Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Graph View */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-h-[460px] relative overflow-hidden flex items-center justify-center">
            <svg className="w-full h-full min-h-[440px]" viewBox="100 50 600 520">
              {/* Render Connection Lines */}
              {nodes.map(node =>
                node.connections.map(targetId => {
                  const target = nodes.find(n => n.id === targetId);
                  if (!target) return null;
                  const isSelected = selectedNode?.id === node.id || selectedNode?.id === target.id;

                  return (
                    <line
                      key={`${node.id}-${target.id}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isSelected ? '#818CF8' : '#27272A'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      strokeDasharray={isSelected ? 'none' : '4 4'}
                    />
                  );
                })
              )}

              {/* Render Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const colors = getMasteryColor(node.mastery);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    {/* Outer Glow for selected */}
                    {isSelected && (
                      <circle r="26" fill={colors.stroke} opacity="0.25" className="animate-ping" />
                    )}

                    <circle
                      r="18"
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? '3' : '2'}
                      className="transition-all duration-300 group-hover:scale-110"
                    />

                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#FFFFFF"
                      className="pointer-events-none select-none font-mono"
                    >
                      {node.mastery}%
                    </text>

                    <text
                      textAnchor="middle"
                      dy="32"
                      fontSize="10.5"
                      fontWeight="500"
                      fill={isSelected ? '#FFFFFF' : '#A1A1AA'}
                      className="pointer-events-none select-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Inspector Drawer */}
          {selectedNode ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  {selectedNode.subject}
                </span>
                <h3 className="text-xl font-bold text-zinc-100 mt-2">{selectedNode.label}</h3>
              </div>

              {/* Mastery Gauge */}
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Mastery Rating</span>
                  <span className="font-bold text-emerald-400">{selectedNode.mastery}% ({getMasteryColor(selectedNode.mastery).label})</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedNode.mastery}%` }}
                  />
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Prerequisites</h4>
                {selectedNode.prerequisites.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.prerequisites.map(pId => {
                      const pNode = nodes.find(n => n.id === pId);
                      return (
                        <span key={pId} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700">
                          {pNode?.label || pId}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Foundational concept (No prior prerequisites)</p>
                )}
              </div>

              {/* Connected Concepts */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Connected Downstream Concepts</h4>
                <div className="space-y-1.5">
                  {selectedNode.connections.map(cId => {
                    const cNode = nodes.find(n => n.id === cId);
                    if (!cNode) return null;
                    return (
                      <div
                        key={cId}
                        onClick={() => setSelectedNode(cNode)}
                        className="flex items-center justify-between p-2.5 bg-zinc-950/60 hover:bg-zinc-800/80 rounded-lg text-xs text-zinc-300 cursor-pointer border border-zinc-800 transition-colors"
                      >
                        <span>{cNode.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-zinc-500">
              <Network className="w-10 h-10 mb-3 text-zinc-700" />
              <p className="text-sm">Click any node on the graph to inspect prerequisites and drill into concept mastery.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
