import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Hono } from 'hono';
import postgres from 'postgres';
import { z } from 'zod';
import { getAuth } from '../auth';
import { shares } from '../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>()
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        expiresIn: z
          .number()
          .min(1)
          .max(24 * 60)
          .default(60), // minutes
      }),
    ),
    async (c) => {
      const { expiresIn } = c.req.valid('json');
      const auth = getAuth(c.env);
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
      const ownerId = session?.user.id;
      const db = drizzle(postgres(c.env.DATABASE_URL));
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

      const [newShare] = await db
        .insert(shares)
        .values({
          ownerId,
          expiresAt,
          active: true,
        })
        .returning();

      return c.json(newShare);
    },
  )
  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const db = drizzle(postgres(c.env.DATABASE_URL));

    try {
      const [share] = await db.select().from(shares).where(eq(shares.id, id));

      if (!share) {
        return c.json({ error: 'Share not found' }, 404);
      }

      if (!share.active) {
        return c.json({ error: 'Share is not active' }, 410);
      }

      if (new Date() > share.expiresAt) {
        return c.json({ error: 'Share expired' }, 410);
      }

      return c.json(share);
    } catch {
      return c.json({ error: 'Invalid request' }, 400);
    }
  });

export default app;
