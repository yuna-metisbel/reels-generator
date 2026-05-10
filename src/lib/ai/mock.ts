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
    title: `${input.whatHappened.slice(0, 25)}…`,
    script15s: [
      `${input.whatHappened}`,
      `→ ${input.myReaction}`,
      `でも実は…${input.actuallyScary}`,
    ].join('\n'),
    script30s: [
      `さっきね、${input.whatHappened}`,
      ``,
      `その時の私の反応：`,
      `「${input.myReaction}」`,
      ``,
      `でも本当は…`,
      `${input.actuallyScary}`,
      ``,
      `${input.targetAudience}に届け！`,
    ].join('\n'),
    screenTexts: [
      input.whatHappened.slice(0, 25),
      input.myReaction.slice(0, 25),
      `実は…${input.actuallyScary.slice(0, 20)}`,
    ],
    caption: `${input.whatHappened}\n${input.myReaction}\n#${mood}な話`,
    hashtags: [
      `#${mood}`,
      '#あるある',
      '#日常vlog',
      '#shorts',
      '#reels',
      '#tiktok',
      '#バズりたい',
    ],
  };
}
