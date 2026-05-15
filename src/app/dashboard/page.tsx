'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GenerationHistory } from '@/components/GenerationHistory';
import { UsageBar } from '@/components/UsageBar';

interface DashboardData {
  generations: Array<{
    id: string;
    input: { theme: string; videoMood: string };
    result: { title: string; script15s: string; caption: string; hashtags: string[] };
    createdAt: string;
  }>;
  usage: {
    current: number;
    limit: number;
    plan: string;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/generations')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-dvh pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold">生成履歴</h1>
          <Link
            href="/"
            className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            新規生成
          </Link>
        </div>

        {data && (
          <div className="space-y-4">
            <UsageBar
              current={data.usage.current}
              limit={data.usage.limit}
              plan={data.usage.plan}
            />

            {data.usage.plan === 'free' && (
              <Link
                href="/pricing"
                className="block text-center text-sm text-purple-400 hover:text-purple-300 bg-purple-900/20 border border-purple-800/30 rounded-xl py-2.5 transition-colors"
              >
                Proプランで無制限に生成する →
              </Link>
            )}

            <GenerationHistory generations={data.generations} />
          </div>
        )}
      </div>
    </main>
  );
}
