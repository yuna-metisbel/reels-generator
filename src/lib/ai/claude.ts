import Anthropic from '@anthropic-ai/sdk';
import type { UserInput, GeneratedScript } from '@/types';

const client = new Anthropic();

const SYSTEM_PROMPT = `あなたはTikTok・Instagram Reelsのバズる台本を書くプロの構成作家です。

ユーザーの入力から、短尺動画用の台本を生成してください。

## バズる台本のルール
- 冒頭2秒で「止まる」フック（問いかけ、衝撃、共感）
- 1文は短く。15文字以内が理想
- 感情の起伏をつける（共感→本音→余韻）
- 最後に保存・コメントしたくなるクロージング
- 画面テキストは1枚あたり1フレーズ、最大15文字

## 出力形式
以下のJSONのみを返してください。説明文は不要です。

{
  "title": "動画タイトル（20文字以内）",
  "script15s": "15秒台本（フック→本題→クロージング）",
  "script30s": "30秒台本（フック→展開→本音→クロージング）",
  "screenTexts": ["画面1", "画面2", "画面3", "画面4", "画面5"],
  "caption": "投稿文（3行程度）",
  "hashtags": ["#タグ1", "#タグ2", "#タグ3", "#タグ4", "#タグ5", "#タグ6", "#タグ7", "#タグ8"]
}`;

export async function generateWithClaude(input: UserInput): Promise<GeneratedScript> {
  const moodLabel: Record<string, string> = {
    funny: 'おもしろい・笑える',
    emotional: 'エモい・感動',
    cool: 'かっこいい・スタイリッシュ',
    dark: 'ダーク・深い',
    cute: 'かわいい・ほっこり',
    serious: 'ガチ・真剣',
  };

  const userMessage = [
    `【テーマ】${input.theme}`,
    `【伝えたいこと】${input.message}`,
    `【本音】${input.innerVoice}`,
    `【届けたい相手】${input.targetAudience}`,
    `【雰囲気】${moodLabel[input.videoMood] || input.videoMood}`,
  ].join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AIからの応答を解析できませんでした');
  }

  return JSON.parse(jsonMatch[0]) as GeneratedScript;
}
