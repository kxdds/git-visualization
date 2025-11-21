// 语言枚举：支持英语 (EN) 和中文 (ZH)
export enum Language {
  EN = 'en',
  ZH = 'zh'
}

// 提交对象接口
export interface Commit {
  id: string;           // 提交哈希/ID
  message: string;      // 提交信息
  parentId: string | null; // 父提交 ID (初始提交为 null)
  parentIds?: string[]; // 用于合并提交 (Merge Commits) 的多个父级
  timestamp: number;    // 时间戳 (用于排序)
  lane?: number;        // 可视化时的泳道索引 (用于绘制多分支图)
}

// 分支对象接口
export interface Branch {
  name: string;         // 分支名称
  commitId: string;     // 该分支当前指向的提交 ID
  isRemote?: boolean;   // 是否为远程分支 (如 origin/main)
}

// 标签对象接口
export interface Tag {
  name: string;         // 标签名称
  commitId: string;     // 标签指向的提交 ID
}

// 远程仓库接口
export interface Remote {
  name: string;         // 远程仓库别名 (如 origin)
  url: string;          // 仓库地址
}

// 暂存区接口
export interface StagingArea {
  files: string[];      // 已暂存的文件列表
}

// 核心 Git 状态接口
export interface GitState {
  commits: Commit[];    // 所有提交历史
  branches: Branch[];   // 所有分支
  tags: Tag[];          // 所有标签
  remotes: Remote[];    // 配置的远程仓库
  HEAD: {
    type: 'branch' | 'commit'; // HEAD 指向分支还是具体的 commit (分离头指针)
    ref: string;        // 分支名或 Commit ID
  };
  staging: StagingArea; // 暂存区状态
  workingDirectory: string[]; // 工作区中已修改但未暂存的文件
}

// 练习场景接口
export interface Scenario {
  id: string;
  title: Record<Language, string>;       // 标题 (多语言)
  description: Record<Language, string>; // 描述 (多语言)
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'; // 难度等级
  initialState: GitState;                // 场景加载时的初始 Git 状态
}

// 模拟执行结果接口
export interface SimulationResponse {
  newState: GitState;   // 执行命令后的新状态
  explanation: string;  // 对操作的文字解释
  error?: string;       // 如果出错，返回错误信息
}

// 日志条目接口 (用于控制台显示)
export interface LogEntry {
  id: string;
  type: 'command' | 'response' | 'error'; // 日志类型：用户命令、系统响应、错误
  content: string;      // 内容
  timestamp: number;
}