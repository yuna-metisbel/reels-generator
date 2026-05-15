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

  const hooks = [
    `これ、共感する人だけ見て。`,
    `最後まで見た人だけわかる。`,
    `正直に言っていい？`,
    `ずっと言えなかったこと。`,
    `1つだけ聞いて。`,
    `これ言語化できた人、天才。`,
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  const closings = [
    `同じ気持ちの人、🤍`,
    `わかる人にだけ届け。`,
    `保存しといて。いつか効くから。`,
    `これが本音。`,
    `共感したらコメントで教えて。`,
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  const themeShort = input.theme.length > 20 ? input.theme.slice(0, 20) + '…' : input.theme;
  const title = `${hook.slice(0, 15)}${themeShort}`;

  return {
    title,
    script15s: [hook, ``, input.theme, ``, closing].join('\n'),
    script30s: [
      hook,
      ``,
      input.theme,
      ``,
      `ずっと思ってたけど、`,
      `それでいいんだって気づいた。`,
      ``,
      closing,
    ].join('\n'),
    screenTexts: [hook, themeShort, `それでいい。`, closing],
    caption: [hook, ``, input.theme, ``, `#${mood} #内省 #本音`].join('\n'),
    hashtags: [
      `#${mood}`,
      '#本音',
      '#共感したらコメント',
      '#自分語り',
      '#shorts',
      '#reels',
      '#バズりたい',
      '#保存推奨',
    ],
  };
}
