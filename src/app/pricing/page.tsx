'use client';

import { useState, useEffect } from 'react';
import { useAuth, SignUpButton } from '@clerk/nextjs';
import { PricingCard } from '@/components/PricingCard';

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/generations')
      .then((res) => res.json())
      .then((data) => {
        if (data.usage) setCurrentPlan(data.usage.plan);
      })
      .catch(console.error);
  }, [isSignedIn]);

  const handleUpgrade = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen min-h-dvh pb-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            料金プラン
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            あなたに合ったプランを選んでください
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <PricingCard
            name="Free"
            price={0}
            features={[
              '月5回まで台本生成',
              '直近5件の履歴保存',
              '動画プレビュー',
            ]}
            isCurrentPlan={isSignedIn ? currentPlan === 'free' : false}
            isFeatured={false}
            onSelect={() => {}}
            loading={false}
          />
          <PricingCard
            name="Pro"
            price={980}
            features={[
              '無制限の台本生成',
              '無制限の履歴保存',
              '動画プレビュー',
              'MP4ダウンロード',
            ]}
            isCurrentPlan={isSignedIn ? currentPlan === 'pro' : false}
            isFeatured={true}
            onSelect={handleUpgrade}
            loading={loading}
          />
        </div>

        {!isLoaded ? null : !isSignedIn && (
          <div className="text-center mt-8">
            <SignUpButton mode="modal">
              <button className="text-purple-400 hover:text-purple-300 text-sm underline transition-colors">
                まずは無料アカウントを作成 →
              </button>
            </SignUpButton>
          </div>
        )}
      </div>
    </main>
  );
}
