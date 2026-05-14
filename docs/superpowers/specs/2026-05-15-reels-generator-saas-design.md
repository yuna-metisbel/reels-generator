# Reels Generator SaaS 総合実装計画書

## 概要

TikTok/Instagram Reels 用の短尺動画台本を AI で自動生成する Web ツール「Reels Generator」を、個人用 MVP から月額課金型 SaaS へ進化させる総合計画。

### 現状（MVP）

- **スタック**: Next.js 15 / React 19 / Tailwind CSS / Remotion / Claude API / Vercel
- **機能**: 5項目入力 → Claude API で台本生成（15秒/30秒）→ 画面テキスト・投稿文・ハッシュタグ生成 → Remotion でプレビュー・MP4 DL
- **ユーザー管理**: なし
- **データ永続化**: なし
- **課金**: なし
- **動画**: 黒背景 + 白テキスト + フェードインのみ

### ゴール

- 月額 SaaS として販売可能なプロダクト
- ユーザーごとのデータ管理・課金・生成履歴
- 本格的な動画テンプレート・BGM・背景素材

---

## アプローチ

**インクリメンタル強化**を採用。今の MVP をベースに、フェーズごとに機能を積み上げる。各フェーズで「使える状態」を常にキープする。

---

## フェーズ構成

```
MVP（完了）→ Phase 1 → Phase 2 → Phase 3 → Phase 4
               基盤      ワークフロー   成長・収益     動画強化
```

| Phase | 名前 | 期間目安 |
|-------|------|----------|
| 1 | SaaS 基盤 | 1-2 週間 |
| 2 | ワークフロー強化 | 1-2 週間 |
| 3 | 成長・収益最大化 | 1-2 週間 |
| 4 | 動画クオリティ強化 | 2-3 週間 |

---

## Phase 1: SaaS 基盤

### 技術選定

| 要素 | 選定 | 理由 |
|------|------|------|
| 認証 | Clerk | Next.js 統合が最も楽。プリビルト UI。Google/LINE 対応 |
| DB | Supabase (PostgreSQL) | 無料枠が大きい、Vercel と相性良し、Storage 込み |
| 課金 | Stripe + Stripe Billing | SaaS 月額課金の標準。Webhook 連携が堅実 |
| ORM | Prisma | 型安全、マイグレーション管理 |

### データモデル

```sql
-- ユーザー
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT UNIQUE NOT NULL,
  email         TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro'
  stripe_customer_id TEXT,
  monthly_generation_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 生成履歴
CREATE TABLE generations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  input         JSONB NOT NULL,   -- { theme, message, innerVoice, targetAudience, videoMood }
  result        JSONB NOT NULL,   -- { title, script15s, script30s, screenTexts, caption, hashtags }
  is_favorite   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- サブスクリプション
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status                 TEXT NOT NULL,  -- 'active' | 'canceled' | 'past_due'
  plan                   TEXT NOT NULL,  -- 'free' | 'pro'
  current_period_end     TIMESTAMPTZ NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 料金プラン

| | Free | Pro |
|--|------|-----|
| 月額 | 0 円 | 980 円 |
| 生成回数 | 5 回/月 | 無制限 |
| 動画 DL | 不可 | 可 |
| 履歴保存 | 直近 5 件 | 無制限 |

### 実装するページ

| パス | 内容 |
|------|------|
| `/` | LP 兼ログイン誘導（未ログイン時）/ 生成画面（ログイン時） |
| `/dashboard` | 生成履歴一覧 |
| `/pricing` | プラン比較・アップグレード |
| `/api/webhooks/stripe` | Stripe Webhook 受信 |

### 実装タスク

1. Clerk セットアップ + ミドルウェア設定
2. Supabase プロジェクト作成 + Prisma スキーマ定義
3. ユーザー同期（Clerk Webhook → users テーブル）
4. 生成 API に認証チェック + 生成回数制限追加
5. 生成結果を DB に保存
6. `/dashboard` 履歴一覧ページ
7. Stripe 連携（Checkout Session 作成 → Webhook 処理）
8. `/pricing` プラン比較ページ
9. プランに応じた機能制限の適用

---

## Phase 2: ワークフロー強化

### 2-1. 台本編集機能

- ScriptResult コンポーネントにインライン編集モードを追加
- 編集後の台本で動画プレビューを即時更新
- 「AI に再生成させる」ボタン（部分再生成: タイトルだけ、ハッシュタグだけ等）

### 2-2. テンプレート保存・再利用

```sql
CREATE TABLE templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  preset_input  JSONB NOT NULL,   -- 部分的な UserInput
  is_public     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- 入力フォームに「テンプレートから入力」ボタン
- 生成結果画面に「テンプレートとして保存」ボタン

### 2-3. バッチ生成

- 生成ボタンの横に「3 パターン生成」オプション（Pro 限定）
- 結果をカルーセルで比較表示
- 気に入ったものを選んで保存

### 2-4. SNS コピー連携

- 「Instagram 用にコピー」「TikTok 用にコピー」ボタン
- プラットフォームごとのハッシュタグ最適化（文字数制限対応）
- キャプション + ハッシュタグを結合して一括コピー

### 実装タスク

1. ScriptResult にインライン編集モード追加
2. 部分再生成 API の実装
3. templates テーブル作成 + CRUD API
4. テンプレート選択 UI
5. バッチ生成 API（並列で 3 回生成）
6. カルーセル比較 UI
7. SNS 別コピーボタン実装

