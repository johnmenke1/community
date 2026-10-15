import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { communities } from "./communities";

// A live audio/video room within a community. Backed by Cloudflare RealtimeKit;
// realtimeKitSessionId is the remote session id from the RealtimeKit API.
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    // The RealtimeKit session id returned by Cloudflare's create-session API.
    // NULL means the room is "pending" — RealtimeKit session hasn't been
    // provisioned yet (token issuance lazily creates it).
    realtimeKitSessionId: text("realtimekit_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    communityCreatedIdx: index("rooms_community_created_idx").on(t.communityId, t.createdAt),
  })
);

export const roomsRelations = relations(rooms, ({ one }) => ({
  community: one(communities, { fields: [rooms.communityId], references: [communities.id] }),
  createdBy: one(users, { fields: [rooms.createdById], references: [users.id] }),
}));
