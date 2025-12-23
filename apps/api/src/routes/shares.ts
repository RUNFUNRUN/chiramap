import { zValidator } from '@hono/zod-validator';
import type { Session, User } from 'better-auth';
import { and, desc, eq, gt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { z } from 'zod';
import { shares } from '../db/schema';
import { authMiddleware } from '../middleware';

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    session: Session;
    user: User;
  };
}>()
  .post(
    '/',
    authMiddleware,
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
      const user = c.get('user');
      const db = drizzle(c.env.DB);
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

      const [newShare] = await db
        .insert(shares)
        .values({
          id: crypto.randomUUID(),
          ownerId: user.id,
          expiresAt,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(newShare);
    },
  )
  .get('/active', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.DB);

    // Find the most recent active share for the user
    const [activeShare] = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.ownerId, user.id),
          eq(shares.active, true),
          gt(shares.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(shares.createdAt))
      .limit(1);

    if (!activeShare) {
      return c.json({ error: 'No active share' }, 404);
    }

    return c.json(activeShare);
  })
  .put(
    '/:id/active',
    authMiddleware,
    zValidator('json', z.object({ active: z.boolean() })),
    async (c) => {
      const id = c.req.param('id');
      const { active } = c.req.valid('json');
      const user = c.get('user');
      const db = drizzle(c.env.DB);

      const [updatedShare] = await db
        .update(shares)
        .set({ active })
        .where(and(eq(shares.id, id), eq(shares.ownerId, user.id)))
        .returning();

      if (!updatedShare) {
        return c.json({ error: 'Share not found or unauthorized' }, 404);
      }

      return c.json(updatedShare);
    },
  )
  .get('/:id', async (c) => {
    // Public access for viewing share
    const id = c.req.param('id');
    const db = drizzle(c.env.DB);
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
