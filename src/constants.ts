import { GitState, Language, Scenario } from './types';

// 应用的初始 Git 状态
export const INITIAL_GIT_STATE: GitState = {
  commits: [
    { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 }
  ],
  branches: [
    { name: 'main', commitId: 'c1' }
  ],
  tags: [],
  remotes: [], // 初始化远程仓库为空
  HEAD: {
    type: 'branch',
    ref: 'main'
  },
  staging: { files: [] },
  workingDirectory: []
};

// 预设的学习场景列表
export const SCENARIOS: Scenario[] = [
  {
    id: 'basic-diverge',
    difficulty: 'Beginner',
    title: { [Language.EN]: 'Diverged Branches', [Language.ZH]: '分支分叉 (Merge 练习)' },
    description: {
      [Language.EN]: 'Two branches have diverged. Try to merge "feature" into "main".',
      [Language.ZH]: '两个分支已经分叉。尝试将 "feature" 分支合并到 "main" 分支。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Main update', parentId: 'c1', timestamp: 2, lane: 0 },
        { id: 'c3', message: 'Feature work', parentId: 'c1', timestamp: 3, lane: 1 },
      ],
      branches: [
        { name: 'main', commitId: 'c2' },
        { name: 'feature', commitId: 'c3' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'branch', ref: 'main' },
      staging: { files: [] },
      workingDirectory: []
    }
  },
  {
    id: 'merge-conflict',
    difficulty: 'Advanced',
    title: { [Language.EN]: 'Merge Conflict', [Language.ZH]: '合并冲突 (Conflict)' },
    description: {
      [Language.EN]: 'Both branches modified "config.json". Try to merge "feature" into "main" to see a conflict.',
      [Language.ZH]: '两个分支都修改了 "config.json"。尝试将 "feature" 合并到 "main" 以触发冲突。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Update config port', parentId: 'c1', timestamp: 2, lane: 0 },
        { id: 'c3', message: 'Update config host', parentId: 'c1', timestamp: 3, lane: 1 },
      ],
      branches: [
        { name: 'main', commitId: 'c2' },
        { name: 'feature', commitId: 'c3' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'branch', ref: 'main' },
      staging: { files: [] },
      workingDirectory: []
    }
  },
  {
    id: 'detached-head',
    difficulty: 'Intermediate',
    title: { [Language.EN]: 'Detached HEAD', [Language.ZH]: 'HEAD 分离状态' },
    description: {
      [Language.EN]: 'HEAD is pointing directly to a commit, not a branch. Try to create a branch here or switch back to main.',
      [Language.ZH]: 'HEAD 直接指向了一个提交，而不是分支。尝试在这里创建一个新分支，或者切回 main。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Bug fix', parentId: 'c1', timestamp: 2, lane: 0 },
      ],
      branches: [
        { name: 'main', commitId: 'c2' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'commit', ref: 'c1' },
      staging: { files: [] },
      workingDirectory: []
    }
  },
  {
    id: 'rebase-interactive',
    difficulty: 'Advanced',
    title: { [Language.EN]: 'Interactive Rebase', [Language.ZH]: '交互式变基 (Rebase -i)' },
    description: {
      [Language.EN]: 'Feature branch has messy commits ("wip", "typo"). Try to rebase them onto main or squash them.',
      [Language.ZH]: 'Feature 分支有杂乱的提交 ("wip", "typo")。尝试将它们变基到 main 上，或者压缩它们。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Main update', parentId: 'c1', timestamp: 2, lane: 0 },
        { id: 'c3', message: 'WIP feature', parentId: 'c1', timestamp: 3, lane: 1 },
        { id: 'c4', message: 'Fix typo', parentId: 'c3', timestamp: 4, lane: 1 },
        { id: 'c5', message: 'Finish feature', parentId: 'c4', timestamp: 5, lane: 1 },
      ],
      branches: [
        { name: 'main', commitId: 'c2' },
        { name: 'feature', commitId: 'c5' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'branch', ref: 'feature' },
      staging: { files: [] },
      workingDirectory: []
    }
  },
  {
    id: 'cherry-pick',
    difficulty: 'Intermediate',
    title: { [Language.EN]: 'Cherry Pick', [Language.ZH]: '拣选提交 (Cherry-Pick)' },
    description: {
      [Language.EN]: 'You need the "Critical fix" from the feature branch applied to main, but NOT the experimental features.',
      [Language.ZH]: '你需要将 feature 分支的 "Critical fix" 应用到 main，但不需要那些实验性功能。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Experimental 1', parentId: 'c1', timestamp: 2, lane: 1 },
        { id: 'c3', message: 'Critical fix', parentId: 'c2', timestamp: 3, lane: 1 },
        { id: 'c4', message: 'Experimental 2', parentId: 'c3', timestamp: 4, lane: 1 },
      ],
      branches: [
        { name: 'main', commitId: 'c1' },
        { name: 'feature', commitId: 'c4' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'branch', ref: 'main' },
      staging: { files: [] },
      workingDirectory: []
    }
  },
  {
    id: 'remote-sync',
    difficulty: 'Intermediate',
    title: { [Language.EN]: 'Remote Out of Sync', [Language.ZH]: '远程同步 (Push/Pull)' },
    description: {
      [Language.EN]: 'Local has new commits, and Origin has different new commits. You need to pull/merge before pushing.',
      [Language.ZH]: '本地有新提交，远程仓库也有不同的新提交。你需要先拉取(Pull)合并，然后才能推送(Push)。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Local work', parentId: 'c1', timestamp: 2, lane: 0 },
        { id: 'c3', message: 'Remote work', parentId: 'c1', timestamp: 3, lane: 1 },
      ],
      branches: [
        { name: 'main', commitId: 'c2' },
        { name: 'origin/main', commitId: 'c3', isRemote: true }
      ],
      tags: [],
      remotes: [{ name: 'origin', url: 'https://github.com/example/repo.git' }],
      HEAD: { type: 'branch', ref: 'main' },
      staging: { files: [] },
      workingDirectory: []
    }
  },
  {
    id: 'stash-needed',
    difficulty: 'Beginner',
    title: { [Language.EN]: 'Stash Needed', [Language.ZH]: '暂存现场 (Stash)' },
    description: {
      [Language.EN]: 'You have uncommitted changes but need to switch to the "urgent-fix" branch. Try git stash.',
      [Language.ZH]: '你有未提交的更改，但需要切换到 "urgent-fix" 分支。尝试使用 git stash。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Urgent request', parentId: 'c1', timestamp: 2, lane: 1 }
      ],
      branches: [
        { name: 'main', commitId: 'c1' },
        { name: 'urgent-fix', commitId: 'c2' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'branch', ref: 'main' },
      staging: { files: [] },
      workingDirectory: ['half-written-code.js']
    }
  },
  {
    id: 'amend-commit',
    difficulty: 'Beginner',
    title: { [Language.EN]: 'Amend Commit', [Language.ZH]: '修正提交 (Amend)' },
    description: {
      [Language.EN]: 'You forgot to include "readme.md" in the last commit. Stage it and amend the commit.',
      [Language.ZH]: '你忘记在上次提交中包含 "readme.md"。暂存它并修正(amend)上次提交。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 },
        { id: 'c2', message: 'Add project files', parentId: 'c1', timestamp: 2, lane: 0 }
      ],
      branches: [
        { name: 'main', commitId: 'c2' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'branch', ref: 'main' },
      staging: { files: [] },
      workingDirectory: ['readme.md']
    }
  },
  {
    id: 'staging-mess',
    difficulty: 'Beginner',
    title: { [Language.EN]: 'Messy Staging Area', [Language.ZH]: '暂存区管理' },
    description: {
      [Language.EN]: 'Files are in working dir and staging. Try to commit staged ones, or reset them.',
      [Language.ZH]: '工作区和暂存区都有文件。尝试提交已暂存的文件，或者重置它们。'
    },
    initialState: {
      commits: [
        { id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 }
      ],
      branches: [
        { name: 'main', commitId: 'c1' }
      ],
      tags: [],
      remotes: [],
      HEAD: { type: 'branch', ref: 'main' },
      staging: { files: ['style.css', 'index.html'] },
      workingDirectory: ['script.js']
    }
  }
];

