import React, { useState, useCallback } from 'react';
import { GitBranch, GitCommit, BookOpen, Layers } from 'lucide-react';
import { GitState, LogEntry, Language, Scenario } from './types';
import { INITIAL_GIT_STATE, UI_TEXT, BACKGROUND_COMMANDS } from './constants';
import { executeLocalCommand } from './services/localGitEngine';
import GitGraph from './components/GitGraph';
import Console from './components/Console';
import CheatSheetModal from './components/CheatSheetModal';
import ScenarioModal from './components/ScenarioModal';

/**
 * App 组件
 * 应用程序的主入口，负责管理核心状态和布局。
 */
const App: React.FC = () => {
  // --- 状态管理 ---

  // 当前语言设置 (中文/英文)
  const [language, setLanguage] = useState<Language>(Language.ZH);

  // 核心 Git 状态 (包含提交历史、分支、HEAD 指针等)
  const [gitState, setGitState] = useState<GitState>(INITIAL_GIT_STATE);

  // 控制台日志列表 (包含用户命令、系统响应和错误信息)
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init',
      type: 'response',
      content: language === Language.ZH ? '欢迎使用 GitViz AI！输入 git 命令开始学习。' : 'Welcome to GitViz AI! Enter a git command to start learning.',
      timestamp: Date.now()
    }
  ]);

  // 当前输入框的值
  const [currentInput, setCurrentInput] = useState('');

  // 加载状态 (模拟命令处理延迟)
  const [isLoading, setIsLoading] = useState(false);

  // 模态框可见性状态
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  /**
   * 处理用户提交的命令
   * @param commandStr 用户输入的命令字符串
   */
  const handleCommand = useCallback(async (commandStr: string) => {
    if (!commandStr.trim()) return;

    // 1. 添加用户命令到日志
    const cmdLogId = Date.now().toString();
    const newCmdLog: LogEntry = {
      id: cmdLogId,
      type: 'command',
      content: commandStr,
      timestamp: Date.now()
    };
    setLogs(prev => [...prev, newCmdLog]);
    setCurrentInput('');
    setIsLoading(true);

    // 2. 调用本地 Git 引擎模拟执行
    // 使用 setTimeout 模拟处理延迟，提升交互真实感
    setTimeout(async () => {
      const result = await executeLocalCommand(gitState, commandStr, language);

      setIsLoading(false);

      // 3. 根据结果更新状态或显示错误
      if (result.error) {
        setLogs(prev => [...prev, {
          id: Date.now().toString() + '-err',
          type: 'error',
          content: result.error || 'Unknown error',
          timestamp: Date.now()
        }]);
      } else {
        setGitState(result.newState);
        setLogs(prev => [...prev, {
          id: Date.now().toString() + '-res',
          type: 'response',
          content: result.explanation,
          timestamp: Date.now()
        }]);
      }
    }, 300);

  }, [gitState, language]);

  /**
   * 加载预设场景
   * @param scenario 选中的场景对象
   */
  const handleLoadScenario = (scenario: Scenario) => {
    setGitState(scenario.initialState);
    setLogs(prev => [...prev, {
      id: Date.now().toString() + '-scenario',
      type: 'response',
      content: language === Language.ZH
        ? `已加载场景: ${scenario.title[Language.ZH]}\n${scenario.description[Language.ZH]}`
        : `Scenario Loaded: ${scenario.title[Language.EN]}\n${scenario.description[Language.EN]}`,
      timestamp: Date.now()
    }]);
    setIsScenarioModalOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* 模态框组件 */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        language={language}
      />

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelectScenario={handleLoadScenario}
        language={language}
      />

      {/* 左侧面板: 可视化展示区 */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* 顶部导航栏 */}
        <header className="h-14 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-md shadow-lg shadow-orange-500/20">
              <GitBranch size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-100">{UI_TEXT[language].title}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{UI_TEXT[language].subtitle}</p>
            </div>
          </div>

          {/* 状态统计与功能按钮 */}
          <div className="flex items-center gap-6">
            {/* 简易统计 (仅在大屏显示) */}
            <div className="flex gap-6 text-xs text-slate-400 font-mono hidden md:flex">
              <div className="flex items-center gap-2">
                <GitCommit size={14} />
                <span>{gitState.commits.length} {UI_TEXT[language].commits}</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch size={14} />
                <span>{gitState.branches.length} {UI_TEXT[language].branches}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 场景选择按钮 */}
              <button
                onClick={() => setIsScenarioModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-all border border-slate-700 hover:border-purple-500/50"
              >
                <Layers size={14} />
                <span>{UI_TEXT[language].scenarios}</span>
              </button>

              {/* 命令大全按钮 */}
              <button
                onClick={() => setIsCheatSheetOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium transition-all border border-slate-700 hover:border-blue-500/50"
              >
                <BookOpen size={14} />
                <span>{UI_TEXT[language].cheatSheet}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Git 图形容器 */}
        <div className="flex-1 p-4 overflow-hidden relative bg-slate-950">
          {/* 装饰性背景层 (透明的 Git 命令) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 flex flex-wrap content-center justify-center opacity-[0.02]">
            <div className="w-full h-full flex flex-wrap gap-8 p-10 justify-center content-center transform -rotate-12 scale-110">
              {BACKGROUND_COMMANDS.map((cmd, i) => (
                <span key={i} className="text-4xl md:text-6xl font-black font-mono text-white whitespace-nowrap">
                  {cmd}
                </span>
              ))}
              {/* 重复填充空间 */}
              {BACKGROUND_COMMANDS.map((cmd, i) => (
                <span key={`rep-${i}`} className="text-4xl md:text-6xl font-black font-mono text-white whitespace-nowrap">
                  {cmd}
                </span>
              ))}
            </div>
          </div>

          {/* 点阵背景纹理 */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>

          {/* 核心可视化组件 */}
          <GitGraph state={gitState} />
        </div>
      </main>

      {/* 右侧面板: 控制台交互区 */}
      <aside className="w-96 min-w-[350px] max-w-[450px] z-10 h-full">
        <Console
          language={language}
          logs={logs}
          gitState={gitState}
          onCommand={handleCommand}
          isLoading={isLoading}
          currentInput={currentInput}
          onInputChange={setCurrentInput}
          setLanguage={setLanguage}
        />
      </aside>
    </div>
  );
};

export default App;