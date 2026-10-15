import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  communities,
  memberships,
  users,
  type Database,
} from "@community/db";
import { DATABASE } from "../database/database.module";
import type {
  CreateCommunityInput,
  UpdateCommunityInput,
} from "@community/shared";

@Injectable()
export class CommunitiesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listMine(userId: string) {
    return this.db
      .select({
        id: communities.id,
        slug: communities.slug,
        name: communities.name,
        description: communities.description,
        role: memberships.role,
        memberCount: sql<number>`(
          SELECT count(*)::int FROM ${memberships} m
          WHERE m.community_id = ${communities.id}
            AND m.status = 'active'
        )`.as("member_count"),
        createdAt: communities.createdAt,
      })
      .from(memberships)
      .innerJoin(communities, eq(memberships.communityId, communities.id))
      .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")))
      .orderBy(desc(memberships.createdAt));
  }

  async getBySlug(slug: string) {
    const rows = await this.db
      .select()
      .from(communities)
      .where(eq(communities.slug, slug))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException("Community not found");
    return rows[0];
  }

  async create(ownerId: string, input: CreateCommunityInput) {
    try {
      const inserted = await this.db
        .insert(communities)
        .values({
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
          ownerId,
        })
        .returning();
      // Owner is auto-joined as a member with role=owner.
      await this.db.insert(memberships).values({
        userId: ownerId,
        communityId: inserted[0].id,
        role: "owner",
        status: "active",
      });
      return inserted[0];
    } catch (err) {
      if (err instanceof Error && /duplicate key|unique/i.test(err.message)) {
        throw new ConflictException(`Slug "${input.slug}" is already taken`);
      }
      throw err;
    }
  }

  async update(slug: string, userId: string, input: UpdateCommunityInput) {
    const community = await this.getBySlug(slug);
    await this.assertRole(community.id, userId, ["owner", "admin"]);
    const updated = await this.db
      .update(communities)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        updatedAt: new Date(),
      })
      .where(eq(communities.id, community.id))
      .returning();
    return updated[0];
  }

  async join(slug: string, userId: string) {
    const community = await this.getBySlug(slug);
    // Check if already a member.
    const existing = await this.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.communityId, community.id)
        )
      )
      .limit(1);
    if (existing.length > 0) {
      if (existing[0].status === "active") {
        throw new ConflictException("Already a member");
      }
      // Re-activate.
      await this.db
        .update(memberships)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(memberships.id, existing[0].id));
      return { reactivated: true };
    }
    await this.db.insert(memberships).values({
      userId,
      communityId: community.id,
      role: "member",
      status: "active",
    });
    return { joined: true };
  }

  async leave(slug: string, userId: string) {
    const community = await this.getBySlug(slug);
    const rows = await this.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.communityId, community.id)
        )
      )
      .limit(1);
    if (rows.length === 0) throw new BadRequestException("Not a member");
    if (rows[0].role === "owner") {
      throw new ForbiddenException("Owners cannot leave their own community");
    }
    // Soft-leave: mark status as cancelled (preserves post history).
    await this.db
      .update(memberships)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(memberships.id, rows[0].id));
    return { left: true };
  }

  async listMembers(slug: string, userId: string) {
    const community = await this.getBySlug(slug);
    // Only members can see the member list.
    await this.assertMember(community.id, userId);
    return this.db
      .select({
        userId: memberships.userId,
        role: memberships.role,
        status: memberships.status,
        joinedAt: memberships.createdAt,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.communityId, community.id))
      .orderBy(desc(memberships.createdAt));
  }

  async assertMember(communityId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.communityId, communityId),
          eq(memberships.status, "active")
        )
      )
      .limit(1);
    if (rows.length === 0) {
      throw new ForbiddenException("You must be a member of this community");
    }
    return rows[0];
  }

  async assertRole(
    communityId: string,
    userId: string,
    allowed: Array<"owner" | "admin" | "member">
  ) {
    const m = await this.assertMember(communityId, userId);
    if (!allowed.includes(m.role as "owner" | "admin" | "member")) {
      throw new ForbiddenException(
        `Requires one of these roles: ${allowed.join(", ")}`
      );
    }
    return m;
  }
}
