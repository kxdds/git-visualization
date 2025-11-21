// This service is deprecated and has been replaced by localGitEngine.ts
// It is kept here as a placeholder to avoid build errors during transition.

import { GitState, SimulationResponse, Language } from "../types";

export const simulateGitCommand = async (
  currentState: GitState,
  command: string,
  language: Language
): Promise<SimulationResponse> => {
  return {
      newState: currentState,
      explanation: "Service Deprecated. Use local execution.",
      error: "Service Deprecated"
  };
};
