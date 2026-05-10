export type VideoMood = 'funny' | 'emotional' | 'cool' | 'dark' | 'cute' | 'serious';

export interface UserInput {
  theme: string;
  message: string;
  innerVoice: string;
  targetAudience: string;
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
