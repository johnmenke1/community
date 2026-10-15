import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { CommunitiesService } from "./communities.service";
import { AuthGuard } from "../auth/auth.guard";
import {
  createCommunitySchema,
  updateCommunitySchema,
} from "@community/shared";

type SessionRequest = Request & {
  user?: { id: string };
  session?: { userId: string };
};

function userId(req: Request): string {
  const r = req as SessionRequest;
  return r.user?.id ?? r.session?.userId ?? "";
}

@Controller("communities")
export class CommunitiesController {
  constructor(private readonly communities: CommunitiesService) {}

  @Get("mine")
  @UseGuards(AuthGuard)
  listMine(@Req() req: Request) {
    return this.communities.listMine(userId(req));
  }

  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.communities.getBySlug(slug);
  }

  @Get(":slug/members")
  @UseGuards(AuthGuard)
  listMembers(@Param("slug") slug: string, @Req() req: Request) {
    return this.communities.listMembers(slug, userId(req));
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() body: unknown, @Req() req: Request) {
    const input = createCommunitySchema.parse(body);
    return this.communities.create(userId(req), input);
  }

  @Put(":slug")
  @UseGuards(AuthGuard)
  update(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @Req() req: Request
  ) {
    const input = updateCommunitySchema.parse(body);
    return this.communities.update(slug, userId(req), input);
  }

  @Post(":slug/join")
  @UseGuards(AuthGuard)
  join(@Param("slug") slug: string, @Req() req: Request) {
    return this.communities.join(slug, userId(req));
  }

  @Post(":slug/leave")
  @UseGuards(AuthGuard)
  leave(@Param("slug") slug: string, @Req() req: Request) {
    return this.communities.leave(slug, userId(req));
  }
}
