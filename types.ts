
export enum View {
  DASHBOARD = 'dashboard',
  SMART_STUDY = 'smart_study',
  PRACTICE = 'practice',
  PROGRESS = 'progress',
  PREFERENCES = 'preferences',
  PROFILE = 'profile',
  LUMA_LEARN = 'luma_learn'
}

export enum ProfileTab {
  ACCOUNT = 'account'
}

export interface VideoGenerationState {
  isGenerating: boolean;
  progress: string;
  videoUri: string | null;
  error: string | null;
}

// Global declaration for the AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}