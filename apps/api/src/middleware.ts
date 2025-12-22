import type { Session, User } from 'better-auth';
import { createMiddleware } from 'hono/factory';
import { getAuth } from './auth';

type Env = {
  Bindings: CloudflareBindings;
  Variables: {
    session: Session;
    user: User;
  };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('session', session.session);
  c.set('user', session.user);
  await next();
});
