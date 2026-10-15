import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
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

  // Public profile lookup
  @Get(":id")
  async getOne(@Param("id") id: string) {
    return this.users.findById(id);
  }
}
