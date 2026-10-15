import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://community:community@localhost:5432/community";

// Single client in dev (hot reload), pool in prod. postgres-js handles both.
const isProd = process.env.NODE_ENV === "production";
const client = postgres(connectionString, {
  max: isProd ? 10 : 1,
  prepare: false, // required for compatibility with pgbouncer-style proxies
});

export const db = drizzle(client, { schema });

export * from "./schema";
export type Database = typeof db;
