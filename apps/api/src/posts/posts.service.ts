import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  posts,
  postReactions,
  users,
  communities,
  type Database,
} from "@community/db";
import { DATABASE } from "../database/database.module";
import { CommunitiesService } from "../communities/communities.service";
import type { CreatePostInput, ReactionKind } from "@community/shared";

const PAGE_SIZE = 20;

@Injectable()
export class PostsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly communities: CommunitiesService
  ) {}

  async listForCommunity(
    communitySlug: string,
    viewerId: string,
    cursor?: string
  ) {
    const community = await this.communities.getBySlug(communitySlug);
    await this.communities.assertMember(community.id, viewerId);
    // Cursor is the createdAt+id of the last post from the previous page.
    // We use a compound key (created_at, id) to avoid skipping posts created
    // in the same millisecond.
    const cursorDate = cursor ? new Date(cursor) : null;
    const rows = await this.db
      .select({
        id: posts.id,
        body: posts.body,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        reactionCount: sql<number>`(
          SELECT count(*)::int FROM ${postReactions} r
          WHERE r.post_id = ${posts.id}
        )`.as("reaction_count"),
        viewerReacted: sql<boolean>`EXISTS (
          SELECT 1 FROM ${postReactions} r
          WHERE r.post_id = ${posts.id}
            AND r.user_id = ${viewerId}
        )`.as("viewer_reacted"),
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        cursorDate
          ? and(
              eq(posts.communityId, community.id),
              isNull(posts.deletedAt),
              sql`${posts.createdAt} < ${cursorDate}`
            )
          : and(eq(posts.communityId, community.id), isNull(posts.deletedAt))
      )
      .orderBy(desc(posts.createdAt))
      .limit(PAGE_SIZE + 1);
    const hasMore = rows.length > PAGE_SIZE;
    const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore
      ? slice[slice.length - 1].createdAt.toISOString()
      : null;
    return { items: slice, nextCursor, community };
  }

  async create(communitySlug: string, authorId: string, input: CreatePostInput) {
    const community = await this.communities.getBySlug(communitySlug);
    await this.communities.assertMember(community.id, authorId);
    const inserted = await this.db
      .insert(posts)
      .values({
        communityId: community.id,
        authorId,
        body: input.body,
      })
      .returning();
    return inserted[0];
  }

  async delete(postId: string, userId: string) {
    const rows = await this.db
      .select({ post: posts, community: communities })
      .from(posts)
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .where(eq(posts.id, postId))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException("Post not found");
    const { post, community } = rows[0];
    const isAuthor = post.authorId === userId;
    if (!isAuthor) {
      // Author-or-admin check
      await this.communities.assertRole(community.id, userId, ["owner", "admin"]);
    }
    await this.db
      .update(posts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(posts.id, postId));
    return { deleted: true };
  }

  async toggleReaction(postId: string, userId: string, kind: ReactionKind) {
    // Verify the post exists.
    const exists = await this.db
      .select({ id: posts.id, communityId: posts.communityId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    if (exists.length === 0) throw new NotFoundException("Post not found");
    await this.communities.assertMember(exists[0].communityId, userId);
    // Check if the user already has this reaction on this post.
    const existing = await this.db
      .select()
      .from(postReactions)
      .where(
        and(
          eq(postReactions.postId, postId),
          eq(postReactions.userId, userId),
          eq(postReactions.kind, kind)
        )
      )
      .limit(1);
    if (existing.length > 0) {
      await this.db.delete(postReactions).where(eq(postReactions.id, existing[0].id));
      return { reacted: false };
    }
    await this.db.insert(postReactions).values({ postId, userId, kind });
    return { reacted: true };
  }
}
