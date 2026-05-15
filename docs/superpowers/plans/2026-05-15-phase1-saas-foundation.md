# Phase 1: SaaS 基盤 — 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reels Generator MVP に認証・DB・課金を組み込み、月額 SaaS として運用可能な基盤を構築する。

**Architecture:** Clerk で認証、Supabase (PostgreSQL) + Prisma でデータ永続化、Stripe Billing で月額課金。既存の Next.js App Router 構成を維持しつつ、ClerkProvider でアプリ全体をラップし、API ルートに認証チェックとプラン制限を追加する。

**Tech Stack:** Next.js 15 / Clerk / Prisma / Supabase / Stripe / Vitest

---

## ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `prisma/schema.prisma` | DB スキーマ定義（users, generations, subscriptions） |
| `src/lib/db.ts` | Prisma クライアントシングルトン |
| `src/lib/auth.ts` | 認証ヘルパー（getCurrentUser, requireAuth） |
| `src/lib/stripe.ts` | Stripe クライアント + Checkout Session 作成 |
| `src/lib/plans.ts` | プラン設定（制限値、機能フラグ） |
| `src/middleware.ts` | Clerk ミドルウェア（公開/保護ルート設定） |
| `src/app/api/webhooks/clerk/route.ts` | Clerk Webhook（ユーザー同期） |
| `src/app/api/webhooks/stripe/route.ts` | Stripe Webhook（サブスク同期） |
| `src/app/api/checkout/route.ts` | Stripe Checkout Session 作成 |
| `src/app/api/generations/route.ts` | 生成履歴取得 API |
| `src/app/dashboard/page.tsx` | 生成履歴ダッシュボード |
| `src/app/pricing/page.tsx` | 料金プランページ |
| `src/components/UserNav.tsx` | ユーザーナビ（アバター, サインアウト） |
| `src/components/GenerationHistory.tsx` | 履歴リストコンポーネント |
| `src/components/PricingCard.tsx` | 料金カードコンポーネント |
| `src/components/UsageBar.tsx` | 使用量バー（Free プラン残回数表示） |
| `vitest.config.ts` | Vitest 設定 |
| `src/lib/__tests__/plans.test.ts` | プラン設定のテスト |
| `src/lib/__tests__/auth.test.ts` | 認証ヘルパーのテスト |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `package.json` | 依存パッケージ追加 |
| `.env.local` | Clerk / Supabase / Stripe 環境変数追加 |
| `.gitignore` | `prisma/generated` 追加 |
| `src/app/layout.tsx` | ClerkProvider ラップ + UserNav 追加 |
| `src/app/page.tsx` | 未ログイン時 LP 表示 / ログイン時 生成画面 |
| `src/app/api/generate-script/route.ts` | 認証チェック + DB 保存 + 回数制限 |
| `src/app/api/render-video/route.ts` | 認証チェック + Pro プランチェック |
| `src/types/index.ts` | DB 関連の型追加 |

---

## Task 1: 依存パッケージのインストール

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Clerk + Prisma + Stripe + テストツールをインストール**

```bash
cd /Users/kousuke/reels-generator
npm install @clerk/nextjs @prisma/client stripe
npm install -D prisma vitest @vitejs/plugin-react jsdom @types/node
```

- [ ] **Step 2: package.json に scripts を追加**

`package.json` の `"scripts"` に以下を追加:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

既存の dev, build, start, lint, remotion:* はそのまま残す。

- [ ] **Step 3: Vitest 設定ファイルを作成**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: コミット**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "feat: add Clerk, Prisma, Stripe, Vitest dependencies"
```

---

## Task 2: プラン設定（plans.ts）

**Files:**
- Create: `src/lib/plans.ts`
- Create: `src/lib/__tests__/plans.test.ts`

- [ ] **Step 1: テストを書く**

Create `src/lib/__tests__/plans.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PLANS, getPlanLimits, canGenerate, canDownloadVideo } from '../plans';

