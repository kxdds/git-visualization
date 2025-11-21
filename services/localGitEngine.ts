import { GitState, SimulationResponse, Language, Commit, Branch } from "../types";
import { INITIAL_GIT_STATE } from "../constants";

// 辅助函数：生成简短的随机 ID (模拟 SHA-1)
const generateId = () => Math.random().toString(16).substring(2, 6);

/**
 * 解析引用 (Resolves a reference)
 * 将 git 引用字符串 (如 'main', 'HEAD~1', 'c1') 解析为具体的 Commit 对象
 */
const resolveRef = (state: GitState, ref: string): Commit | null => {
  if (!ref) return null;
  
  // 1. 尝试匹配精确的 Commit ID
  const byId = state.commits.find(c => c.id === ref);
  if (byId) return byId;

  // 2. 尝试匹配分支名
  const branch = state.branches.find(b => b.name === ref);
  if (branch) {
    return state.commits.find(c => c.id === branch.commitId) || null;
  }
  
  // 3. 尝试解析 HEAD~n 语法 (简单实现)
  if (ref.startsWith('HEAD')) {
      const parts = ref.split('~');
      const n = parts.length > 1 ? parseInt(parts[1]) : 0;
      
      let current: Commit | null = null;
      
      // 获取当前 HEAD 指向的 Commit
      if (state.HEAD.type === 'branch') {
          const b = state.branches.find(br => br.name === state.HEAD.ref);
          if (b) current = state.commits.find(c => c.id === b.commitId) || null;
      } else {
          current = state.commits.find(c => c.id === state.HEAD.ref) || null;
      }

      // 向上遍历父节点
      for (let i = 0; i < n; i++) {
          if (!current || !current.parentId) return null;
          current = state.commits.find(c => c.id === current.parentId) || null;
      }
      return current;
  }

  return null;
};

/**
 * 获取当前 HEAD 指向的 Commit 对象
 */
const getHeadCommit = (state: GitState): Commit | null => {
  if (state.HEAD.type === 'commit') {
    return state.commits.find(c => c.id === state.HEAD.ref) || null;
  } else {
    const branch = state.branches.find(b => b.name === state.HEAD.ref);
    if (!branch) return null;
    return state.commits.find(c => c.id === branch.commitId) || null;
  }
};

/**
 * 执行本地 Git 命令模拟
 * 这是一个纯 JS 实现的微型 Git 逻辑引擎，用于不依赖后端 API 模拟状态变化
 */