// 右侧控制台的快捷命令按钮列表
export const PRESET_COMMANDS = [
  // 文件操作
  { cmd: 'touch file.txt', label: { [Language.EN]: 'Create File', [Language.ZH]: '新建文件 (Touch)' } },
  { cmd: 'git add .', label: { [Language.EN]: 'Stage All', [Language.ZH]: '暂存所有 (Add)' } },
  { cmd: 'git commit -m "msg"', label: { [Language.EN]: 'Commit', [Language.ZH]: '提交 (Commit)' } },
  { cmd: 'git status', label: { [Language.EN]: 'Status', [Language.ZH]: '查看状态 (Status)' } },

  // 分支与流控制
  { cmd: 'git branch feature', label: { [Language.EN]: 'New Branch', [Language.ZH]: '新建分支 (Branch)' } },
  { cmd: 'git checkout feature', label: { [Language.EN]: 'Checkout', [Language.ZH]: '切换分支 (Checkout)' } },
  { cmd: 'git merge feature', label: { [Language.EN]: 'Merge', [Language.ZH]: '合并 (Merge)' } },
  { cmd: 'git tag v1.0', label: { [Language.EN]: 'Tag', [Language.ZH]: '打标签 (Tag)' } },

  // 远程操作
  { cmd: 'git fetch origin', label: { [Language.EN]: 'Fetch', [Language.ZH]: '获取 (Fetch)' } },
  { cmd: 'git pull', label: { [Language.EN]: 'Pull', [Language.ZH]: '拉取 (Pull)' } },
  { cmd: 'git push', label: { [Language.EN]: 'Push', [Language.ZH]: '推送 (Push)' } },
  { cmd: 'git clone https://github.com/repo.git', label: { [Language.EN]: 'Clone', [Language.ZH]: '克隆 (Clone)' } },

  // 高级 / 撤销
  { cmd: 'git rebase main', label: { [Language.EN]: 'Rebase', [Language.ZH]: '变基 (Rebase)' } },
  { cmd: 'git reset --hard HEAD~1', label: { [Language.EN]: 'Reset Hard', [Language.ZH]: '硬重置 (Reset Hard)' } },
  { cmd: 'git revert HEAD', label: { [Language.EN]: 'Revert', [Language.ZH]: '撤销 (Revert)' } },
  { cmd: 'git log --oneline --graph', label: { [Language.EN]: 'Log Graph', [Language.ZH]: '日志图 (Log)' } },
];

