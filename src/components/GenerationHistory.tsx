'use client';

import { useState } from 'react';

interface Generation {
  id: string;
  input: {
    theme: string;
    videoMood: string;
  };
  result: {
    title: string;
    script15s: string;
    caption: string;
    hashtags: string[];
  };
  createdAt: string;
}

interface Props {
  generations: Generation[];
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
      className="text-purple-400 hover:text-purple-300 text-xs px-2 py-1 rounded-lg hover:bg-gray-700 transition-colors"
    >
      {copied ? '完了!' : 'コピー'}
    </button>
  );
}

export function GenerationHistory({ generations }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (generations.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl text-center text-gray-500">
        <p className="text-4xl mb-3">📝</p>
        <p className="text-sm">まだ生成履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {generations.map((gen) => {
        const isExpanded = expandedId === gen.id;
        const date = new Date(gen.createdAt).toLocaleDateString('ja-JP', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={gen.id}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : gen.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{gen.result.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{date}</p>
              </div>
              <span className="text-gray-500 text-sm ml-2">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs text-gray-400">台本（15秒）</h4>
                    <CopyButton text={gen.result.script15s} />
                  </div>
                  <pre className="bg-gray-800 p-3 rounded-lg whitespace-pre-wrap text-sm border border-gray-700">
                    {gen.result.script15s}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs text-gray-400">投稿文</h4>
                    <CopyButton text={gen.result.caption} />
                  </div>
                  <pre className="bg-gray-800 p-3 rounded-lg whitespace-pre-wrap text-sm border border-gray-700">
                    {gen.result.caption}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs text-gray-400">ハッシュタグ</h4>
                    <CopyButton text={gen.result.hashtags.join(' ')} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gen.result.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
