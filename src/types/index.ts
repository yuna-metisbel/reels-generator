export type VideoMood = 'funny' | 'emotional' | 'cool' | 'dark' | 'cute' | 'serious';

export interface UserInput {
  theme: string;
  videoMood: VideoMood;
}

export interface GeneratedScript {
  title: string;
  script15s: string;
  script30s: string;
  screenTexts: string[];
  caption: string;
  hashtags: string[];
}

export interface ShortVideoProps {
  title: string;
  screenTexts: string[];
  durationInSeconds: number;
}

export interface GenerationRecord {
  id: string;
  input: UserInput;
  result: GeneratedScript;
  isFavorite: boolean;
  createdAt: string;
}
