import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@community/db";
import * as schema from "@community/db";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  // We don't throw at import time in case the module is loaded only for type
  // information, but the running app will explode on first request if missing.
  // eslint-disable-next-line no-console
  console.warn("[auth] BETTER_AUTH_SECRET is not set; auth requests will fail");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: secret ?? "change-me",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  advanced: {
    database: {
      // Better-auth's default id generator produces a CUID-like string, but
      // our users.id column is a Postgres uuid. Use crypto.randomUUID() so
      // the generated ids round-trip cleanly through the database.
      generateId: () => crypto.randomUUID(),
    },
  },
  user: {
    additionalFields: {
      // No custom fields for now — `image` is the better-auth default avatar.
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ],
});

export type Auth = typeof auth;
