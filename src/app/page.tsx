'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { InputForm } from '@/components/InputForm';
import { ScriptResult } from '@/components/ScriptResult';
import type { UserInput, GeneratedScript } from '@/types';

const VideoPreview = dynamic(
  () => import('@/components/VideoPreview').then(mod => mod.VideoPreview),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 h-[400px] animate-pulse" />
    ),
  }
);

export default function Home() {
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<15 | 30>(15);
  const [activeTab, setActiveTab] = useState<'script' | 'preview'>('script');
  const resultRef = useRef<HTMLDivElement>(null);

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
      setActiveTab('script');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh pb-8">
      <div className="max-w-lg lg:max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Reels Generator
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            短尺動画を自動生成
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          <div>
            <InputForm onSubmit={handleGenerate} loading={loading} />
          </div>

          <div ref={resultRef} className="space-y-4">
            {script ? (
              <>
                <div className="flex gap-1.5 bg-gray-900 p-1.5 rounded-xl border border-gray-800 lg:hidden">
                  <button
                    onClick={() => setActiveTab('script')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'script'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    台本・投稿文
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'preview'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    動画プレビュー
                  </button>
                </div>

                <div className={`${activeTab === 'script' ? 'block' : 'hidden lg:block'}`}>
                  <ScriptResult script={script} />
                </div>
                <div className={`${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                  <VideoPreview
                    title={script.title}
                    screenTexts={script.screenTexts}
                    duration={duration}
                    onDurationChange={setDuration}
                  />
                </div>
              </>
            ) : (
              <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl text-center text-gray-500">
                <p className="text-4xl mb-3">🎬</p>
                <p className="text-sm">
                  フォームに入力して
                  <br />
                  「AI台本を生成する」をタップ
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
