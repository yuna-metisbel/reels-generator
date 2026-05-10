import { UserInput, GeneratedScript } from '@/types';

export async function generateScriptMock(input: UserInput): Promise<GeneratedScript> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const moodLabel: Record<string, string> = {
    funny: 'おもしろ',
    emotional: 'エモい',
    cool: 'かっこいい',
    dark: 'ダーク',
    cute: 'かわいい',
    serious: 'ガチ',
  };

  const mood = moodLabel[input.videoMood] || input.videoMood;

  return {
    title: `${input.theme.slice(0, 25)}…`,
    script15s: [
      `${input.theme}`,
      `→ ${input.message}`,
      `でも本音は…${input.innerVoice}`,
    ].join('\n'),
    script30s: [
      `${input.theme}`,
      ``,
      `伝えたいのは、`,
      `「${input.message}」`,
      ``,
      `でも本音を言うと…`,
      `${input.innerVoice}`,
      ``,
      `${input.targetAudience}に届け。`,
    ].join('\n'),
    screenTexts: [
      input.theme.slice(0, 25),
      input.message.slice(0, 25),
      `本音：${input.innerVoice.slice(0, 20)}`,
    ],
    caption: `${input.theme}\n${input.message}\n#${mood}な話`,
    hashtags: [
      `#${mood}`,
      '#内省',
      '#日常vlog',
      '#shorts',
      '#reels',
      '#tiktok',
      '#バズりたい',
    ],
  };
}
