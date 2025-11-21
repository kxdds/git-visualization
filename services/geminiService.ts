import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GitState, SimulationResponse, Language } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const gitStateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    commits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          message: { type: Type.STRING },
          parentId: { type: Type.STRING, nullable: true },
          parentIds: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
          timestamp: { type: Type.NUMBER },
          lane: { type: Type.INTEGER, description: "Visual lane index (0 for main, 1, 2... for side branches)" }
        },
        required: ["id", "message", "timestamp"]
      }
    },
    branches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          commitId: { type: Type.STRING },
          isRemote: { type: Type.BOOLEAN, nullable: true }
        },
        required: ["name", "commitId"]
      }
    },
    HEAD: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ["branch", "commit"] },
        ref: { type: Type.STRING }
      },
      required: ["type", "ref"]
    },
    staging: {
      type: Type.OBJECT,
      properties: {
        files: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["files"]
    },
    workingDirectory: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["commits", "branches", "HEAD", "staging"]
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    newState: gitStateSchema,
    explanation: { type: Type.STRING, description: "A concise explanation of what changed in the git state based on the command. Start with 'CONFLICT:' or 'WARNING:' if issues arise." },
    error: { type: Type.STRING, nullable: true, description: "Return an error message if the git command is invalid or impossible in the current state." }
  },
  required: ["newState", "explanation"]
};

export const simulateGitCommand = async (
  currentState: GitState,
  command: string,
  language: Language
): Promise<SimulationResponse> => {
  try {
    const model = "gemini-2.5-flash";
    
    const prompt = `
      You are a Git Logic Engine Simulator.
      Current Language: ${language === Language.ZH ? 'Chinese (Simplified)' : 'English'}.
      
      I will provide the CURRENT Git State (JSON) and a User Command.
      Your task is to simulate the execution of this command and return the NEW Git State (JSON) and a helpful explanation.
      
      Rules:
      1. Logic: Strictly follow Git internal logic (DAG structure, refs, HEAD movement).
      2. IDs: Generate short, unique hex-like IDs for new commits (e.g., 'c4', 'a1b2').
      3. Visualization Aid: Update 'lane' property in commits. 'main'/'master' usually stays on lane 0. New branches diverge to lane 1, 2, etc. Merges bring lanes back together visually.
      4. Errors: If the command is invalid (e.g., checkout non-existent branch), return the SAME state but populate the 'error' field with a message.
      5. Explanation: Explain concepts like "HEAD moved", "Branch pointer updated", "Merge commit created" in the requested language.
      6. Formatting: Return pure JSON matching the schema.
      
      7. STRICT COMMIT VALIDATION:
         - If command is 'git commit' (and no --allow-empty flag):
         - Check 'staging.files'. 
         - If 'staging.files' is EMPTY, DO NOT create a commit. Return 'error': "nothing to commit, working tree clean" (or "no changes added to commit").
         - If 'staging.files' HAS items, create the commit and CLEAR 'staging.files'.

      8. FILE OPERATIONS:
         - 'touch [file]': Add [file] to 'workingDirectory'.
         - 'git add [file]' or 'git add .': Move matching items from 'workingDirectory' to 'staging.files'.
         - 'rm [file]': Remove from workingDirectory.
      
      9. REMOTE COMMANDS:
         - 'git clone [url]': Reset state to a standard initialized repo with a remote 'origin'.
         - 'git push': If current branch tracks a remote (or simple simulation), update/create the remote branch (e.g., 'origin/main').
         - 'git pull': Simulate 'git fetch' + 'git merge'.
         - 'git fetch': Update remote tracking branches (e.g., 'origin/main') but do not move HEAD.
         
      10. REMOTE BRANCHES:
         - If a branch name starts with 'origin/' (e.g., 'origin/main'), EXPLICITLY set its 'isRemote' property to true.
         - Local branches (e.g., 'main', 'feature') should have 'isRemote' as false or undefined.
         
      11. CONFLICT DETECTION & WARNINGS:
         - If a merge, rebase, cherry-pick, or pull would logically cause a conflict (e.g., divergent histories modifying same files, or based on your knowledge of common git conflicts), assume a simple conflict resolution strategy for the simulation OR allow the merge but mark it with a warning.
         - **CRITICAL**: If there is a potential conflict or risky operation (like overwriting uncommitted changes), start the 'explanation' field with "CONFLICT:" or "WARNING:".
         - For example: "CONFLICT: Automatic merge failed. Fix conflicts and then commit the result."

      Current State:
      ${JSON.stringify(currentState)}

      User Command:
      "${command}"
    `;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a helpful Git expert teaching students. Warn them about conflicts."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as SimulationResponse;
    return result;

  } catch (e) {
    console.error("Gemini API Error:", e);
    return {
      newState: currentState,
      explanation: "",
      error: "Failed to simulate command. Please try again or check your API Key."
    };
  }
};