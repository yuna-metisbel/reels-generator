import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reels Generator',
  description: 'TikTok/Instagram Reels用の短尺動画自動生成ツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-white">{children}</body>
    </html>
  );
}
