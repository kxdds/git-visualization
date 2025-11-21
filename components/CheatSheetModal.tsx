import React from 'react';
import { X, Terminal } from 'lucide-react';
import { GIT_COMMAND_DETAILS, UI_TEXT } from '../constants';
import { Language } from '../types';

interface CheatSheetModalProps {
  isOpen: boolean;       // 模态框是否打开
  onClose: () => void;   // 关闭回调
  language: Language;    // 当前语言
}

/**
 * CheatSheetModal 组件
 * 显示 Git 命令大全，包含详细的说明和用法示例。
 */
const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
              <Terminal size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{UI_TEXT[language].cheatSheet}</h2>
              <p className="text-sm text-slate-400">Reference guide for common Git commands</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域：网格展示命令 */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GIT_COMMAND_DETAILS.map((category, idx) => (
              <div key={idx} className="space-y-4">
                {/* 类别标题 */}
                <h3 className="text-lg font-semibold text-blue-400 border-b border-slate-800 pb-2 mb-3">
                  {category.category[language]}
                </h3>
                <div className="space-y-3">
                  {/* 命令列表 */}
                  {category.commands.map((cmd, cmdIdx) => (
                    <div key={cmdIdx} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
                      <div className="flex items-baseline justify-between mb-2">
                        <code className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded">
                          {cmd.name}
                        </code>
                      </div>
                      <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                        {cmd.desc[language]}
                      </p>
                      <div className="text-xs font-mono text-slate-500 bg-slate-950/50 p-2 rounded border border-slate-800/50 flex items-center gap-2">
                        <span className="text-slate-600">$</span>
                        <span className="text-slate-400">{cmd.usage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors text-sm font-medium"
          >
            {UI_TEXT[language].close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheatSheetModal;