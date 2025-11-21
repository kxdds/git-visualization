import React, { useRef, useEffect, useState } from 'react';
import { Send, Terminal, ChevronRight, RotateCcw, GitCommit, GitBranch, GitMerge, ArrowRightCircle, Upload, Download, Cloud, FilePlus, PlusSquare, X, Tag as TagIcon } from 'lucide-react';
import { LogEntry, Language, GitState } from '../types';
import { UI_TEXT, PRESET_COMMANDS } from '../constants';

interface ConsoleProps {
  language: Language;
  logs: LogEntry[];
  gitState: GitState;
  onCommand: (cmd: string) => void;
  isLoading: boolean;
  currentInput: string;
  onInputChange: (val: string) => void;
  setLanguage: (lang: Language) => void;
}

// 目标选择器状态接口 (用于 merge, checkout 等命令的目标选择)
interface SelectorState {
  isOpen: boolean;     // 选择器是否打开
  commandPrefix: string; // 命令前缀 (如 "git merge")
  options: Array<{ label: string; value: string; sub?: string }>; // 可选项列表
  title: string;       // 选择器标题
}

/**
 * Console 组件
 * 负责右侧的交互逻辑，包括命令输入、日志显示、快捷命令按钮以及动态目标选择。
 */
const Console: React.FC<ConsoleProps> = ({
  language,
  logs,
  gitState,
  onCommand,
  isLoading,
  currentInput,
  onInputChange,
  setLanguage
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 目标选择器模态框状态
  const [selector, setSelector] = useState<SelectorState>({
    isOpen: false,
    commandPrefix: '',
    options: [],
    title: ''
  });

  // 计数器状态，用于自动生成唯一的文件名、分支名和提交信息
  const [counters, setCounters] = useState({
    file: 1,
    branch: 1,
    commit: 1,
    tag: 1
  });

  // 自动滚动到日志底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isLoading]);

  // 处理表单提交 (Enter 键)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim() && !isLoading) {
      onCommand(currentInput.trim());
    }
  };

  // 处理选择器中的选项点击
  const handleOptionSelect = (value: string) => {
    onCommand(`${selector.commandPrefix} ${value}`);
    setSelector({ ...selector, isOpen: false });
  };

  /**
   * 处理快捷命令按钮点击
   * 包含拦截逻辑，如果命令需要指定目标 (如 merge 哪个分支)，则弹出选择器
   */
  const handlePresetClick = (cmdTemplate: string) => {
    if (isLoading) return;

    // 1. 拦截 MERGE: 让用户选择要合并的分支
    if (cmdTemplate.includes('git merge')) {
      const branches = gitState.branches.filter(b => b.name !== gitState.HEAD.ref);
      if (branches.length > 0) {
        setSelector({
          isOpen: true,
          commandPrefix: 'git merge',
          title: language === Language.EN ? 'Select Branch to Merge' : '选择要合并的分支',
          options: branches.map(b => ({ label: b.name, value: b.name }))
        });
        return;
      }
    }

    // 2. 拦截 REBASE: 让用户选择基底分支
    if (cmdTemplate.includes('git rebase')) {
      const branches = gitState.branches.filter(b => b.name !== gitState.HEAD.ref);
      if (branches.length > 0) {
        setSelector({
          isOpen: true,
          commandPrefix: 'git rebase',
          title: language === Language.EN ? 'Select Base Branch' : '选择变基的目标分支',
          options: branches.map(b => ({ label: b.name, value: b.name }))
        });
        return;
      }
    }

    // 3. 拦截 CHECKOUT: 让用户选择要切换的分支 (排除新建分支操作 -b)
    if (cmdTemplate.includes('git checkout') && !cmdTemplate.includes('-b') && !cmdTemplate.includes('main')) {
      // 排除 'main' 的情况，如果用户显式点击了 'checkout main' 按钮
      const branches = gitState.branches.filter(b => b.name !== gitState.HEAD.ref);
      if (branches.length > 0) {
        setSelector({
          isOpen: true,
          commandPrefix: 'git checkout',
          title: language === Language.EN ? 'Select Branch' : '切换分支',
          options: branches.map(b => ({ label: b.name, value: b.name }))
        });
        return;
      }
    }

    // 4. 拦截 ADD: 如果工作区有文件，让用户选择
    if (cmdTemplate.includes('git add .')) {
      const files = gitState.workingDirectory;
      if (files.length > 0) {
        setSelector({
          isOpen: true,
          commandPrefix: 'git add',
          title: language === Language.EN ? 'Select File to Stage' : '选择要暂存的文件',
          options: [
            { label: language === Language.EN ? 'All Files (.)' : '所有文件 (.)', value: '.', sub: 'Recommended' },
            ...files.map(f => ({ label: f, value: f }))
          ]
        });
        return;
      }
    }

    // 5. 拦截 RESET (Hard): 提供重置目标选项
    if (cmdTemplate.includes('git reset --hard')) {
      setSelector({
        isOpen: true,
        commandPrefix: 'git reset --hard',
        title: language === Language.EN ? 'Reset to...' : '重置到...',
        options: [
          { label: 'HEAD~1 (Previous)', value: 'HEAD~1' },
          { label: 'HEAD~2', value: 'HEAD~2' },
          { label: 'Origin Main', value: 'origin/main' }
        ]
      });
      return;
    }

    // 6. 回退: 使用动态生成逻辑 (如 touch file_1, branch feature-2)
    let finalCmd = cmdTemplate;
    const newCounters = { ...counters };

    // 动态创建文件
    if (cmdTemplate.startsWith('touch')) {
      finalCmd = `touch file_${newCounters.file}.txt`;
      newCounters.file += 1;
    }
    // 动态创建分支
    else if (cmdTemplate.includes('git branch') && !cmdTemplate.includes('-d')) {
      finalCmd = `git branch feature-${newCounters.branch}`;
      newCounters.branch += 1;
    }
    // 动态提交信息
    else if (cmdTemplate.includes('git commit')) {
      finalCmd = `git commit -m "Update ${newCounters.commit}"`;
      newCounters.commit += 1;
    }
    // 动态创建标签
    else if (cmdTemplate.includes('git tag')) {
      finalCmd = `git tag v1.${newCounters.tag}`;
      newCounters.tag += 1;
    }

    setCounters(newCounters);
    onCommand(finalCmd);
  };

  // 根据命令类型获取对应的图标
  const getIcon = (cmd: string) => {
    if (cmd.includes('commit')) return <GitCommit size={14} />;
    if (cmd.includes('branch')) return <GitBranch size={14} />;
    if (cmd.includes('merge') || cmd.includes('rebase')) return <GitMerge size={14} />;
    if (cmd.includes('checkout')) return <ArrowRightCircle size={14} />;
    if (cmd.includes('reset') || cmd.includes('revert')) return <RotateCcw size={14} />;
    if (cmd.includes('push')) return <Upload size={14} />;
    if (cmd.includes('pull')) return <Download size={14} />;
    if (cmd.includes('fetch') || cmd.includes('clone')) return <Cloud size={14} />;
    if (cmd.includes('add')) return <PlusSquare size={14} />;
    if (cmd.includes('touch')) return <FilePlus size={14} />;
    if (cmd.includes('tag')) return <TagIcon size={14} />;
    return <Terminal size={14} />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-xl relative">

      {/* 目标选择器遮罩层 */}
      {selector.isOpen && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col p-4 animate-fade-in">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
            <h3 className="font-bold text-blue-400 text-sm flex items-center gap-2">
              <Terminal size={16} />
              {selector.title}
            </h3>
            <button onClick={() => setSelector({ ...selector, isOpen: false })} className="text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {selector.options.length === 0 ? (
              <div className="text-slate-500 text-xs italic text-center mt-4">
                {language === Language.EN ? 'No available targets' : '没有可用的目标'}
              </div>
            ) : (
              selector.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.value)}
                  className="w-full text-left p-3 rounded bg-slate-800 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm text-slate-200 group-hover:text-white">{opt.label}</span>
                    {opt.sub && <span className="text-[10px] text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded">{opt.sub}</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    {selector.commandPrefix} {opt.value}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 头部: 标题与语言切换 */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
        <div className="flex items-center gap-2 text-blue-400">
          <Terminal size={20} />
          <h2 className="font-bold tracking-wider text-sm uppercase">{UI_TEXT[language].title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage(Language.EN)}
            className={`text-xs px-2 py-1 rounded ${language === Language.EN ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage(Language.ZH)}
            className={`text-xs px-2 py-1 rounded ${language === Language.ZH ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            中文
          </button>
        </div>
      </div>

      {/* 日志显示区域 */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-4 custom-scrollbar" ref={scrollRef}>
        {logs.length === 0 && (
          <div className="text-slate-500 text-center mt-10 italic opacity-50">
            {language === Language.EN ? 'Ready for commands...' : '准备就绪...'}
          </div>
        )}

        {logs.map((log) => (
          <div key={log.id} className={`animate-fade-in flex flex-col gap-1`}>
            {/* 用户命令日志 */}
            {log.type === 'command' && (
              <div className="flex items-center gap-2 text-slate-400">
                <ChevronRight size={14} />
                <span className="font-bold text-slate-200">{log.content}</span>
              </div>
            )}
            {/* 系统响应日志 (高亮冲突/警告) */}
            {log.type === 'response' && (
              <div className={`ml-5 pl-2 border-l-2 p-2 rounded text-xs leading-relaxed whitespace-pre-wrap ${log.content.startsWith('CONFLICT') || log.content.startsWith('WARNING')
                ? 'border-orange-500/50 text-orange-200 bg-orange-950/10'
                : 'border-blue-500/30 text-blue-200 bg-blue-950/10'
                }`}>
                {log.content}
              </div>
            )}
            {/* 错误日志 */}
            {log.type === 'error' && (
              <div className="ml-5 pl-2 border-l-2 border-red-500/50 text-red-400 bg-red-950/10 p-2 rounded text-xs">
                {log.content}
              </div>
            )}
          </div>
        ))}

        {/* Loading 指示器 */}
        {isLoading && (
          <div className="flex items-center gap-2 ml-5 text-blue-400/70 animate-pulse text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            {UI_TEXT[language].loading}
          </div>
        )}
      </div>

      {/* 快捷命令区域 */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex-shrink-0">
        <div className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider px-1">
          {language === Language.EN ? 'Quick Commands' : '常用命令'}
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
          {PRESET_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(cmd.cmd)}
              disabled={isLoading}
              className="text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 hover:border-blue-500/50 text-slate-300 text-xs rounded border border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
            >
              <span className="text-slate-500 group-hover:text-blue-400 transition-colors min-w-[14px]">
                {getIcon(cmd.cmd)}
              </span>
              <span className="truncate">{cmd.label[language]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 输入框区域 */}
      <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="relative flex items-center">
          <span className="absolute left-3 text-slate-500 font-mono">$</span>
          <input
            type="text"
            className="w-full bg-slate-900 text-slate-100 pl-7 pr-12 py-3 rounded-md border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm transition-all"
            placeholder={UI_TEXT[language].inputPlaceholder}
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !currentInput.trim()}
            className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50 disabled:bg-slate-700"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Console;