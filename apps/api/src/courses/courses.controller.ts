import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { CoursesService } from "./courses.service";
import { AuthGuard } from "../auth/auth.guard";
import {
  createCourseSchema,
  createLessonSchema,
} from "@community/shared";

type SessionRequest = Request & {
  user?: { id: string };
  session?: { userId: string };
};
function userId(req: Request): string {
  const r = req as SessionRequest;
  return r.user?.id ?? r.session?.userId ?? "";
}

@Controller()
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post("communities/:slug/courses")
  @UseGuards(AuthGuard)
  create(
    @Param("slug") slug: string,
    @Body() body: unknown,
    @Req() req: Request
  ) {
    const input = createCourseSchema.parse(body);
    return this.courses.create(slug, userId(req), input);
  }

  @Delete("communities/:slug/courses/:courseSlug")
  @UseGuards(AuthGuard)
  deleteCourse(
    @Param("slug") slug: string,
    @Param("courseSlug") courseSlug: string,
    @Req() req: Request
  ) {
    return this.courses.deleteCourse(slug, courseSlug, userId(req));
  }

  @Post("communities/:slug/courses/:courseSlug/lessons")
  @UseGuards(AuthGuard)
  addLesson(
    @Param("slug") slug: string,
    @Param("courseSlug") courseSlug: string,
    @Body() body: unknown,
    @Req() req: Request
  ) {
    const input = createLessonSchema.parse(body);
    return this.courses.addLesson(slug, courseSlug, userId(req), input);
  }
}
