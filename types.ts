export enum Language {
  EN = 'en',
  ZH = 'zh'
}

export interface Commit {
  id: string;
  message: string;
  parentId: string | null;
  parentIds?: string[]; // For merges
  timestamp: number;
  lane?: number; // Visual lane index
}

export interface Branch {
  name: string;
  commitId: string;
  isRemote?: boolean;
}

export interface StagingArea {
  files: string[];
}

export interface GitState {
  commits: Commit[];
  branches: Branch[];
  HEAD: {
    type: 'branch' | 'commit';
    ref: string; // Branch name or Commit ID
  };
  staging: StagingArea;
  workingDirectory: string[];
}

export interface Scenario {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  initialState: GitState;
}

export interface SimulationResponse {
  newState: GitState;
  explanation: string;
  error?: string;
}

export interface LogEntry {
  id: string;
  type: 'command' | 'response' | 'error';
  content: string;
  timestamp: number;
}