---

## Phase 3: 成長・収益最大化

### 3-1. ランディングページ

`/` のトップページをマーケティング用 LP として再設計。

- ヒーローセクション: デモ動画 + CTA「無料で台本を作る」
- 3 ステップ説明（入力 → AI 生成 → コピー & 投稿）
- 料金プラン比較
- ユーザーの声（将来追加）
- FAQ

### 3-2. 管理者ダッシュボード

```
/admin
├── ユーザー数推移
├── 生成回数推移
├── MRR（月次収益）
├── 解約率
└── 人気テーマ・ムード分析
```

- Supabase のデータを集計して表示
- Recharts でグラフ化

### 3-3. リファラル機能

```sql
CREATE TABLE referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES users(id),
  referred_id     UUID NOT NULL REFERENCES users(id),
  reward_granted  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- 招待リンク生成（`?ref=XXXX`）
- 紹介者・被紹介者ともに Pro 7 日間無料
- ダッシュボードに招待状況表示

### 3-4. SEO・オーガニック流入

- ブログセクション `/blog`
- OGP 画像の自動生成
- `sitemap.xml` / `robots.txt` 最適化

### 実装タスク

1. LP デザイン・実装
2. `/admin` 管理ダッシュボード
3. referrals テーブル + リファラルロジック
4. 招待リンク UI + リワード付与
5. ブログ基盤（MDX or CMS）
6. OGP 画像生成
7. SEO 最適化（sitemap, robots, メタタグ）

---

## Phase 4: 動画クオリティ強化

### 4-1. デザインテンプレート

```sql
CREATE TABLE video_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  config          JSONB NOT NULL,   -- { bgColor, gradient, font, animation, layout }
  is_pro          BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| 名前 | 背景 | フォント | エフェクト |
|------|------|----------|-----------|
| ネオン | ダークグラデ | 太ゴシック | グロー + フェードイン |
| ミニマル | 白 | 細明朝 | スライドイン |
| ストリート | コンクリート柄 | 手書き風 | タイプライター |
| パステル | ピンク〜紫 | 丸ゴシック | バウンス |
| シネマ | レターボックス黒 | セリフ | フェード + 字幕風 |

### 4-2. BGM 統合

```sql
CREATE TABLE bgm_tracks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  mood              TEXT NOT NULL,   -- 'funny' | 'emotional' | 'cool' | 'dark' | 'cute' | 'serious'
  duration_seconds  INTEGER NOT NULL,
  file_url          TEXT NOT NULL,
  is_pro            BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- ロイヤリティフリー BGM ライブラリ（10-20 曲、ムードごと分類）
- Supabase Storage に音源を保存
- Remotion の `<Audio>` コンポーネントで合成
- 音量調整スライダー
- フェードイン/フェードアウト自動適用

### 4-3. 背景素材

- **ストック素材連携**: Pexels API（無料）でキーワード検索 → 背景画像/動画を取得
- **AI 画像生成**: テーマから AI 画像を自動生成（将来オプション）
- **カスタムアップロード**: ユーザーが自分の写真/動画をアップロード（Pro 限定）
- オーバーレイ（暗くする/ブラー）で文字の可読性を確保

### 4-4. フォント選択

- Google Fonts から日本語フォント 5-8 種類をプリセット
- テンプレートごとにデフォルトフォントを設定
- フォントサイズ・色・影のカスタマイズ

### 4-5. アニメーション強化

| エフェクト | 説明 |
|-----------|------|
| フェードイン | 現在のもの（改良） |
| スライドイン | 左/右/下から |
| タイプライター | 一文字ずつ表示 |
| バウンス | 弾むように登場 |
| ズームイン | 小 → 大で表示 |
| グリッチ | ノイズエフェクト付き |

### 実装タスク

1. video_templates テーブル + シードデータ
2. テンプレート選択 UI
3. ShortVideo コンポーネントをテンプレート対応にリファクタ
4. 各アニメーションエフェクトの実装
5. bgm_tracks テーブル + Supabase Storage セットアップ
6. BGM 選択 UI + Remotion Audio 統合
7. Pexels API 連携 + 背景画像検索 UI
8. カスタムアップロード機能
9. Google Fonts 統合 + フォント選択 UI

---

## アーキテクチャ全体図

```
[ユーザー]
    │
    ▼
[Next.js App (Vercel)]
    ├── Clerk (認証)
    ├── /api/generate-script → Claude API
    ├── /api/render-video → Remotion
    ├── /api/webhooks/stripe → Stripe
    └── /api/* (CRUD)
           │
           ▼
    [Supabase]
    ├── PostgreSQL (users, generations, templates, subscriptions, ...)
    └── Storage (BGM, ユーザーアップロード素材)
           │
           ▼
    [外部サービス]
    ├── Stripe (課金)
    ├── Pexels API (素材検索)
    └── Google Fonts (フォント)
```

---

## 技術スタック最終構成

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS |
| 動画生成 | Remotion |
| AI | Claude API (Anthropic SDK) |
| 認証 | Clerk |
| DB | Supabase (PostgreSQL) |
| ORM | Prisma |
| 課金 | Stripe |
| ファイル保存 | Supabase Storage |
| デプロイ | Vercel |
| 素材 | Pexels API |
| フォント | Google Fonts |
| グラフ | Recharts |
