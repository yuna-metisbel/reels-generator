'use client';

import { Player } from '@remotion/player';
import { ShortVideo } from '@/remotion/ShortVideo';
import { useState } from 'react';

interface Props {
  title: string;
  screenTexts: string[];
  duration: 15 | 30;
  onDurationChange: (d: 15 | 30) => void;
}

const FPS = 30;

export function VideoPreview({ title, screenTexts, duration, onDurationChange }: Props) {
  const [rendering, setRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRender = async () => {
    setRendering(true);
    setDownloadUrl(null);
    setError(null);
    try {
      const res = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, screenTexts, duration }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDownloadUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レンダリングに失敗しました');
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-4">
      <h2 className="text-xl font-bold">プレビュー</h2>

      <div className="flex gap-2">
        {([15, 30] as const).map(d => (
          <button
            key={d}
            onClick={() => onDurationChange(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              duration === d
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
            }`}
          >
            {d}秒
          </button>
        ))}
      </div>

      <div className="flex justify-center bg-gray-800 rounded-xl p-4">
        <div style={{ width: 270, height: 480 }}>
          <Player
            component={ShortVideo}
            inputProps={{ title, screenTexts, durationInSeconds: duration }}
            durationInFrames={duration * FPS}
            fps={FPS}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{ width: '100%', height: '100%', borderRadius: 12 }}
            controls
            autoPlay
            loop
          />
        </div>
      </div>

      <button
        onClick={handleRender}
        disabled={rendering}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
      >
        {rendering ? 'レンダリング中...(数十秒かかります)' : 'MP4をダウンロード'}
      </button>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="block text-center text-green-400 hover:text-green-300 underline py-2"
        >
          ダウンロード準備完了 - クリックして保存
        </a>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
