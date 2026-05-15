'use client';

import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from '@clerk/nextjs';
import Link from 'next/link';

export function UserNav() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800">
      <Link href="/" className="text-lg font-bold tracking-tight">
        Reels Generator
      </Link>

      <div className="flex items-center gap-3">
        {isLoaded && !isSignedIn && (
          <>
            <SignInButton mode="modal">
              <button className="text-sm text-gray-400 hover:text-white transition-colors">
                ログイン
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg transition-colors">
                無料で始める
              </button>
            </SignUpButton>
          </>
        )}

        {isLoaded && isSignedIn && (
          <>
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              履歴
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              プラン
            </Link>
            <UserButton />
          </>
        )}
      </div>
    </nav>
  );
}
