import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAuth } from './auth';
import locationRouter from './routes/locations';
import sharesRouter from './routes/shares';

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

app.use('/api/*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: c.env.CORS_ORIGIN.split(','),
    credentials: true,
  });
  return corsMiddlewareHandler(c, next);
});

const routes = app
  .get('/api', (c) => {
    return c.text('Chiramap API is running!');
  })
  .all('/api/auth/*', (c) => {
    const auth = getAuth(c.env);
    return auth.handler(c.req.raw);
  })
  .route('/api/shares', sharesRouter)
  .route('/api/locations', locationRouter);

export type AppType = typeof routes;
export default app;
