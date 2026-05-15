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
    theme: '',
    videoMood: 'emotional',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-800">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">何について話す？</label>
        <textarea
          value={form.theme}
          onChange={e => setForm(prev => ({ ...prev, theme: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3.5 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="最近自分の弱さを認められた。完璧じゃなくていいって伝えたい"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">雰囲気</label>
        <div className="grid grid-cols-3 gap-1.5">
          {moods.map(mood => (
            <button
              key={mood.value}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, videoMood: mood.value }))}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                form.videoMood === mood.value
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900'
                  : 'bg-gray-800 text-gray-400 active:bg-gray-600 border border-gray-700'
              }`}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !form.theme.trim()}
        className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            生成中…
          </span>
        ) : (
          'AI台本を生成する'
        )}
      </button>
    </form>
  );
}
