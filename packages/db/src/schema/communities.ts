import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { memberships } from "./memberships";
import { relations } from "drizzle-orm";

export const communities = pgTable("communities", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  owner: one(users, { fields: [communities.ownerId], references: [users.id] }),
  memberships: many(memberships),
}));
