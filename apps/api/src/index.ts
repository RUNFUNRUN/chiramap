import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAuth } from './auth';
import locationRouter from './routes/locations';
import sharesRouter from './routes/shares';

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

const routes = app
  .basePath('/api')
  .use('*', async (c, next) => {
    const corsMiddlewareHandler = cors({
      origin: c.env.CORS_ORIGIN.split(','),
      credentials: true,
    });
    return corsMiddlewareHandler(c, next);
  })
  .get('/', (c) => {
    return c.text('Chiramap API is running!');
  })
  .all('/auth/*', (c) => {
    const auth = getAuth(c.env);
    return auth.handler(c.req.raw);
  })
  .route('/shares', sharesRouter)
  .route('/locations', locationRouter);

export type AppType = typeof routes;
export default app;