describe('plans', () => {
  it('free plan has 5 generations per month', () => {
    const limits = getPlanLimits('free');
    expect(limits.maxGenerationsPerMonth).toBe(5);
  });

  it('pro plan has unlimited generations', () => {
    const limits = getPlanLimits('pro');
    expect(limits.maxGenerationsPerMonth).toBe(Infinity);
  });

  it('free user can generate when under limit', () => {
    expect(canGenerate('free', 3)).toBe(true);
  });

  it('free user cannot generate when at limit', () => {
    expect(canGenerate('free', 5)).toBe(false);
  });

  it('pro user can always generate', () => {
    expect(canGenerate('pro', 999)).toBe(true);
  });

  it('free user cannot download video', () => {
    expect(canDownloadVideo('free')).toBe(false);
  });

  it('pro user can download video', () => {
    expect(canDownloadVideo('pro')).toBe(true);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

```bash
cd /Users/kousuke/reels-generator
npx vitest run src/lib/__tests__/plans.test.ts
```

Expected: FAIL — module '../plans' not found

- [ ] **Step 3: 実装を書く**

Create `src/lib/plans.ts`:

```ts
export type Plan = 'free' | 'pro';

export interface PlanLimits {
  maxGenerationsPerMonth: number;
  canDownloadVideo: boolean;
  maxHistoryItems: number;
  price: number;
}

export const PLANS: Record<Plan, PlanLimits> = {
  free: {
    maxGenerationsPerMonth: 5,
    canDownloadVideo: false,
    maxHistoryItems: 5,
    price: 0,
  },
  pro: {
    maxGenerationsPerMonth: Infinity,
    canDownloadVideo: true,
    maxHistoryItems: Infinity,
    price: 980,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLANS[plan];
}

export function canGenerate(plan: Plan, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  return currentCount < limits.maxGenerationsPerMonth;
}

export function canDownloadVideo(plan: Plan): boolean {
  return getPlanLimits(plan).canDownloadVideo;
}
```

- [ ] **Step 4: テスト通過を確認**

```bash
npx vitest run src/lib/__tests__/plans.test.ts
```

Expected: 7 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/plans.ts src/lib/__tests__/plans.test.ts
git commit -m "feat: add plan configuration with limits"
```

---

## Task 3: Prisma スキーマ + DB 接続

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Modify: `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Prisma を初期化**

```bash
cd /Users/kousuke/reels-generator
npx prisma init --datasource-provider postgresql
```

これで `prisma/schema.prisma` と `.env` が生成される。`.env` は使わず `.env.local` に統合する。生成された `.env` は削除する。

```bash
rm .env
```

- [ ] **Step 2: .env.local に DB 接続情報を追加**

`.env.local` に以下を追記（Supabase ダッシュボードから取得した値で置き換える）:

```
# 既存
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

注意: `DATABASE_URL` は Pooler (port 6543, pgbouncer=true)、`DIRECT_URL` は Direct (port 5432)。Supabase ダッシュボード → Settings → Database → Connection string から取得。

- [ ] **Step 3: Prisma スキーマを定義**

`prisma/schema.prisma` を以下の内容に置き換える:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id                      String         @id @default(uuid()) @db.Uuid
  clerkId                 String         @unique @map("clerk_id")
  email                   String
  plan                    String         @default("free")
  stripeCustomerId        String?        @map("stripe_customer_id")
  monthlyGenerationCount  Int            @default(0) @map("monthly_generation_count")
  createdAt               DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt               DateTime       @updatedAt @map("updated_at") @db.Timestamptz

  generations   Generation[]
  subscription  Subscription?

  @@map("users")
}

model Generation {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  input      Json
  result     Json
  isFavorite Boolean  @default(false) @map("is_favorite")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])

  @@map("generations")
}

model Subscription {
  id                   String   @id @default(uuid()) @db.Uuid
  userId               String   @unique @map("user_id") @db.Uuid
  stripeSubscriptionId String   @unique @map("stripe_subscription_id")
  status               String
  plan                 String
  currentPeriodEnd     DateTime @map("current_period_end") @db.Timestamptz
  createdAt            DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])

  @@map("subscriptions")
}
```

- [ ] **Step 4: Prisma クライアントシングルトンを作成**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 5: .gitignore に追記**

`.gitignore` の末尾に追加:

```
.env
```

- [ ] **Step 6: Prisma クライアントを生成して DB にプッシュ**

```bash
npx prisma generate
npx prisma db push
```

Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 7: コミット**

```bash
git add prisma/schema.prisma src/lib/db.ts .gitignore
git commit -m "feat: add Prisma schema for users, generations, subscriptions"
```

---

## Task 4: Clerk 認証セットアップ

**Files:**
- Modify: `.env.local`
- Create: `src/middleware.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/components/UserNav.tsx`

- [ ] **Step 1: .env.local に Clerk の環境変数を追加**

Clerk ダッシュボード（clerk.com）でプロジェクトを作成し、API Keys から取得した値を `.env.local` に追記:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

- [ ] **Step 2: Clerk ミドルウェアを作成**

Create `src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

- [ ] **Step 3: layout.tsx に ClerkProvider を追加**

`src/app/layout.tsx` を以下に書き換え:

```tsx
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
```

注意: `@clerk/localizations` がない場合は `npm install @clerk/localizations` を実行。

- [ ] **Step 4: UserNav コンポーネントを作成**

Create `src/components/UserNav.tsx`:

```tsx
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';

export function UserNav() {
  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800">
      <Link href="/" className="text-lg font-bold tracking-tight">
        Reels Generator
      </Link>

      <div className="flex items-center gap-3">
        <SignedOut>
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
        </SignedOut>

        <SignedIn>
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
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: 動作確認**

```bash
cd /Users/kousuke/reels-generator
npm run dev
```

ブラウザで `http://localhost:3000` を開き、以下を確認:
- ナビバーに「ログイン」「無料で始める」ボタンが表示される
- 「ログイン」をクリックすると Clerk のモーダルが表示される
- ログイン後、UserButton（アバター）が表示される
- `/dashboard` にアクセスすると、未ログイン時はサインインにリダイレクトされる

- [ ] **Step 6: コミット**

```bash
git add src/middleware.ts src/app/layout.tsx src/components/UserNav.tsx
git commit -m "feat: add Clerk authentication with UserNav"
```

---

## Task 5: 認証ヘルパー（auth.ts）

**Files:**
- Create: `src/lib/auth.ts`

- [ ] **Step 1: 認証ヘルパーを実装**

Create `src/lib/auth.ts`:

```ts
import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';
import type { Plan } from './plans';

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  plan: Plan;
  monthlyGenerationCount: number;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) return null;

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    plan: user.plan as Plan,
    monthlyGenerationCount: user.monthlyGenerationCount,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
```

- [ ] **Step 2: コミット**

```bash
git add src/lib/auth.ts
git commit -m "feat: add auth helpers (getCurrentUser, requireAuth)"
```

---

## Task 6: Clerk Webhook — ユーザー同期

**Files:**
- Create: `src/app/api/webhooks/clerk/route.ts`

- [ ] **Step 1: svix をインストール（Clerk Webhook 検証用）**

```bash
cd /Users/kousuke/reels-generator
npm install svix
```

- [ ] **Step 2: Webhook ハンドラーを実装**

Create `src/app/api/webhooks/clerk/route.ts`:

```ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    primary_email_address_id: string;
  };
}

export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'user.created') {
    const email =
      event.data.email_addresses.find(
        (e) => e.email_address
      )?.email_address ?? '';

    await prisma.user.create({
      data: {
        clerkId: event.data.id,
        email,
      },
    });
  }

  if (event.type === 'user.deleted') {
    await prisma.user.deleteMany({
      where: { clerkId: event.data.id },
    });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 3: Clerk ダッシュボードで Webhook を設定**

1. Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://<your-vercel-domain>/api/webhooks/clerk`
3. Events: `user.created`, `user.deleted` を選択
4. 表示される Signing Secret を `.env.local` の `CLERK_WEBHOOK_SECRET` にセット

ローカル開発時は ngrok 等でトンネルするか、`npx clerk webhook:listen --url http://localhost:3000/api/webhooks/clerk` を使う。

- [ ] **Step 4: コミット**

```bash
git add src/app/api/webhooks/clerk/route.ts package.json package-lock.json
git commit -m "feat: add Clerk webhook for user sync"
```

---

## Task 7: 生成 API に認証・DB 保存・回数制限を追加

**Files:**
- Modify: `src/app/api/generate-script/route.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: types/index.ts に DB 関連の型を追加**

`src/types/index.ts` の末尾に追加:

```ts
export interface GenerationRecord {
  id: string;
  input: UserInput;
  result: GeneratedScript;
  isFavorite: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: generate-script/route.ts を認証対応に書き換え**

`src/app/api/generate-script/route.ts` を以下に置き換え:

```ts
import { NextResponse } from 'next/server';
import { generateScript } from '@/lib/ai/client';
import { requireAuth } from '@/lib/auth';
import { canGenerate } from '@/lib/plans';
import { prisma } from '@/lib/db';
import type { UserInput } from '@/types';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (!canGenerate(user.plan, user.monthlyGenerationCount)) {
      return NextResponse.json(
        { error: '今月の生成回数上限に達しました。Proプランにアップグレードしてください。' },
        { status: 403 }
      );
    }

    const body: UserInput = await request.json();
    const result = await generateScript(body);

    await prisma.$transaction([
      prisma.generation.create({
        data: {
          userId: user.id,
          input: body as object,
          result: result as object,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { monthlyGenerationCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: 動作確認**

```bash
npm run dev
```

ブラウザでログイン後、台本を生成する。以下を確認:
- ログインしていない状態で生成しようとすると 401 エラー
- ログイン状態で正常に生成できる
- Prisma Studio (`npx prisma studio`) で generations テーブルにレコードが作成されている
- users テーブルの monthly_generation_count が +1 されている

- [ ] **Step 4: コミット**

```bash
git add src/app/api/generate-script/route.ts src/types/index.ts
git commit -m "feat: add auth, DB save, and rate limiting to generate API"
```

---

## Task 8: render-video API に認証 + Pro チェックを追加

**Files:**
- Modify: `src/app/api/render-video/route.ts`

- [ ] **Step 1: render-video/route.ts を認証対応に書き換え**

`src/app/api/render-video/route.ts` の先頭のインポートと POST 関数の冒頭に認証チェックを追加。ファイル全体を以下に置き換え:

```ts
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '@/lib/auth';
import { canDownloadVideo } from '@/lib/plans';

export const maxDuration = 300;

let bundleLocation: string | null = null;

async function ensureBundled(): Promise<string> {
  if (bundleLocation) return bundleLocation;
  bundleLocation = await bundle({
    entryPoint: path.join(process.cwd(), 'src/remotion/index.ts'),
  });
  return bundleLocation;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (!canDownloadVideo(user.plan)) {
      return NextResponse.json(
        { error: '動画ダウンロードはProプラン限定です。' },
        { status: 403 }
      );
    }

    const { title, screenTexts, duration } = await request.json();

    const serveUrl = await ensureBundled();
    const inputProps = { title, screenTexts, durationInSeconds: duration };

    const composition = await selectComposition({
      serveUrl,
      id: 'ShortVideo',
      inputProps,
    });

    const outputDir = path.join(process.cwd(), 'public', 'renders');
    fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `render-${Date.now()}.mp4`;
    const outputLocation = path.join(outputDir, fileName);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps,
    });

    return NextResponse.json({ url: `/renders/${fileName}` });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    console.error('Render error:', error);
    const message = error instanceof Error ? error.message : 'Rendering failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: コミット**

```bash
git add src/app/api/render-video/route.ts
git commit -m "feat: restrict video download to Pro plan"
```

---

## Task 9: トップページの認証対応

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx を認証対応に書き換え**

`src/app/page.tsx` を以下に置き換え:

```tsx
'use client';

import { useState, useRef } from 'react';
import { useAuth, SignUpButton } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { InputForm } from '@/components/InputForm';
import { ScriptResult } from '@/components/ScriptResult';
import type { UserInput, GeneratedScript } from '@/types';

const VideoPreview = dynamic(
  () => import('@/components/VideoPreview').then(mod => mod.VideoPreview),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 h-[400px] animate-pulse" />
    ),
  }
);

function LandingHero() {
  return (
    <div className="text-center py-16 sm:py-24 px-4">
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
        AIでリール台本を
        <br />
        <span className="text-purple-400">秒速で生成</span>
      </h1>
      <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-md mx-auto">
        テーマと伝えたいことを入力するだけ。
        <br />
        15秒・30秒の台本、投稿文、ハッシュタグを自動生成。
      </p>
      <SignUpButton mode="modal">
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors">
          無料で台本を作る
        </button>
      </SignUpButton>
      <p className="text-gray-500 text-sm mt-3">
        無料プラン: 月5回まで生成可能
      </p>
    </div>
  );
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<15 | 30>(15);
  const [activeTab, setActiveTab] = useState<'script' | 'preview'>('script');
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (input: UserInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setScript(data);
      setActiveTab('script');
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError('生成に失敗しました。もう一度お試しください。');
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen min-h-dvh">
        <LandingHero />
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-dvh pb-8">
      <div className="max-w-lg lg:max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Reels Generator
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            短尺動画を自動生成
          </p>
        </div>

        {error && (
          <div className="max-w-lg mx-auto mb-4 bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          <div>
            <InputForm onSubmit={handleGenerate} loading={loading} />
          </div>

          <div ref={resultRef} className="space-y-4">
            {script ? (
              <>
                <div className="flex gap-1.5 bg-gray-900 p-1.5 rounded-xl border border-gray-800 lg:hidden">
                  <button
                    onClick={() => setActiveTab('script')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'script'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    台本・投稿文
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'preview'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    動画プレビュー
                  </button>
                </div>

                <div className={`${activeTab === 'script' ? 'block' : 'hidden lg:block'}`}>
                  <ScriptResult script={script} />
                </div>
                <div className={`${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
                  <VideoPreview
                    title={script.title}
                    screenTexts={script.screenTexts}
                    duration={duration}
                    onDurationChange={setDuration}
                  />
                </div>
              </>
            ) : (
              <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl text-center text-gray-500">
                <p className="text-4xl mb-3">🎬</p>
                <p className="text-sm">
                  フォームに入力して
                  <br />
                  「AI台本を生成する」をタップ
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 動作確認**

```bash
npm run dev
```

- 未ログイン: LP のヒーローセクションが表示される
- ログイン後: 通常の生成画面が表示される
- 生成回数超過時: エラーメッセージが赤いバナーで表示される

- [ ] **Step 3: コミット**

```bash
git add src/app/page.tsx
git commit -m "feat: show landing page for unauthenticated users"
```

---

## Task 10: 生成履歴 API + ダッシュボードページ

**Files:**
- Create: `src/app/api/generations/route.ts`
- Create: `src/components/GenerationHistory.tsx`
- Create: `src/components/UsageBar.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: 生成履歴 API を作成**

Create `src/app/api/generations/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@/lib/plans';

export async function GET() {
  try {
    const user = await requireAuth();
    const limits = getPlanLimits(user.plan);

    const take = limits.maxHistoryItems === Infinity ? undefined : limits.maxHistoryItems;

    const generations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json({
      generations,
      usage: {
        current: user.monthlyGenerationCount,
        limit: limits.maxGenerationsPerMonth,
        plan: user.plan,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: UsageBar コンポーネントを作成**

Create `src/components/UsageBar.tsx`:

```tsx
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
```

- [ ] **Step 3: GenerationHistory コンポーネントを作成**

Create `src/components/GenerationHistory.tsx`:

```tsx
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
```

- [ ] **Step 4: ダッシュボードページを作成**

Create `src/app/dashboard/page.tsx`:

```tsx
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
```

- [ ] **Step 5: 動作確認**

```bash
npm run dev
```

ブラウザで `/dashboard` にアクセスし、以下を確認:
- 使用量バーが表示される
- 過去の生成履歴が表示される（あれば）
- 履歴をクリックすると台本・投稿文・ハッシュタグが展開される
- コピーボタンが機能する
- Free プランの場合「Pro プランで無制限に」のバナーが表示される

- [ ] **Step 6: コミット**

```bash
git add src/app/api/generations/route.ts src/components/UsageBar.tsx src/components/GenerationHistory.tsx src/app/dashboard/page.tsx
git commit -m "feat: add generation history dashboard with usage tracking"
```

---

## Task 11: Stripe 連携

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/checkout/route.ts`
- Create: `src/app/api/webhooks/stripe/route.ts`
- Modify: `.env.local`

- [ ] **Step 1: .env.local に Stripe 環境変数を追加**

Stripe ダッシュボード（dashboard.stripe.com）から取得した値を `.env.local` に追記:

```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

`STRIPE_PRO_PRICE_ID` は Stripe ダッシュボードで月額 980 円の商品・価格を作成した際に生成される Price ID。

- [ ] **Step 2: Stripe クライアントを作成**

Create `src/lib/stripe.ts`:

```ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  stripeCustomerId: string | null
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing`,
    metadata: { userId },
    ...(stripeCustomerId
      ? { customer: stripeCustomerId }
      : { customer_email: userEmail }),
  });

  return session.url!;
}
```

- [ ] **Step 3: Checkout API を作成**

Create `src/app/api/checkout/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const user = await requireAuth();

    if (user.plan === 'pro') {
      return NextResponse.json(
        { error: 'すでにProプランです' },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const url = await createCheckoutSession(
      user.id,
      user.email,
      dbUser?.stripeCustomerId ?? null
    );

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Stripe Webhook ハンドラーを作成**

Create `src/app/api/webhooks/stripe/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'pro',
            stripeCustomerId: customerId,
          },
        }),
        prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeSubscriptionId: subscriptionId,
            status: subscription.status,
            plan: 'pro',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
          update: {
            stripeSubscriptionId: subscriptionId,
            status: subscription.status,
            plan: 'pro',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        }),
      ]);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!dbSubscription) break;

      const isActive = subscription.status === 'active';

      await prisma.$transaction([
        prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        }),
        prisma.user.update({
          where: { id: dbSubscription.userId },
          data: { plan: isActive ? 'pro' : 'free' },
        }),
      ]);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      const dbSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!dbSubscription) break;

      await prisma.$transaction([
        prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'canceled' },
        }),
        prisma.user.update({
          where: { id: dbSubscription.userId },
          data: { plan: 'free' },
        }),
      ]);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 5: Stripe ダッシュボードで Webhook を設定**

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://<your-vercel-domain>/api/webhooks/stripe`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Signing Secret を `.env.local` の `STRIPE_WEBHOOK_SECRET` にセット

ローカルテスト用:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- [ ] **Step 6: コミット**

```bash
git add src/lib/stripe.ts src/app/api/checkout/route.ts src/app/api/webhooks/stripe/route.ts
git commit -m "feat: add Stripe billing (checkout + webhook handlers)"
```

---

## Task 12: 料金プランページ

**Files:**
- Create: `src/components/PricingCard.tsx`
- Create: `src/app/pricing/page.tsx`

- [ ] **Step 1: PricingCard コンポーネントを作成**

Create `src/components/PricingCard.tsx`:

```tsx
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
```

- [ ] **Step 2: Pricing ページを作成**

Create `src/app/pricing/page.tsx`:

```tsx
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
```

- [ ] **Step 3: 動作確認**

```bash
npm run dev
```

ブラウザで `/pricing` にアクセスし、以下を確認:
- Free と Pro の2つのカードが表示される
- 未ログイン時: 「まずは無料アカウントを作成」リンクが表示される
- ログイン済み & Free プラン: 「このプランを選ぶ」ボタンで Stripe Checkout に遷移
- ログイン済み & Pro プラン: Pro カードに「現在のプラン」と表示

- [ ] **Step 4: コミット**

```bash
git add src/components/PricingCard.tsx src/app/pricing/page.tsx
git commit -m "feat: add pricing page with Stripe checkout integration"
```

---

## Task 13: 月次生成回数のリセット処理

**Files:**
- Create: `src/app/api/cron/reset-usage/route.ts`

- [ ] **Step 1: Cron API ルートを作成**

Create `src/app/api/cron/reset-usage/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await prisma.user.updateMany({
    data: { monthlyGenerationCount: 0 },
  });

  return NextResponse.json({
    reset: true,
    usersAffected: result.count,
  });
}
```

- [ ] **Step 2: .env.local に CRON_SECRET を追加**

`.env.local` に追記:

```
CRON_SECRET=your-random-secret-string-here
```

ランダムな文字列を生成: `openssl rand -hex 32`

- [ ] **Step 3: vercel.json に Cron 設定を追加**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-usage",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

毎月1日の 00:00 UTC に実行。Vercel Pro プランが必要。Vercel Free プランの場合は手動実行するか、外部の cron サービス（cron-job.org 等）から POST リクエストを送る。

- [ ] **Step 4: コミット**

```bash
git add src/app/api/cron/reset-usage/route.ts vercel.json
git commit -m "feat: add monthly usage reset cron job"
```

---

## Task 14: 最終統合テスト + デプロイ

- [ ] **Step 1: テストを実行**

```bash
cd /Users/kousuke/reels-generator
npx vitest run
```

Expected: plans.test.ts の全テストが PASS

- [ ] **Step 2: ビルド確認**

```bash
npm run build
```

Expected: ビルド成功。エラーなし。

- [ ] **Step 3: ローカルで E2E フロー確認**

```bash
npm run dev
```

以下のフローを手動でテスト:
1. 未ログインで `/` → LP が表示される
2. 「無料で始める」→ Clerk サインアップ → ユーザー作成
3. ログイン後 `/` → 生成画面が表示される
4. 台本を生成 → 結果が表示される
5. `/dashboard` → 生成履歴に今の結果が表示、使用量バーが 1/5
6. 5回生成 → 「今月の生成回数上限に達しました」エラー
7. `/pricing` → 「このプランを選ぶ」→ Stripe Checkout
8. テストカード (4242 4242 4242 4242) で支払い → Pro にアップグレード
9. ログイン後、無制限に生成可能 + MP4 ダウンロード可能

- [ ] **Step 4: 環境変数を Vercel に設定**

Vercel ダッシュボード → Settings → Environment Variables に以下を追加:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL` (本番ドメイン)

- [ ] **Step 5: デプロイ**

```bash
git push origin main
```

Vercel が自動デプロイを実行。デプロイ後、本番 URL で Step 3 と同じフローを再確認。

- [ ] **Step 6: Webhook URL を本番に更新**

- Clerk Dashboard → Webhooks → エンドポイントの URL を本番ドメインに更新
- Stripe Dashboard → Webhooks → エンドポイントの URL を本番ドメインに更新

---

## 完了条件

Phase 1 が完了した状態:

- [ ] 未ログインユーザーには LP が表示される
- [ ] Clerk でサインアップ/サインインできる
- [ ] サインアップ時にユーザーが DB に同期される
- [ ] ログインユーザーは台本を生成でき、結果が DB に保存される
- [ ] Free プランは月5回まで生成可能（超過時にエラー）
- [ ] `/dashboard` で生成履歴と使用量を確認できる
- [ ] `/pricing` で Free/Pro プランを比較できる
- [ ] Stripe Checkout で Pro プランにアップグレードできる
- [ ] Pro プランは無制限生成 + MP4 ダウンロード可能
- [ ] サブスクのキャンセル時に Free に戻る
- [ ] 毎月1日に生成回数がリセットされる
