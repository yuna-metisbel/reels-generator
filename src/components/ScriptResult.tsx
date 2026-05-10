'use client';

import { useState } from 'react';
import type { GeneratedScript } from '@/types';

interface Props {
  script: GeneratedScript;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="text-purple-400 hover:text-purple-300 active:text-purple-200 text-xs shrink-0 px-3 py-1.5 rounded-lg hover:bg-gray-700 active:bg-gray-600 transition-colors min-w-[52px]"
    >
      {copied ? '完了!' : 'コピー'}
    </button>
  );
}

export function ScriptResult({ script }: Props) {
  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-800 space-y-4 sm:space-y-5">
      <h2 className="text-lg sm:text-xl font-bold">生成結果</h2>

      <div>
        <h3 className="text-sm text-gray-400 mb-1">タイトル</h3>
        <p className="text-base sm:text-lg font-bold">{script.title}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm text-gray-400">15秒台本</h3>
          <CopyButton text={script.script15s} />
        </div>
        <pre className="bg-gray-800 p-3 sm:p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border border-gray-700 overflow-x-auto">
          {script.script15s}
        </pre>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm text-gray-400">30秒台本</h3>
          <CopyButton text={script.script30s} />
        </div>
        <pre className="bg-gray-800 p-3 sm:p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border border-gray-700 overflow-x-auto">
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
        <pre className="bg-gray-800 p-3 sm:p-4 rounded-lg whitespace-pre-wrap text-sm border border-gray-700 overflow-x-auto">
          {script.caption}
        </pre>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-gray-400">ハッシュタグ</h3>
          <CopyButton text={script.hashtags.join(' ')} />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {script.hashtags.map((tag, i) => (
            <span key={i} className="bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
