import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { communities } from "./communities";

// Courses are content structure (scaffolding) only in v0.2 — no video upload,
// no lesson player, no progress tracking. The client builds the player UI
// against these tables in a follow-up commit.

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    communitySlugUnique: uniqueIndex("courses_community_slug_unique").on(
      t.communityId,
      t.slug
    ),
    communityCreatedIdx: index("courses_community_created_idx").on(
      t.communityId,
      t.createdAt
    ),
  })
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    // Order within the course. 0-based. Used for sorting.
    order: text("order").notNull().default("0"),
    // A free-form text or JSON payload — the client decides how to render
    // (markdown, MDX, video embed url, etc.). No upload pipeline in v0.2.
    content: text("content"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    courseSlugUnique: uniqueIndex("lessons_course_slug_unique").on(t.courseId, t.slug),
    courseOrderIdx: index("lessons_course_order_idx").on(t.courseId, t.order),
  })
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
  community: one(communities, { fields: [courses.communityId], references: [communities.id] }),
  createdBy: one(users, { fields: [courses.createdById], references: [users.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
}));