// 用于界面背景的装饰性 Git 命令文本
export const BACKGROUND_COMMANDS = [
  "git init", "git status", "git add", "git commit",
  "git branch", "git checkout", "git merge", "git pull",
  "git push", "git fetch", "git clone", "git rebase",
  "git reset", "git revert", "git log", "git diff",
  "git remote", "git stash", "git tag", "git config"
];

// Git 命令大全的详细数据（用于模态框展示）
export const GIT_COMMAND_DETAILS = [
  {
    category: { [Language.EN]: "Setup & Config", [Language.ZH]: "初始化与配置" },
    commands: [
      {
        name: "git config",
        desc: { [Language.EN]: "Get and set repository or global options", [Language.ZH]: "获取和设置仓库或全局选项" },
        usage: "git config --global user.name 'Name'\ngit config --global user.email 'email@example.com'"
      },
      {
        name: "git init",
        desc: { [Language.EN]: "Create an empty Git repository or reinitialize an existing one", [Language.ZH]: "创建一个空的 Git 仓库或重新初始化现有仓库" },
        usage: "git init [project-name]"
      },
      {
        name: "git clone",
        desc: { [Language.EN]: "Clone a repository into a new directory", [Language.ZH]: "将存储库克隆到新目录中" },
        usage: "git clone <url>\ngit clone <url> <dir>\ngit clone --depth 1 <url>"
      },
      {
        name: "git remote",
        desc: { [Language.EN]: "Manage set of tracked repositories", [Language.ZH]: "管理跟踪的远程仓库集合" },
        usage: "git remote -v\ngit remote add origin <url>\ngit remote set-url origin <url>"
      }
    ]
  },
  {
    category: { [Language.EN]: "Snapshotting (Basic)", [Language.ZH]: "快照基础 (工作流)" },
    commands: [
      {
        name: "git status",
        desc: { [Language.EN]: "Show the working tree status", [Language.ZH]: "显示工作树状态（已修改、已暂存、未跟踪）" },
        usage: "git status\ngit status -s (short format)"
      },
      {
        name: "git add",
        desc: { [Language.EN]: "Add file contents to the index", [Language.ZH]: "将文件内容添加到索引（暂存区）" },
        usage: "git add .\ngit add <file>\ngit add -p (interactive)\ngit add -u (update)"
      },
      {
        name: "git commit",
        desc: { [Language.EN]: "Record changes to the repository", [Language.ZH]: "将暂存区的更改记录到仓库中" },
        usage: "git commit -m 'msg'\ngit commit -am 'msg' (add & commit)\ngit commit --amend (modify last commit)"
      },
      {
        name: "git restore",
        desc: { [Language.EN]: "Restore working tree files", [Language.ZH]: "恢复工作树文件（丢弃更改）" },
        usage: "git restore <file>\ngit restore --staged <file> (unstage)"
      },
      {
        name: "git rm",
        desc: { [Language.EN]: "Remove files from the working tree and from the index", [Language.ZH]: "从工作树和索引中删除文件" },
        usage: "git rm <file>\ngit rm --cached <file> (keep local)"
      },
      {
        name: "git mv",
        desc: { [Language.EN]: "Move or rename a file, a directory, or a symlink", [Language.ZH]: "移动或重命名文件、目录或符号链接" },
        usage: "git mv <old> <new>"
      }
    ]
  },
  {
    category: { [Language.EN]: "Branching & Merging", [Language.ZH]: "分支与合并" },
    commands: [
      {
        name: "git branch",
        desc: { [Language.EN]: "List, create, or delete branches", [Language.ZH]: "列出、创建或删除分支" },
        usage: "git branch (list)\ngit branch <name>\ngit branch -d <name> (delete)\ngit branch -m <old> <new> (rename)"
      },
      {
        name: "git checkout",
        desc: { [Language.EN]: "Switch branches or restore working tree files", [Language.ZH]: "切换分支或恢复文件" },
        usage: "git checkout <branch>\ngit checkout -b <new-branch>\ngit checkout <commit>"
      },
      {
        name: "git switch",
        desc: { [Language.EN]: "Switch branches (newer alternative to checkout)", [Language.ZH]: "切换分支 (checkout 的现代替代)" },
        usage: "git switch <branch>\ngit switch -c <new-branch>"
      },
      {
        name: "git merge",
        desc: { [Language.EN]: "Join two or more development histories together", [Language.ZH]: "合并两个或多个开发历史" },
        usage: "git merge <branch>\ngit merge --abort"
      },
      {
        name: "git tag",
        desc: { [Language.EN]: "Create, list, delete or verify a tag object signed with GPG", [Language.ZH]: "创建、列出、删除或验证标签对象" },
        usage: "git tag <tagname>\ngit tag -d <tagname>\ngit tag -a <tag> -m 'msg'"
      },
      {
        name: "git stash",
        desc: { [Language.EN]: "Stash the changes in a dirty working directory away", [Language.ZH]: "将脏工作目录中的更改暂存起来" },
        usage: "git stash\ngit stash pop\ngit stash list\ngit stash apply"
      }
    ]
  },
  {
    category: { [Language.EN]: "Inspection & Comparison", [Language.ZH]: "检查与比较" },
    commands: [
      {
        name: "git log",
        desc: { [Language.EN]: "Show commit logs", [Language.ZH]: "显示提交日志" },
        usage: "git log\ngit log --oneline --graph --all\ngit log -p (show diffs)"
      },
      {
        name: "git diff",
        desc: { [Language.EN]: "Show changes between commits, commit and working tree, etc", [Language.ZH]: "显示提交之间、提交和工作树之间的更改" },
        usage: "git diff\ngit diff --staged\ngit diff <commit1> <commit2>"
      },
      {
        name: "git show",
        desc: { [Language.EN]: "Show various types of objects", [Language.ZH]: "显示各种类型的对象（如提交详情）" },
        usage: "git show <commit-id>\ngit show HEAD"
      },
      {
        name: "git shortlog",
        desc: { [Language.EN]: "Summarize 'git log' output", [Language.ZH]: "汇总 git log 输出" },
        usage: "git shortlog -sn"
      },
      {
        name: "git describe",
        desc: { [Language.EN]: "Give an object a human readable name based on an available anchor", [Language.ZH]: "基于可用的锚点为对象提供可读名称" },
        usage: "git describe --tags"
      }
    ]
  },
  {
    category: { [Language.EN]: "Sharing & Updating", [Language.ZH]: "共享与更新" },
    commands: [
      {
        name: "git fetch",
        desc: { [Language.EN]: "Download objects and refs from another repository", [Language.ZH]: "从另一个存储库下载对象和引用" },
        usage: "git fetch origin\ngit fetch --all"
      },
      {
        name: "git pull",
        desc: { [Language.EN]: "Fetch from and integrate with another repository or a local branch", [Language.ZH]: "获取并与另一个存储库或本地分支集成" },
        usage: "git pull origin <branch>\ngit pull --rebase"
      },
      {
        name: "git push",
        desc: { [Language.EN]: "Update remote refs along with associated objects", [Language.ZH]: "更新远程引用以及相关对象" },
        usage: "git push origin <branch>\ngit push -u origin <branch>\ngit push --force"
      },
      {
        name: "git submodule",
        desc: { [Language.EN]: "Initialize, update or inspect submodules", [Language.ZH]: "初始化、更新或检查子模块" },
        usage: "git submodule add <url>\ngit submodule update --init --recursive"
      },
      {
        name: "git worktree",
        desc: { [Language.EN]: "Manage multiple working trees", [Language.ZH]: "管理多个工作树" },
        usage: "git worktree add <path> <branch>\ngit worktree list"
      }
    ]
  },
  {
    category: { [Language.EN]: "Patching & Reverting", [Language.ZH]: "补丁与撤销" },
    commands: [
      {
        name: "git cherry-pick",
        desc: { [Language.EN]: "Apply the changes introduced by some existing commits", [Language.ZH]: "应用一些现有提交引入的更改" },
        usage: "git cherry-pick <commit-id>"
      },
      {
        name: "git rebase",
        desc: { [Language.EN]: "Reapply commits on top of another base tip", [Language.ZH]: "在另一个基端之上重新应用提交" },
        usage: "git rebase <branch>\ngit rebase -i <commit>"
      },
      {
        name: "git revert",
        desc: { [Language.EN]: "Revert some existing commits", [Language.ZH]: "撤销一些现有的提交（生成新提交）" },
        usage: "git revert <commit-id>"
      },
      {
        name: "git reset",
        desc: { [Language.EN]: "Reset current HEAD to the specified state", [Language.ZH]: "将当前 HEAD 重置为指定状态" },
        usage: "git reset --soft <commit>\ngit reset --hard <commit>\ngit reset <commit> (mixed)"
      }
    ]
  },
  {
    category: { [Language.EN]: "Debugging & Admin", [Language.ZH]: "调试与管理" },
    commands: [
      {
        name: "git bisect",
        desc: { [Language.EN]: "Use binary search to find the commit that introduced a bug", [Language.ZH]: "使用二分查找来查找引入 bug 的提交" },
        usage: "git bisect start\ngit bisect bad\ngit bisect good <commit>"
      },
      {
        name: "git blame",
        desc: { [Language.EN]: "Show what revision and author last modified each line of a file", [Language.ZH]: "显示每行代码的最后修改版本和作者" },
        usage: "git blame <file>"
      },
      {
        name: "git grep",
        desc: { [Language.EN]: "Print lines matching a pattern", [Language.ZH]: "打印匹配模式的行" },
        usage: "git grep 'text'"
      },
      {
        name: "git reflog",
        desc: { [Language.EN]: "Manage reflog information", [Language.ZH]: "管理引用日志信息（查看所有 HEAD 移动记录）" },
        usage: "git reflog"
      },
      {
        name: "git gc",
        desc: { [Language.EN]: "Cleanup unnecessary files and optimize the local repository", [Language.ZH]: "清理不必要的文件并优化本地存储库" },
        usage: "git gc"
      },
      {
        name: "git clean",
        desc: { [Language.EN]: "Remove untracked files from the working tree", [Language.ZH]: "从工作树中删除未跟踪的文件" },
        usage: "git clean -fd\ngit clean -n (dry run)"
      },
      {
        name: "git archive",
        desc: { [Language.EN]: "Create an archive of files from a named tree", [Language.ZH]: "从命名树创建文件归档" },
        usage: "git archive --format=zip HEAD > archive.zip"
      }
    ]
  }
];

export const UI_TEXT = {
  [Language.EN]: {
    title: 'GitViz AI',
    subtitle: 'Interactive Git Playground',
    commits: 'Commits',
    branches: 'Branches',
    scenarios: 'Scenarios',
    cheatSheet: 'Cheat Sheet',
    loading: 'Processing...',
    inputPlaceholder: 'Type a git command...',
    close: 'Close',
    load: 'Load Scenario'
  },
  [Language.ZH]: {
    title: 'GitViz AI',
    subtitle: '交互式 Git 演练场',
    commits: '提交',
    branches: '分支',
    scenarios: '练习场景',
    cheatSheet: '命令速查',
    loading: '执行中...',
    inputPlaceholder: '输入 git 命令...',
    close: '关闭',
    load: '加载场景'
  }
};