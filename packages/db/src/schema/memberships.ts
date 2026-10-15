import { pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { communities } from "./communities";
import { relations } from "drizzle-orm";

export const membershipRole = pgEnum("membership_role", ["owner", "admin", "member"]);
export const membershipStatus = pgEnum("membership_status", ["active", "cancelled", "expired"]);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    communityId: uuid("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("member"),
    status: membershipStatus("status").notNull().default("active"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userCommunityUnique: uniqueIndex("memberships_user_community_unique").on(t.userId, t.communityId),
  })
);

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  community: one(communities, { fields: [memberships.communityId], references: [communities.id] }),
}));
