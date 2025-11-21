import React, { useMemo } from 'react';
import { GitState, Commit, Branch, Tag } from '../types';
import * as d3 from 'd3'; // 仅导入类型，逻辑中使用 React 渲染 SVG

interface GitGraphProps {
  state: GitState;
}

// 布局常量配置
const X_SPACING = 80;   // 提交节点之间的水平间距
const Y_SPACING = 60;   // 分支泳道之间的垂直间距
const NODE_RADIUS = 18; // 提交节点的半径
const PADDING = 50;     // 画布内边距

/**
 * GitGraph 组件
 * 使用 SVG 可视化展示 Git 提交历史图、分支指针和 HEAD 位置。
 */
const GitGraph: React.FC<GitGraphProps> = ({ state }) => {

  // 使用 useMemo 计算节点位置和连接线，避免重复计算
  const { nodes, links, width, height } = useMemo(() => {
    // 1. 按时间戳排序提交
    const sortedCommits = [...state.commits].sort((a, b) => a.timestamp - b.timestamp);

    // 2. 计算动态顶部边距
    // 如果很多分支或标签指向同一个提交，标签会堆叠，需要增加顶部空间防止被截断
    const labelsByCommit = new Map<string, number>();

    // 统计分支数量
    state.branches.forEach(b => {
      labelsByCommit.set(b.commitId, (labelsByCommit.get(b.commitId) || 0) + 1);
    });
    // 统计标签数量 (确保 tags 存在)
    (state.tags || []).forEach(t => {
      labelsByCommit.set(t.commitId, (labelsByCommit.get(t.commitId) || 0) + 1);
    });

    let maxLabelStack = 0;
    for (const count of labelsByCommit.values()) {
      maxLabelStack = Math.max(maxLabelStack, count);
    }

    // 动态计算垂直偏移量: 基础 60px + 每个堆叠标签约 28px + 缓冲
    const VERTICAL_OFFSET = Math.max(60, maxLabelStack * 28 + 30);

    const nodeMap = new Map<string, { x: number, y: number, data: Commit }>();

    let maxX = 0;
    let maxY = 0;

    // 3. 计算每个 Commit 节点的坐标
    sortedCommits.forEach((commit, index) => {
      const x = PADDING + index * X_SPACING;
      // y 轴由 lane (泳道) 决定，实现多分支并行视觉效果
      const y = VERTICAL_OFFSET + (commit.lane || 0) * Y_SPACING;

      nodeMap.set(commit.id, { x, y, data: commit });
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });

    const linksData: { x1: number; y1: number; x2: number; y2: number, targetId: string }[] = [];

    // 4. 生成连接线数据
    sortedCommits.forEach(commit => {
      const source = nodeMap.get(commit.id);
      if (!source) return;

      // 处理单个父节点
      if (commit.parentId) {
        const target = nodeMap.get(commit.parentId);
        if (target) {
          linksData.push({ x1: source.x, y1: source.y, x2: target.x, y2: target.y, targetId: target.data.id });
        }
      }

      // 处理合并提交 (多个父节点)
      if (commit.parentIds && commit.parentIds.length > 0) {
        commit.parentIds.forEach(pid => {
          // 避免重复添加主要父节点
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
      width: Math.max(maxX + PADDING + 150, 800), // 保证最小宽度
      height: Math.max(maxY + PADDING + 50, 500)  // 保证最小高度
    };
  }, [state.commits, state.branches, state.tags]);

  // 辅助函数：获取 HEAD 的可视化位置
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
      if (node) return { x: node.x, y: node.y, label: state.HEAD.type === 'branch' ? `HEAD -> ${state.HEAD.ref}` : `HEAD -> ${commitId.substring(0, 4)}` };
    }
    return null;
  };

  const headPos = getHeadPosition();

  // 辅助函数：获取指向特定 Commit 的所有分支
  const getBranchLabels = (commitId: string) => {
    return state.branches.filter(b => b.commitId === commitId);
  };

  // 辅助函数：获取指向特定 Commit 的所有标签
  const getTagLabels = (commitId: string) => {
    return (state.tags || []).filter(t => t.commitId === commitId);
  };

  return (
    <div className="w-full h-full overflow-auto bg-slate-900 rounded-lg shadow-inner relative custom-scrollbar">
      <svg width={width} height={height} className="block">
        <defs>
          {/* 定义箭头标记 */}
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>

        {/* 绘制连接线 (使用贝塞尔曲线) */}
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

        {/* 绘制节点 */}
        {nodes.map((node) => {
          const branches = getBranchLabels(node.data.id);
          const tags = getTagLabels(node.data.id);

          // 将所有标签混合用于堆叠计算 (Branch + Tag)
          const allLabels = [
            ...branches.map(b => ({ ...b, type: 'branch' })),
            ...tags.map(t => ({ ...t, type: 'tag' }))
          ];

          return (
            <g key={node.data.id}>
              {/* 提交圆圈 */}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill="#1e293b"
                stroke={branches.length > 0 ? "#3b82f6" : "#10b981"} // 有分支指向时变蓝，否则为绿
                strokeWidth="3"
                className="transition-all duration-300 hover:r-6"
              />

              {/* 提交 ID 文本 */}
              <text
                x={node.x}
                y={node.y}
                dy="5"
                textAnchor="middle"
                className="text-[10px] font-mono fill-gray-300 pointer-events-none select-none"
              >
                {node.data.id.substring(0, 4)}
              </text>

              {/* 提交信息 (显示在节点下方) */}
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 font-mono max-w-[100px]"
              >
                {node.data.message.length > 15 ? node.data.message.substring(0, 12) + '...' : node.data.message}
              </text>

              {/* 绘制分支和标签 (堆叠显示在节点上方) */}
              {allLabels.map((item, idx) => {
                const isBranch = item.type === 'branch';
                const isRemote = isBranch && ((item as any).isRemote || item.name.startsWith('origin/'));
                const isHead = isBranch && state.HEAD.ref === item.name;

                // 样式配置
                let bgFill = "#0f766e"; // 默认 Teal (本地分支)
                let textColor = "#ffffff";
                let strokeColor = "none";
                let strokeWidth = "0";
                let strokeDash = "none";

                if (isBranch) {
                  if (isHead) {
                    bgFill = "#3b82f6"; // 蓝色 (当前分支)
                  } else if (isRemote) {
                    bgFill = "#5b21b6"; // 紫色 (远程分支)
                    strokeColor = "#a78bfa"; // 浅紫色边框
                    strokeWidth = "1.5";
                    strokeDash = "3 2"; // 虚线边框
                  }
                } else {
                  // Tag 样式
                  bgFill = "#fbbf24"; // 黄色 (标签)
                  textColor = "#78350f"; // 深褐色文字
                }

                // 根据名称长度动态计算标签宽度
                const labelWidth = Math.max(80, item.name.length * 8 + 20);
                const labelX = -labelWidth / 2;

                return (
                  <g key={item.name} transform={`translate(${node.x}, ${node.y - 30 - (idx * 26)})`}>
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
                    {/* Tag 小圆点装饰 */}
                    {!isBranch && (
                      <circle cx={labelX + 8} cy="1" r="2.5" fill="#78350f" />
                    )}
                    <text
                      x={!isBranch ? 4 : 0}
                      y="4"
                      textAnchor="middle"
                      className={`text-[10px] font-bold pointer-events-none ${!isBranch ? '' : ''}`}
                      fill={textColor}
                    >
                      {item.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )
        }
        )}

        {/* HEAD 指示器环 (高亮显示 HEAD 位置) */}
        {headPos && (
          <g transform={`translate(${headPos.x}, ${headPos.y})`} className="transition-all duration-500 ease-in-out">
            <circle r={NODE_RADIUS + 6} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 2" className="animate-spin-slow" />
          </g>
        )}
      </svg>

      {/* 悬浮图例 */}
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
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-3 h-3 rounded bg-[#fbbf24]"></span>
          <span className="text-xs text-gray-300">Tag</span>
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