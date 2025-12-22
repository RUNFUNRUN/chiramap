import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: new URL(
    '/api/auth',
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787',
  ).toString(),
});
