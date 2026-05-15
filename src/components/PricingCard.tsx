'use client';

interface Props {
  name: string;
  price: number;
  features: string[];
  isCurrentPlan: boolean;
  isFeatured: boolean;
  onSelect: () => void;
  loading: boolean;
}

export function PricingCard({
  name,
  price,
  features,
  isCurrentPlan,
  isFeatured,
  onSelect,
  loading,
}: Props) {
  return (
    <div
      className={`rounded-2xl p-6 border ${
        isFeatured
          ? 'bg-purple-900/20 border-purple-700'
          : 'bg-gray-900 border-gray-800'
      }`}
    >
      {isFeatured && (
        <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
          おすすめ
        </span>
      )}

      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-extrabold">
          {price === 0 ? '¥0' : `¥${price.toLocaleString()}`}
        </span>
        <span className="text-gray-400 text-sm"> /月</span>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-purple-400 mt-0.5">✓</span>
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrentPlan || loading}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
          isCurrentPlan
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : isFeatured
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
        }`}
      >
        {loading ? '処理中...' : isCurrentPlan ? '現在のプラン' : 'このプランを選ぶ'}
      </button>
    </div>
  );
}
