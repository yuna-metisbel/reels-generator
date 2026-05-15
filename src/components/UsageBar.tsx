'use client';

interface Props {
  current: number;
  limit: number;
  plan: string;
}

export function UsageBar({ current, limit, plan }: Props) {
  if (plan === 'pro') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-400">今月の生成回数</span>
        <span className="text-sm font-bold text-purple-400">{current} 回（無制限）</span>
      </div>
    );
  }

  const percentage = Math.min((current / limit) * 100, 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">今月の生成回数</span>
        <span className="text-sm font-bold">
          {current} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage >= 100 ? 'bg-red-500' : 'bg-purple-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
