# Chiramap (チラマップ)

「チラッ」と見るだけの、和製一方向・短時間位置情報共有サービス。
A short-term, one-way location sharing application.

## 概要

Chiramapは、一時的に自分の位置情報を相手に共有するためのWebアプリケーションです。
アカウント登録不要（閲覧のみ）、有効期限付きのURLを発行して、手軽に位置情報を伝えられます。

## 技術スタック

*   **Monorepo**: Turborepo
*   **Web**: Next.js (App Router) on Cloudflare Pages
*   **API**: Hono on Cloudflare Workers
*   **Database**: Supabase (PostgreSQL)

詳細は [apps/api](./apps/api) および [apps/web](./apps/web) のREADMEを参照してください。

## 開発セットアップ

### 必要要件
*   Node.js (v20+)
*   Bun (Package Manager & Runtime)

### インストール
```bash
bun install
```

### 起動
```bash
bun run dev
```
*   Frontend: http://localhost:3000
*   Backend: http://localhost:8787
