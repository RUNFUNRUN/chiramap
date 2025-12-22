import { config } from '@dotenvx/dotenvx';
import { defineConfig } from 'drizzle-kit';

config({ path: '.dev.vars' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
