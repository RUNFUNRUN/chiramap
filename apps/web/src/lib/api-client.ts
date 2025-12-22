import { hc } from 'hono/client';
import type { AppType } from '../../../api/src/index';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

export const client = hc<AppType>(apiUrl, {
  headers: {
    'Content-Type': 'application/json',
  },
  init: {
    credentials: 'include',
  },
});
