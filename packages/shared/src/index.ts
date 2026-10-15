import { z } from "zod";

// ---- Slug validation ---------------------------------------------------------
// Used everywhere a slug is a path param. Lowercase, digits, dashes. 1-48 chars.
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(48, "Slug must be 48 characters or fewer")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Slug must be lowercase letters, digits, and dashes");

// ---- Communities ------------------------------------------------------------
export const createCommunitySchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name must be 80 characters or fewer"),
  slug: slugSchema,
  description: z.string().max(500, "Description must be 500 characters or fewer").optional(),
});
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

export const updateCommunitySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
});
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;

// ---- Posts ------------------------------------------------------------------
export const createPostSchema = z.object({
  body: z
    .string()
    .min(1, "Post body is required")
    .max(10_000, "Post must be 10,000 characters or fewer"),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

// ---- Reactions --------------------------------------------------------------
export const reactionKindSchema = z.enum(["like", "love", "insightful"]);
export type ReactionKind = z.infer<typeof reactionKindSchema>;

// ---- Rooms ------------------------------------------------------------------
export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(80, "Room name must be 80 characters or fewer"),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

// ---- Courses ----------------------------------------------------------------
// Scaffold only — no video upload, no lesson player. The client builds the
// player against these endpoints in a follow-up commit.
export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  slug: slugSchema,
  description: z.string().max(1_000).optional(),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const createLessonSchema = z.object({
  title: z.string().min(1).max(120),
  slug: slugSchema,
  order: z.string().regex(/^\d+$/, "Order must be a non-negative integer").default("0"),
  content: z.string().max(100_000).optional(),
});
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