export const executeLocalCommand = async (
  currentState: GitState,
  commandStr: string,
  language: Language
): Promise<SimulationResponse> => {
  
  // 深拷贝状态以避免直接修改 (Immutability)
  const state: GitState = JSON.parse(JSON.stringify(currentState));
  // 确保 tags 和 remotes 数组存在 (兼容旧状态)
  if (!state.tags) state.tags = [];
  if (!state.remotes) state.remotes = [];
  
  const cmd = commandStr.trim();
  const parts = cmd.split(/\s+/);
  const mainCmd = parts[1]; // git <command>
  
  let explanation = "";
  let error: string | undefined = undefined;

  const isZh = language === Language.ZH;

  // --- 命令解析与执行逻辑 ---

  // 0. 非 GIT 命令 (touch)
  if (cmd.startsWith('touch ')) {
    const fileName = parts[1];
    if (!fileName) {
        error = isZh ? "请指定文件名" : "Please specify a filename";
    } else {
        if (!state.workingDirectory.includes(fileName)) {
            state.workingDirectory.push(fileName);
            explanation = isZh ? `已创建文件 "${fileName}"` : `Created file "${fileName}"`;
        } else {
            explanation = isZh ? `文件 "${fileName}" 已存在` : `File "${fileName}" already exists`;
        }
    }
    return { newState: state, explanation, error };
  }

  switch (mainCmd) {
    // --- Setup & Config ---
    case 'config':
        if (parts.includes('--global') || parts.includes('user.name') || parts.includes('user.email')) {
            explanation = isZh ? "配置已更新" : "Configuration updated";
        } else {
            explanation = "user.name=User\nuser.email=user@example.com";
        }
        break;

    case 'init':
        // 重置为初始状态
        state.commits = INITIAL_GIT_STATE.commits;
        state.branches = INITIAL_GIT_STATE.branches;
        state.tags = [];
        state.remotes = [];
        state.HEAD = INITIAL_GIT_STATE.HEAD;
        state.staging = { files: [] };
        state.workingDirectory = [];
        explanation = isZh ? `已在 .git/ 初始化空的 Git 仓库` : `Initialized empty Git repository in .git/`;
        break;

    case 'clone':
        const repoUrl = parts[2] || 'https://github.com/project/repo.git';
        state.commits = [{ id: 'c1', message: 'Initial commit', parentId: null, timestamp: 1, lane: 0 }];
        state.branches = [{ name: 'main', commitId: 'c1' }, { name: 'origin/main', commitId: 'c1', isRemote: true }];
        state.tags = [];
        state.remotes = [{ name: 'origin', url: repoUrl }];
        state.HEAD = { type: 'branch', ref: 'main' };
        state.staging = { files: [] };
        state.workingDirectory = [];
        explanation = isZh 
           ? `已克隆 ${repoUrl} 到本地` 
           : `Cloning into 'repo'...\nRemote: Enumerating objects: 3, done.\nReceiving objects: 100% (3/3), done.`;
        break;

    // --- Snapshotting ---
    case 'add':
        const addArg = parts[2];
        if (addArg === '.' || addArg === '-A') {
           const count = state.workingDirectory.length;
           state.staging.files = [...new Set([...state.staging.files, ...state.workingDirectory])];
           state.workingDirectory = [];
           explanation = isZh ? `已暂存 ${count} 个文件` : `Staged ${count} files`;
        } else if (addArg) {
           const idx = state.workingDirectory.indexOf(addArg);
           if (idx !== -1) {
               state.workingDirectory.splice(idx, 1);
               state.staging.files.push(addArg);
               explanation = isZh ? `已暂存文件 "${addArg}"` : `Staged file "${addArg}"`;
           } else if (state.staging.files.includes(addArg)) {
               explanation = isZh ? "文件已在暂存区" : "File already staged";
           } else {
               error = isZh ? "未找到文件" : "File not found in working directory";
           }
        } else {
           error = isZh ? "请指定要暂存的文件" : "Please specify file to stage";
        }
        break;

    case 'status':
        const branchName = state.HEAD.type === 'branch' ? state.HEAD.ref : 'Detached HEAD';
        const staged = state.staging.files.length;
        const modified = state.workingDirectory.length;
        explanation = isZh 
          ? `位于分支 ${branchName}\n暂存区: ${staged} 个文件\n工作区: ${modified} 个文件`
          : `On branch ${branchName}\nStaged: ${staged} files\nChanges: ${modified} files`;
        break;

    case 'commit':
        if (state.staging.files.length === 0 && !cmd.includes('--allow-empty') && !cmd.includes('--amend')) {
            error = isZh ? "暂存区为空，无法提交" : "nothing to commit, working tree clean";
        } else {
            const msgMatch = cmd.match(/-m\s+["'](.+)["']/);
            const message = msgMatch ? msgMatch[1] : "Update";
            const newId = generateId();
            const headCommit = getHeadCommit(state);
            
            let newLane = 0;
            if (headCommit) {
               const siblings = state.commits.filter(c => c.parentId === headCommit.id);
               if (siblings.length === 0) {
                   newLane = headCommit.lane || 0;
               } else {
                   const maxLane = Math.max(...state.commits.map(c => c.lane || 0));
                   newLane = maxLane + 1;
               }
            }

            const newCommit: Commit = {
                id: newId,
                message,
                parentId: headCommit ? headCommit.id : null,
                timestamp: Date.now(),
                lane: newLane
            };

            state.commits.push(newCommit);
            state.staging.files = [];

            if (state.HEAD.type === 'branch') {
                const branch = state.branches.find(b => b.name === state.HEAD.ref);
                if (branch) branch.commitId = newId;
            } else {
                state.HEAD.ref = newId;
            }
            explanation = isZh ? `[${newId}] ${message}` : `[${newId}] ${message}`;
        }
        break;
    
    case 'restore':
        const restoreFile = parts[parts.length - 1];
        if (parts.includes('--staged')) {
            // Unstage
            const sIdx = state.staging.files.indexOf(restoreFile);
            if (sIdx !== -1) {
                state.staging.files.splice(sIdx, 1);
                state.workingDirectory.push(restoreFile);
                explanation = isZh ? `已取消暂存 "${restoreFile}"` : `Unstaged "${restoreFile}"`;
            } else {
                error = isZh ? "文件未暂存" : "File not staged";
            }
        } else {
            // Discard changes
            const wIdx = state.workingDirectory.indexOf(restoreFile);
            if (wIdx !== -1) {
                state.workingDirectory.splice(wIdx, 1);
                explanation = isZh ? `已丢弃 "${restoreFile}" 的更改` : `Discarded changes in "${restoreFile}"`;
            } else {
                error = isZh ? "没有可恢复的更改" : "No changes to restore";
            }
        }
        break;

    case 'rm':
        const rmFile = parts[parts.length - 1];
        const rmWIdx = state.workingDirectory.indexOf(rmFile);
        if (rmWIdx !== -1) {
            state.workingDirectory.splice(rmWIdx, 1);
            state.staging.files.push(`deleted: ${rmFile}`);
            explanation = isZh ? `已删除 "${rmFile}"` : `rm '${rmFile}'`;
        } else {
            // Simplified: assume file exists in repo if not in working dir
            state.staging.files.push(`deleted: ${rmFile}`);
            explanation = isZh ? `已删除 "${rmFile}"` : `rm '${rmFile}'`;
        }
        break;

    case 'mv':
        const oldName = parts[2];
        const newName = parts[3];
        if (oldName && newName) {
            const mvIdx = state.workingDirectory.indexOf(oldName);
            if (mvIdx !== -1) {
                state.workingDirectory.splice(mvIdx, 1);
                state.workingDirectory.push(newName);
                explanation = isZh ? `已重命名 ${oldName} -> ${newName}` : `renamed ${oldName} -> ${newName}`;
            } else {
                // Simulate staging move
                state.staging.files.push(`renamed: ${oldName} -> ${newName}`);
                explanation = isZh ? `已重命名 ${oldName} -> ${newName}` : `renamed ${oldName} -> ${newName}`;
            }
        } else {
            error = "Usage: git mv <old> <new>";
        }
        break;

    // --- Branching & Merging ---
    case 'branch':
        if (parts.includes('-d') || parts.includes('-D')) {
            const bName = parts[parts.length - 1];
            const bIdx = state.branches.findIndex(b => b.name === bName);
            if (bIdx !== -1) {
                if (state.HEAD.type === 'branch' && state.HEAD.ref === bName) {
                    error = isZh ? `无法删除当前检出的分支` : `Cannot delete checked out branch`;
                } else {
                    state.branches.splice(bIdx, 1);
                    explanation = isZh ? `已删除分支 ${bName}` : `Deleted branch ${bName}`;
                }
            } else {
                error = isZh ? `分支 "${bName}" 不存在` : `Branch "${bName}" not found`;
            }
        } else if (parts.length === 2) {
            explanation = state.branches.map(b => (b.name === state.HEAD.ref ? '*' : ' ') + ' ' + b.name).join('\n');
        } else {
            const bName = parts[2];
            if (state.branches.find(b => b.name === bName)) {
                error = isZh ? `分支 "${bName}" 已存在` : `Branch "${bName}" already exists`;
            } else {
                const headC = getHeadCommit(state);
                if (headC) {
                    state.branches.push({ name: bName, commitId: headC.id });
                    explanation = isZh ? `已创建分支 ${bName}` : `Created branch ${bName}`;
                }
            }
        }
        break;

    case 'checkout':
    case 'switch':
        const isNewB = parts.includes('-b') || parts.includes('-c');
        const targetRef = parts[parts.length - 1];
        if (isNewB) {
             const headC = getHeadCommit(state);
             if (state.branches.find(b => b.name === targetRef)) {
                 error = isZh ? "分支已存在" : "Branch already exists";
             } else if (headC) {
                 state.branches.push({ name: targetRef, commitId: headC.id });
                 state.HEAD = { type: 'branch', ref: targetRef };
                 explanation = isZh ? `切换到新分支 '${targetRef}'` : `Switched to a new branch '${targetRef}'`;
             }
        } else {
            const branch = state.branches.find(b => b.name === targetRef);
            if (branch) {
                state.HEAD = { type: 'branch', ref: targetRef };
                explanation = isZh ? `切换到分支 '${targetRef}'` : `Switched to branch '${targetRef}'`;
            } else {
                const commit = state.commits.find(c => c.id === targetRef);
                if (commit) {
                    state.HEAD = { type: 'commit', ref: targetRef };
                    explanation = isZh ? `HEAD 目前位于 ${targetRef}` : `HEAD is now at ${targetRef}`;
                } else {
                    error = isZh ? "未找到引用" : "pathspec not found";
                }
            }
        }
        break;

    case 'merge':
        const mTarget = parts[2];
        const mBranch = state.branches.find(b => b.name === mTarget);
        if (!mBranch) {
            error = isZh ? `分支 "${mTarget}" 不存在` : `Branch "${mTarget}" not found`;
        } else {
            const headC = getHeadCommit(state);
            const targetC = state.commits.find(c => c.id === mBranch.commitId);
            if (headC && targetC) {
                if (headC.id === targetC.id) {
                    explanation = isZh ? "已经是最新。" : "Already up to date.";
                } else {
                    // Merge commit
                    const newId = generateId();
                    const newCommit: Commit = {
                        id: newId,
                        message: `Merge branch '${mTarget}'`,
                        parentId: headC.id,
                        parentIds: [headC.id, targetC.id],
                        timestamp: Date.now(),
                        lane: headC.lane
                    };
                    state.commits.push(newCommit);
                    if (state.HEAD.type === 'branch') {
                        const curB = state.branches.find(b => b.name === state.HEAD.ref);
                        if (curB) curB.commitId = newId;
                    } else {
                        state.HEAD.ref = newId;
                    }
                    explanation = isZh ? "Merge 完成" : "Merge made by the 'ort' strategy.";
                }
            }
        }
        break;

    case 'tag':
        if (parts.includes('-d')) {
            const tName = parts[parts.length - 1];
            const tIdx = state.tags.findIndex(t => t.name === tName);
            if (tIdx !== -1) {
                state.tags.splice(tIdx, 1);
                explanation = isZh ? `已删除标签 '${tName}'` : `Deleted tag '${tName}'`;
            } else { error = "Tag not found"; }
        } else if (parts.length === 2) {
            explanation = state.tags.length === 0 ? (isZh ? "无标签" : "No tags") : state.tags.map(t => t.name).join('\n');
        } else {
            const tName = parts[2];
            const headC = getHeadCommit(state);
            if (headC) {
                state.tags.push({ name: tName, commitId: headC.id });
                explanation = isZh ? `已打标签 ${tName}` : `Created tag ${tName}`;
            }
        }
        break;
    
    case 'stash':
        if (state.workingDirectory.length > 0 || state.staging.files.length > 0) {
            state.workingDirectory = [];
            state.staging.files = [];
            explanation = isZh ? "保存工作目录和索引状态 WIP on main" : "Saved working directory and index state WIP on main";
        } else {
            explanation = isZh ? "没有要保存的本地更改" : "No local changes to save";
        }
        break;

    // --- Inspection ---
    case 'log':
    case 'shortlog':
    case 'reflog':
        const headC = getHeadCommit(state);
        if (!headC) {
             explanation = "No history.";
        } else {
             let logOutput = "";
             let current: Commit | null = headC;
             let count = 0;
             while (current && count < 8) {
                 const msg = mainCmd === 'shortlog' ? current.message : `${current.id.substring(0,6)} - ${current.message}`;
                 logOutput += `* ${msg}\n`;
                 current = current.parentId ? (state.commits.find(c => c.id === current!.parentId) || null) : null;
                 count++;
             }
             explanation = logOutput;
        }
        break;
    
    case 'show':
        const showRef = parts[2] || 'HEAD';
        const showC = resolveRef(state, showRef);
        if (showC) {
            explanation = `commit ${showC.id}\nAuthor: User <user@example.com>\nDate:   ${new Date(showC.timestamp).toDateString()}\n\n    ${showC.message}\n\nDiff: ...`;
        } else {
            error = "Commit not found";
        }
        break;
    
    case 'diff':
        if (state.workingDirectory.length > 0) {
             explanation = `diff --git a/${state.workingDirectory[0]} b/${state.workingDirectory[0]}\nindex 834..921 100644\n+++ b/${state.workingDirectory[0]}\n@@ -1 +1 @@\n+new content`;
        } else {
             explanation = "";
        }
        break;
    
    case 'blame':
        const blameFile = parts[2];
        explanation = `${generateId().substring(0,6)} (User 2023-10-26) 1) import React from 'react';\n${generateId().substring(0,6)} (User 2023-10-26) 2) ...`;
        break;
    
    case 'grep':
        explanation = `src/App.tsx:10: const App = () => {`;
        break;
    
    case 'describe':
        explanation = "v1.0-3-g4a1b2c";
        break;

    // --- Sharing ---
    case 'fetch':
        explanation = isZh ? "来自 https://github.com/repo" : "From https://github.com/repo";
        break;
    
    case 'pull':
        explanation = isZh ? "已更新 (Fast-forward)" : "Already up to date.";
        break;

    case 'push':
        explanation = isZh ? "To https://github.com/repo\n   d3b2..98a1  main -> main" : "To https://github.com/repo\n   d3b2..98a1  main -> main";
        break;

    case 'remote':
        if (parts.length === 2 && parts[1] === '-v') {
             explanation = state.remotes.length === 0 ? "" : state.remotes.map(r => `${r.name}\t${r.url} (fetch)\n${r.name}\t${r.url} (push)`).join('\n');
        } else if (parts[1] === 'add') {
             const rName = parts[2];
             const rUrl = parts[3];
             if (rName && rUrl) {
                 state.remotes.push({ name: rName, url: rUrl });
                 explanation = "";
             } else { error = "Usage: git remote add <name> <url>"; }
        } else {
             explanation = state.remotes.map(r => r.name).join('\n');
        }
        break;
    
    case 'submodule':
        explanation = "No submodules found.";
        break;
    
    case 'worktree':
        explanation = "/path/to/repo  (main)";
        break;

    // --- Patching ---
    case 'cherry-pick':
        const cpRef = parts[2];
        const cpCommit = resolveRef(state, cpRef);
        if (cpCommit) {
             const headC = getHeadCommit(state);
             if (headC) {
                 const newId = generateId();
                 const newCommit: Commit = {
                     id: newId,
                     message: cpCommit.message, // Copy message
                     parentId: headC.id,
                     timestamp: Date.now(),
                     lane: headC.lane
                 };
                 state.commits.push(newCommit);
                 if (state.HEAD.type === 'branch') {
                     const b = state.branches.find(br => br.name === state.HEAD.ref);
                     if (b) b.commitId = newId;
                 } else {
                     state.HEAD.ref = newId;
                 }
                 explanation = isZh ? `Cherry-pick ${cpCommit.id.substring(0,6)} 完成` : `Cherry-pick ${cpCommit.id.substring(0,6)} complete`;
             }
        } else { error = "Commit not found"; }
        break;
    
    case 'rebase':
        const rbTarget = parts[2];
        const rbBranch = state.branches.find(b => b.name === rbTarget);
        if (rbBranch) {
             const headC = getHeadCommit(state);
             if (headC) {
                 const newId = generateId();
                 const newCommit: Commit = {
                     ...headC,
                     id: newId,
                     parentId: rbBranch.commitId,
                     message: headC.message + " (rebased)",
                     timestamp: Date.now()
                 };
                 state.commits.push(newCommit);
                 if (state.HEAD.type === 'branch') {
                     const b = state.branches.find(br => br.name === state.HEAD.ref);
                     if (b) b.commitId = newId;
                 }
                 explanation = isZh ? "变基完成 (模拟)" : "Successfully rebased (Simulated)";
             }
        } else { error = "Target branch not found"; }
        break;

    case 'revert':
        const rvRef = parts[2];
        const rvCommit = resolveRef(state, rvRef);
        if (rvCommit) {
             const headC = getHeadCommit(state);
             if (headC) {
                 const newId = generateId();
                 const newCommit: Commit = {
                     id: newId,
                     message: `Revert "${rvCommit.message}"`,
                     parentId: headC.id,
                     timestamp: Date.now(),
                     lane: headC.lane
                 };
                 state.commits.push(newCommit);
                 if (state.HEAD.type === 'branch') {
                     const b = state.branches.find(br => br.name === state.HEAD.ref);
                     if (b) b.commitId = newId;
                 } else { state.HEAD.ref = newId; }
                 explanation = isZh ? `已撤销 ${rvCommit.id.substring(0,6)}` : `Reverted ${rvCommit.id.substring(0,6)}`;
             }
        } else { error = "Commit not found"; }
        break;

    case 'reset':
        const rsMode = parts.includes('--hard') ? 'hard' : (parts.includes('--soft') ? 'soft' : 'mixed');
        const rsRef = parts[parts.length - 1];
        const rsCommit = resolveRef(state, rsRef);
        if (rsCommit) {
            if (state.HEAD.type === 'branch') {
                const b = state.branches.find(br => br.name === state.HEAD.ref);
                if (b) b.commitId = rsCommit.id;
            } else { state.HEAD.ref = rsCommit.id; }
            
            if (rsMode === 'hard') {
                state.staging.files = [];
                state.workingDirectory = [];
            }
            explanation = isZh ? `重置到 ${rsCommit.id.substring(0,6)}` : `HEAD is now at ${rsCommit.id.substring(0,6)}`;
        } else { error = "Invalid reference"; }
        break;

    // --- Debugging ---
    case 'bisect':
        explanation = "Bisecting: 0 revisions left to test after this (roughly 0 steps)";
        break;
    
    case 'gc':
        explanation = "Enumerating objects: 10, done.\nCounting objects: 100% (10/10), done.\nWriting objects: 100% (10/10), done.";
        break;
    
    case 'archive':
        explanation = "Generated archive.zip";
        break;
    
    case 'clean':
        state.workingDirectory = [];
        explanation = isZh ? "移除未跟踪的文件" : "Removed untracked files";
        break;

    default:
        error = isZh ? `未知的命令: ${cmd}` : `Unknown command: ${cmd}`;
  }

  return {
    newState: state,
    explanation: explanation || "Done",
    error
  };
};