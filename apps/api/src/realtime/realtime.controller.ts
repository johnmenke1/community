import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { eq, desc } from "drizzle-orm";
import { rooms, type Database } from "@community/db";
import { DATABASE } from "../database/database.module";
import { Inject } from "@nestjs/common";
import { RealtimeService } from "./realtime.service";
import { CommunitiesService } from "../communities/communities.service";
import { AuthGuard } from "../auth/auth.guard";
import { createRoomSchema } from "@community/shared";

type SessionRequest = Request & {
  user?: { id: string; name: string };
  session?: { userId: string };
};
function userId(req: Request): string {
  const r = req as SessionRequest;
  return r.user?.id ?? r.session?.userId ?? "";
}
function userName(req: Request): string {
  const r = req as SessionRequest;
  return r.user?.name ?? "Guest";
}

@Controller()
export class RealtimeController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly realtime: RealtimeService,
    private readonly communities: CommunitiesService
  ) {}

  @Get("communities/:slug/rooms")
  @UseGuards(AuthGuard)
  async list(@Param("slug") slug: string, @Req() req: Request) {
    const community = await this.communities.getBySlug(slug);
    await this.communities.assertMember(community.id, userId(req));
    return this.db
      .select()
      .from(rooms)
      .where(eq(rooms.communityId, community.id))
      .orderBy(desc(rooms.createdAt));
  }

  // Admin/owner-only: start a new room.
  @Post("communities/:slug/rooms")
  @UseGuards(AuthGuard)
  async create(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @Req() req: Request
  ) {
    const community = await this.communities.getBySlug(slug);
    await this.communities.assertRole(community.id, userId(req), ["owner", "admin"]);
    const input = createRoomSchema.parse(body);
    const inserted = await this.db
      .insert(rooms)
      .values({
        communityId: community.id,
        createdById: userId(req),
        name: input.name,
      })
      .returning();
    return inserted[0];
  }

  // Any member can request a join token for a room.
  @Post("rooms/:id/join")
  @UseGuards(AuthGuard)
  async join(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request
  ) {
    const roomRows = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id))
      .limit(1);
    if (roomRows.length === 0) {
      throw new NotFoundException("Room not found");
    }
    const room = roomRows[0];
    await this.communities.assertMember(room.communityId, userId(req));
    return this.realtime.issueMeetingToken({
      userId: userId(req),
      userName: userName(req),
      roomId: room.id,
    });
  }

  @Get("realtime/health")
  health() {
    return { configured: this.realtime.isConfigured() };
  }
}
