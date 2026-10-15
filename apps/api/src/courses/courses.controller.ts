import {
  Body,
  Controller,
  Delete,
  Get,
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

  // GET /api/communities/:slug/courses
  // Course list with lesson counts (member-only).
  @Get("communities/:slug/courses")
  @UseGuards(AuthGuard)
  list(@Param("slug") slug: string, @Req() req: Request) {
    return this.courses.listWithCounts(slug, userId(req));
  }

  // GET /api/communities/:slug/courses/:courseSlug
  // Course detail with the ordered lesson list (member-only). The lesson
  // player fetches a single lesson via the endpoint below.
  @Get("communities/:slug/courses/:courseSlug")
  @UseGuards(AuthGuard)
  async getOne(
    @Param("slug") slug: string,
    @Param("courseSlug") courseSlug: string,
    @Req() req: Request
  ) {
    const c = await this.courses.getBySlug(slug, courseSlug, userId(req));
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      createdAt: c.createdAt,
      // Drop the lesson content from the sidebar payload — only nav metadata
      // is needed. The player page fetches the full content per-lesson.
      lessons: c.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        order: l.order,
      })),
    };
  }

  // GET /api/communities/:slug/courses/:courseSlug/lessons/:lessonSlug
  // Single lesson (member-only). Returns the lesson with its rendered-safe
  // markdown content and prev/next pointers.
  @Get(
    "communities/:slug/courses/:courseSlug/lessons/:lessonSlug"
  )
  @UseGuards(AuthGuard)
  async getLesson(
    @Param("slug") slug: string,
    @Param("courseSlug") courseSlug: string,
    @Param("lessonSlug") lessonSlug: string,
    @Req() req: Request
  ) {
    return this.courses.getLesson(
      slug,
      courseSlug,
      lessonSlug,
      userId(req)
    );
  }

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
