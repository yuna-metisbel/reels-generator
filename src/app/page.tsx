'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { InputForm } from '@/components/InputForm';
import { ScriptResult } from '@/components/ScriptResult';
import type { UserInput, GeneratedScript } from '@/types';

const VideoPreview = dynamic(
  () => import('@/components/VideoPreview').then(mod => mod.VideoPreview),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 h-[600px] animate-pulse" />
    ),
  }
);

export default function Home() {
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<15 | 30>(15);

  const handleGenerate = async (input: UserInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScript(data);
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Reels Generator
          </h1>
          <p className="text-gray-400 mt-2">
            TikTok / Instagram Reels 用の短尺動画を自動生成
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <InputForm onSubmit={handleGenerate} loading={loading} />
          </div>

          <div className="space-y-8">
            {script ? (
              <>
                <ScriptResult script={script} />
                <VideoPreview
                  title={script.title}
                  screenTexts={script.screenTexts}
                  duration={duration}
                  onDurationChange={setDuration}
                />
              </>
            ) : (
              <div className="bg-gray-900 border border-gray-800 p-12 rounded-2xl text-center text-gray-500">
                <p className="text-5xl mb-4">🎬</p>
                <p className="text-lg">
                  左のフォームに入力して
                  <br />
                  「AI台本を生成する」をクリック
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
