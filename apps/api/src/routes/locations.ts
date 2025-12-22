import { zValidator } from '@hono/zod-validator';
import type { Session, User } from 'better-auth';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { z } from 'zod';
import { locations, shares } from '../db/schema';
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
        shareId: z.string().uuid(),
        lat: z.number(),
        lng: z.number(),
        heading: z.number().optional(),
        speed: z.number().optional(),
        accuracy: z.number().optional(),
      }),
    ),
    async (c) => {
      const { shareId, lat, lng, heading, speed, accuracy } =
        c.req.valid('json');
      const user = c.get('user');

      const db = drizzle(c.env.DB);

      // Verify ownership
      const [share] = await db
        .select()
        .from(shares)
        .where(eq(shares.id, shareId));

      if (!share) {
        return c.json({ error: 'Share not found' }, 404);
      }

      if (share.ownerId !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
      }

      if (!share.active) {
        return c.json({ error: 'Share is inactive' }, 410);
      }

      const [newLocation] = await db
        .insert(locations)
        .values({
          id: crypto.randomUUID(),
          shareId,
          lat,
          lng,
          heading,
          speed,
          accuracy,
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(newLocation);
    },
  )
  .get('/:shareId', async (c) => {
    const shareId = c.req.param('shareId');
    const db = drizzle(c.env.DB);

    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.shareId, shareId))
      .orderBy(desc(locations.timestamp))
      .limit(1);

    if (!location) {
      return c.json({ error: 'Location not found' }, 404);
    }

    return c.json(location);
  });

export default app;
