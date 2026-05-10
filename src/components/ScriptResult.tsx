'use client';

import type { GeneratedScript } from '@/types';

interface Props {
  script: GeneratedScript;
}

function CopyButton({ text }: { text: string }) {
  const copy = () => navigator.clipboard.writeText(text);
  return (
    <button
      onClick={copy}
      className="text-purple-400 hover:text-purple-300 text-xs shrink-0 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
    >
      コピー
    </button>
  );
}

export function ScriptResult({ script }: Props) {
  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-5">
      <h2 className="text-xl font-bold">生成結果</h2>

      <div>
        <h3 className="text-sm text-gray-400 mb-1">タイトル</h3>
        <p className="text-lg font-bold">{script.title}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm text-gray-400">15秒台本</h3>
          <CopyButton text={script.script15s} />
        </div>
        <pre className="bg-gray-800 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border border-gray-700">
          {script.script15s}
        </pre>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm text-gray-400">30秒台本</h3>
          <CopyButton text={script.script30s} />
        </div>
        <pre className="bg-gray-800 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border border-gray-700">
          {script.script30s}
        </pre>
      </div>

      <div>
        <h3 className="text-sm text-gray-400 mb-2">画面テキスト</h3>
        <div className="flex flex-wrap gap-2">
          {script.screenTexts.map((text, i) => (
            <span key={i} className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full text-sm">
              {text}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm text-gray-400">投稿文</h3>
          <CopyButton text={script.caption} />
        </div>
        <pre className="bg-gray-800 p-4 rounded-lg whitespace-pre-wrap text-sm border border-gray-700">
          {script.caption}
        </pre>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-gray-400">ハッシュタグ</h3>
          <CopyButton text={script.hashtags.join(' ')} />
        </div>
        <div className="flex flex-wrap gap-2">
          {script.hashtags.map((tag, i) => (
            <span key={i} className="bg-purple-900/40 text-purple-300 border border-purple-800/50 px-3 py-1.5 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
