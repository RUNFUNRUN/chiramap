import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';

export const getAuth = (env: CloudflareBindings) => {
  return betterAuth({
    database: drizzleAdapter(drizzle(env.DB), {
      provider: 'sqlite',
      schema: {
        ...schema,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    trustedOrigins: env.CORS_ORIGIN.split(','),
  });
};
