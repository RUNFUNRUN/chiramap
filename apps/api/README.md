# Chiramap API

ChiramapのバックエンドAPIです。Honoで実装され、Cloudflare Workers上で動作します。

## 技術スタック

*   **Framework**: Hono
*   **Runtime**: Cloudflare Workers
*   **Auth**: Better Auth (with Google OIDC)
*   **Validation**: Zod
*   **Database**: Supabase (PostgreSQL) + Drizzle ORM

## 環境設定 (.dev.vars)

開発には `.dev.vars` ファイルが必要です。以下の環境変数を設定してください。

```env
DATABASE_URL="postgres://postgres.xxxx:pass@aws-0-region.pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_PUBLISHABLE_KEY="xxxx"
BETTER_AUTH_SECRET="random_secret_string"
BETTER_AUTH_URL="http://localhost:8787"
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxx"
```

*   `DATABASE_URL`: Cloudflare Workersから接続するため、SupabaseのTransaction Pooler (Port 6543) を指定してください。

## API仕様

### 認証 (Auth)
Better Auth を使用しています。
ベースパス: `/api/auth`
*   参照: [Better Auth Documentation](https://better-auth.com/)

### シェア (Shares)

#### `POST /api/shares`
新しい共有セッションを作成します。
*   **Auth**: 必須
*   **Request Body**:
    ```json
    {
      "expiresIn": 60 // 分単位 (1〜1440)
    }
    ```
*   **Response**: 作成されたシェアオブジェクト (ExpiresAtなどを含む)

#### `GET /api/shares/:id`
共有セッションの情報を取得します。
*   **Auth**: 不要
*   **Response**: シェア情報
*   **Errors**:
    *   `404 Not Found`: 存在しないID
    *   `410 Gone`: 有効期限切れまたは無効化済み

### 位置情報 (Locations)

#### `POST /api/locations`
位置情報を更新します。
*   **Auth**: 必須 (シェアの作成者本人のみ可能)
*   **Request Body**:
    ```json
    {
      "shareId": "uuid",
      "lat": 35.681236,
      "lng": 139.767125,
      "heading": 90,       // opitonal (undefined ok)
      "speed": 10.5,       // optional (undefined ok)
      "accuracy": 15.0     // optional (undefined ok)
    }
    ```
*   **Response**: 作成されたロケーションオブジェクト
