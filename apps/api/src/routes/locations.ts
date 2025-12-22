import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { Hono } from 'hono';
import postgres from 'postgres';
import { z } from 'zod';
import { getAuth } from '../auth';
import { locations, shares } from '../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>().post(
  '/',
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
    const { shareId, lat, lng, heading, speed, accuracy } = c.req.valid('json');
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = drizzle(postgres(c.env.DATABASE_URL));

    // Verify ownership
    const [share] = await db
      .select()
      .from(shares)
      .where(eq(shares.id, shareId));

    if (!share) {
      return c.json({ error: 'Share not found' }, 404);
    }

    if (share.ownerId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    if (!share.active) {
      return c.json({ error: 'Share is inactive' }, 410);
    }

    const [newLocation] = await db
      .insert(locations)
      .values({
        shareId,
        lat,
        lng,
        heading,
        speed,
        accuracy,
        timestamp: new Date(),
      })
      .returning();

    return c.json(newLocation);
  },
);

export default app;
