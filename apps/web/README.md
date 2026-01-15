# Chiramap Web

Chiramapのフロントエンドアプリケーションです。Next.js (App Router) で実装され、OpenNext を介して Cloudflare Workers 上で動作します。

## 技術スタック

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Components**: shadcn/ui
*   **Map Integration**: MapLibre GL JS (via mapcn.dev)
*   **Runtime**: Cloudflare Workers (via OpenNext)
*   **Deployment**: Cloudflare Pages / Workers

## 環境設定 (.env.local)

開発には `.env.local` ファイルが必要です。

```env
NEXT_PUBLIC_API_URL="http://localhost:8787"
```

*   `NEXT_PUBLIC_API_URL`: Backend APIのURL。ローカル開発時は `http://localhost:8787`。

## 開発コマンド

### 起動 (Dev Server)

```bash
bun dev
```
`http://localhost:3000` で起動します。

### ビルド (Build)

OpenNext / Cloudflare Workers 用のビルドを行います。

```bash
bun run build
```

## ディレクトリ構造

*   `src/app`: App Router ページコンポーネント
*   `src/components`: UIコンポーネント (shadcn/ui 含む)
*   `src/lib`: APIクライアント、ユーティリティなど
