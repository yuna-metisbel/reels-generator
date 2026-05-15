'use client';

import { useState, useRef } from 'react';
import { useAuth, SignUpButton } from '@clerk/nextjs';
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

function LandingHero() {
  return (
    <div className="text-center py-16 sm:py-24 px-4">
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
        AIでリール台本を
        <br />
        <span className="text-purple-400">秒速で生成</span>
      </h1>
      <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-md mx-auto">
        テーマと伝えたいことを入力するだけ。
        <br />
        15秒・30秒の台本、投稿文、ハッシュタグを自動生成。
      </p>
      <SignUpButton mode="modal">
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors">
          無料で台本を作る
        </button>
      </SignUpButton>
      <p className="text-gray-500 text-sm mt-3">
        無料プラン: 月5回まで生成可能
      </p>
    </div>
  );
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<15 | 30>(15);
  const [activeTab, setActiveTab] = useState<'script' | 'preview'>('script');
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (input: UserInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setScript(data);
      setActiveTab('script');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError('生成に失敗しました。もう一度お試しください。');
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen min-h-dvh">
        <LandingHero />
      </main>
    );
  }

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

        {error && (
          <div className="max-w-lg mx-auto mb-4 bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

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
