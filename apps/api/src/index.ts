import { Hono } from 'hono';
import { getAuth } from './auth';
import locationRouter from './routes/locations';
import sharesRouter from './routes/shares';

const app = new Hono<{
  Bindings: CloudflareBindings;
}>();

app.get('/', (c) => {
  return c.text('Chiramap API is running!');
});

app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

const routes = app
  .route('/api/shares', sharesRouter)
  .route('/api/locations', locationRouter);

export type AppType = typeof routes;
export default app;
