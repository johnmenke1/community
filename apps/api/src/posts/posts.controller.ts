import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { PostsService } from "./posts.service";
import { AuthGuard } from "../auth/auth.guard";
import { z } from "zod";
import { createPostSchema, reactionKindSchema } from "@community/shared";

type SessionRequest = Request & {
  user?: { id: string };
  session?: { userId: string };
};
function userId(req: Request): string {
  const r = req as SessionRequest;
  return r.user?.id ?? r.session?.userId ?? "";
}

@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  // ---- Community-scoped: /api/communities/:slug/posts -----------------------
  @Get("communities/:slug/posts")
  @UseGuards(AuthGuard)
  list(
    @Param("slug") slug: string,
    @Query("cursor") cursor: string | undefined,
    @Req() req: Request
  ) {
    return this.posts.listForCommunity(slug, userId(req), cursor);
  }

  @Post("communities/:slug/posts")
  @UseGuards(AuthGuard)
  create(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @Req() req: Request
  ) {
    const input = createPostSchema.parse(body);
    return this.posts.create(slug, userId(req), input);
  }

  // ---- Per-post operations -------------------------------------------------
  @Delete("posts/:id")
  @UseGuards(AuthGuard)
  delete(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request
  ) {
    return this.posts.delete(id, userId(req));
  }

  @Post("posts/:id/reactions")
  @UseGuards(AuthGuard)
  react(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: Request
  ) {
    const { kind } = z.object({ kind: reactionKindSchema }).parse(body ?? { kind: "like" });
    return this.posts.toggleReaction(id, userId(req), kind);
  }
}
