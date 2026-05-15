import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { jaJP } from '@clerk/localizations';
import { UserNav } from '@/components/UserNav';
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
    <ClerkProvider localization={jaJP}>
      <html lang="ja">
        <body className="bg-gray-950 text-white">
          <UserNav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
