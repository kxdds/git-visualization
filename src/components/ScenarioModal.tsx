import React from 'react';
import { X, PlayCircle, Layers, ArrowRight } from 'lucide-react';
import { SCENARIOS, UI_TEXT } from '../constants';
import { Language, Scenario } from '../types';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: Scenario) => void;
  language: Language;
}

/**
 * ScenarioModal 组件
 * 展示预设的学习场景，允许用户点击加载不同的 Git 状态进行练习。
 */
const ScenarioModal: React.FC<ScenarioModalProps> = ({ isOpen, onClose, onSelectScenario, language }) => {
  if (!isOpen) return null;

  // 根据难度返回不同的颜色样式
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-emerald-400 bg-emerald-950/30 border-emerald-800';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-950/30 border-yellow-800';
      case 'Advanced': return 'text-red-400 bg-red-950/30 border-red-800';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* 顶部标题 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg text-purple-400">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{UI_TEXT[language].scenarios}</h2>
              <p className="text-sm text-slate-400">
                {language === Language.EN ? 'Select a scenario to practice specific Git concepts' : '选择一个场景来练习特定的 Git 概念'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 场景列表 */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                className="group relative bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-800 transition-all cursor-pointer flex flex-col"
                onClick={() => onSelectScenario(scenario)}
              >
                <div className="flex justify-between items-start mb-3">
                  {/* 难度标签 */}
                  <div className={`text-xs font-bold px-2 py-0.5 rounded border ${getDifficultyColor(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                </div>

                {/* 场景标题 */}
                <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-purple-300 transition-colors">
                  {scenario.title[language]}
                </h3>

                {/* 场景描述 */}
                <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">
                  {scenario.description[language]}
                </p>

                <button
                  className="mt-auto w-full py-2 bg-slate-900 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-purple-500 flex items-center justify-center gap-2"
                >
                  <PlayCircle size={16} />
                  {UI_TEXT[language].load}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 底部关闭按钮 */}
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

export default ScenarioModal;