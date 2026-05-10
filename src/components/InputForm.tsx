'use client';

import { useState } from 'react';
import type { UserInput, VideoMood } from '@/types';

const moods: { value: VideoMood; label: string }[] = [
  { value: 'funny', label: '😂 おもしろ' },
  { value: 'emotional', label: '😢 エモい' },
  { value: 'cool', label: '😎 かっこいい' },
  { value: 'dark', label: '🖤 ダーク' },
  { value: 'cute', label: '🥺 かわいい' },
  { value: 'serious', label: '🔥 ガチ' },
];

interface Props {
  onSubmit: (input: UserInput) => void;
  loading: boolean;
}

export function InputForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<UserInput>({
    whatHappened: '',
    myReaction: '',
    actuallyScary: '',
    targetAudience: '',
    videoMood: 'funny',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = (field: keyof UserInput, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-gray-900 p-6 rounded-2xl border border-gray-800">
      <h2 className="text-xl font-bold">動画の内容を入力</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">今あったこと</label>
        <textarea
          value={form.whatHappened}
          onChange={e => update('whatHappened', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="例：コンビニで推しと同じ飲み物買ってた人がいた"
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">自分の反応</label>
        <textarea
          value={form.myReaction}
          onChange={e => update('myReaction', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="例：心の中で「仲間！」って叫んだ"
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">本当は怖かったこと</label>
        <textarea
          value={form.actuallyScary}
          onChange={e => update('actuallyScary', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="例：話しかけたかったけどコミュ障すぎて無理だった"
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">届けたい相手</label>
        <input
          type="text"
          value={form.targetAudience}
          onChange={e => update('targetAudience', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="例：同じ推しがいる人"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">動画の雰囲気</label>
        <div className="grid grid-cols-3 gap-2">
          {moods.map(mood => (
            <button
              key={mood.value}
              type="button"
              onClick={() => update('videoMood', mood.value)}
              className={`p-2.5 rounded-lg text-sm font-medium transition-all ${
                form.videoMood === mood.value
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-lg"
      >
        {loading ? '生成中...' : 'AI台本を生成する'}
      </button>
    </form>
  );
}
