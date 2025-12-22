import { config } from '@dotenvx/dotenvx';
import { defineConfig } from 'drizzle-kit';

config({ path: '.dev.vars' });

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  // You can add driver: 'd1-http' here if using remote D1 for studio
});
