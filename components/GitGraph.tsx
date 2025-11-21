import React, { useMemo } from 'react';
import { GitState, Commit, Branch } from '../types';
import * as d3 from 'd3'; // Importing d3 types mainly for logic, but using raw React SVG for rendering

interface GitGraphProps {
  state: GitState;
}

// Layout constants
const X_SPACING = 80;
const Y_SPACING = 60;
const NODE_RADIUS = 18;
const PADDING = 50;

const GitGraph: React.FC<GitGraphProps> = ({ state }) => {
  
  // Calculate positions for rendering
  const { nodes, links, width, height } = useMemo(() => {
    const sortedCommits = [...state.commits].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate max branch stack to determine top padding requirement
    // If many branches point to the same commit, we need more space on top.
    const branchesByCommit = new Map<string, number>();
    state.branches.forEach(b => {
       branchesByCommit.set(b.commitId, (branchesByCommit.get(b.commitId) || 0) + 1);
    });
    let maxBranchStack = 0;
    for (const count of branchesByCommit.values()) {
        maxBranchStack = Math.max(maxBranchStack, count);
    }

    // Dynamic Top Padding: Base 60 + space for each stacked label (approx 26px each)
    const VERTICAL_OFFSET = Math.max(60, maxBranchStack * 28 + 30);

    const nodeMap = new Map<string, { x: number, y: number, data: Commit }>();
    
    let maxX = 0;
    let maxY = 0;

    sortedCommits.forEach((commit, index) => {
      const x = PADDING + index * X_SPACING;
      // Use the dynamic VERTICAL_OFFSET
      const y = VERTICAL_OFFSET + (commit.lane || 0) * Y_SPACING;
      
      nodeMap.set(commit.id, { x, y, data: commit });
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });

    const linksData: { x1: number; y1: number; x2: number; y2: number, targetId: string }[] = [];

    sortedCommits.forEach(commit => {
      const source = nodeMap.get(commit.id);
      if (!source) return;

      // Handle single parent
      if (commit.parentId) {
        const target = nodeMap.get(commit.parentId);
        if (target) {
          linksData.push({ x1: source.x, y1: source.y, x2: target.x, y2: target.y, targetId: target.data.id });
        }
      }
      
      // Handle merge parents (parentIds)
      if (commit.parentIds && commit.parentIds.length > 0) {
        commit.parentIds.forEach(pid => {
           // Avoid duplicating the primary parentId if it's also in parentIds
           if (pid !== commit.parentId) {
             const target = nodeMap.get(pid);
             if (target) {
               linksData.push({ x1: source.x, y1: source.y, x2: target.x, y2: target.y, targetId: target.data.id });
             }
           }
        });
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: linksData,
      width: Math.max(maxX + PADDING + 150, 800), // Extra width for end labels
      height: Math.max(maxY + PADDING + 50, 500)  // Minimum height
    };
  }, [state.commits, state.branches]);

  // Helper to find HEAD position
  const getHeadPosition = () => {
    let commitId: string | null = null;
    
    if (state.HEAD.type === 'commit') {
      commitId = state.HEAD.ref;
    } else {
      const branch = state.branches.find(b => b.name === state.HEAD.ref);
      if (branch) commitId = branch.commitId;
    }
    
    if (commitId) {
      const node = nodes.find(n => n.data.id === commitId);
      if (node) return { x: node.x, y: node.y, label: state.HEAD.type === 'branch' ? `HEAD -> ${state.HEAD.ref}` : `HEAD -> ${commitId.substring(0,4)}` };
    }
    return null;
  };

  const headPos = getHeadPosition();

  // Helper to get branch labels for a commit
  const getBranchLabels = (commitId: string) => {
    return state.branches.filter(b => b.commitId === commitId);
  };

  return (
    <div className="w-full h-full overflow-auto bg-slate-900 rounded-lg shadow-inner relative custom-scrollbar">
      <svg width={width} height={height} className="block">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>

        {/* Links */}
        {links.map((link, i) => (
          <path
            key={`link-${i}`}
            d={`M${link.x2},${link.y2} C${link.x2 + 40},${link.y2} ${link.x1 - 40},${link.y1} ${link.x1},${link.y1}`}
            stroke="#475569"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Nodes */}
        {nodes.map((node) => {
            const branches = getBranchLabels(node.data.id);
            return (
            <g key={node.data.id}>
              {/* Commit Circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill="#1e293b"
                stroke={branches.length > 0 ? "#3b82f6" : "#10b981"}
                strokeWidth="3"
                className="transition-all duration-300 hover:r-6"
              />
              
              {/* Commit ID */}
              <text
                x={node.x}
                y={node.y}
                dy="5"
                textAnchor="middle"
                className="text-[10px] font-mono fill-gray-300 pointer-events-none select-none"
              >
                {node.data.id.substring(0, 4)}
              </text>

              {/* Message Tooltip/Label (Simplified as text below) */}
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 font-mono max-w-[100px]"
              >
                {node.data.message.length > 15 ? node.data.message.substring(0, 12) + '...' : node.data.message}
              </text>

              {/* Branch Labels */}
              {branches.map((branch, idx) => {
                const isRemote = branch.isRemote || branch.name.startsWith('origin/');
                const isHead = state.HEAD.ref === branch.name;
                
                // Colors & Styles
                let bgFill = "#0f766e"; // Default Teal (Local)
                let strokeColor = "none";
                let strokeWidth = "0";
                let strokeDash = "none";

                if (isHead) {
                    bgFill = "#3b82f6"; // Blue (Current HEAD)
                } else if (isRemote) {
                    bgFill = "#5b21b6"; // Darker Purple Background
                    strokeColor = "#a78bfa"; // Light Purple Border
                    strokeWidth = "1.5";
                    strokeDash = "3 2"; // Dashed border for remote
                }

                // Calculate dynamic width based on name length
                // Approx 8px per char + padding to be safe
                const labelWidth = Math.max(80, branch.name.length * 8 + 20);
                const labelX = -labelWidth / 2;

                return (
                  <g key={branch.name} transform={`translate(${node.x}, ${node.y - 30 - (idx * 26)})`}>
                    <rect
                      x={labelX}
                      y="-10"
                      width={labelWidth}
                      height="22"
                      rx="4"
                      fill={bgFill}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      opacity="0.95"
                      className="shadow-sm"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-white pointer-events-none"
                    >
                      {branch.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        )}

        {/* HEAD Indicator (if detached or purely visual overlay) */}
        {headPos && (
          <g transform={`translate(${headPos.x}, ${headPos.y})`} className="transition-all duration-500 ease-in-out">
             <circle r={NODE_RADIUS + 6} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 2" className="animate-spin-slow" />
          </g>
        )}
      </svg>
      
      {/* Floating Legend/Info */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 p-3 rounded border border-slate-700 backdrop-blur-sm shadow-lg">
         <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded bg-[#3b82f6]"></span>
            <span className="text-xs text-gray-300">Active Branch (HEAD)</span>
         </div>
         <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded bg-[#0f766e]"></span>
            <span className="text-xs text-gray-300">Local Branch</span>
         </div>
         <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded bg-[#5b21b6] border border-dashed border-[#a78bfa]"></span>
            <span className="text-xs text-gray-300">Remote Branch</span>
         </div>
         <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
            <span className="w-3 h-3 rounded-full bg-slate-900 border-2 border-emerald-500"></span>
            <span className="text-xs text-gray-300">Commit Node</span>
         </div>
      </div>
    </div>
  );
};

export default GitGraph;