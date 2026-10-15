import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { UsersService } from "./users.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Current session user — must be registered BEFORE the `:id` route,
  // otherwise NestJS matches `/me` to the `:id` parameter.
  @Get("me")
  @UseGuards(AuthGuard)
  async me(@Req() req: Request) {
    const session = (req as Request & { session?: { userId: string } }).session;
    return this.users.findById(session!.userId);
  }

  // Public profile lookup. The ParseUUIDPipe returns 400 (not 500) when
  // the id is not a valid UUID, so a request to /api/users/foo produces
  // a clean error instead of a Postgres crash.
  @Get(":id")
  async getOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.users.findById(id);
  }
}
