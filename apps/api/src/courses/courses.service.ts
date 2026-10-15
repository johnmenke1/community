import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import {
  courses,
  lessons,
  type Database,
} from "@community/db";
import { DATABASE } from "../database/database.module";
import { CommunitiesService } from "../communities/communities.service";
import type {
  CreateCourseInput,
  CreateLessonInput,
} from "@community/shared";

@Injectable()
export class CoursesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly communities: CommunitiesService
  ) {}

  async listForCommunity(communitySlug: string, viewerId: string) {
    const community = await this.communities.getBySlug(communitySlug);
    await this.communities.assertMember(community.id, viewerId);
    return this.db
      .select()
      .from(courses)
      .where(eq(courses.communityId, community.id))
      .orderBy(asc(courses.createdAt));
  }

  async getBySlug(communitySlug: string, courseSlug: string, viewerId: string) {
    const community = await this.communities.getBySlug(communitySlug);
    await this.communities.assertMember(community.id, viewerId);
    const rows = await this.db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.communityId, community.id),
          eq(courses.slug, courseSlug)
        )
      )
      .limit(1);
    if (rows.length === 0) throw new NotFoundException("Course not found");
    const courseLessons = await this.db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, rows[0].id))
      .orderBy(asc(lessons.order));
    return { ...rows[0], lessons: courseLessons };
  }

  async create(
    communitySlug: string,
    creatorId: string,
    input: CreateCourseInput
  ) {
    const community = await this.communities.getBySlug(communitySlug);
    await this.communities.assertRole(community.id, creatorId, [
      "owner",
      "admin",
    ]);
    try {
      const inserted = await this.db
        .insert(courses)
        .values({
          communityId: community.id,
          createdById: creatorId,
          slug: input.slug,
          title: input.title,
          description: input.description ?? null,
        })
        .returning();
      return inserted[0];
    } catch (err) {
      if (err instanceof Error && /duplicate|unique/i.test(err.message)) {
        throw new ConflictException(
          `Course slug "${input.slug}" already exists in this community`
        );
      }
      throw err;
    }
  }

  async deleteCourse(communitySlug: string, courseSlug: string, userId: string) {
    const community = await this.communities.getBySlug(communitySlug);
    await this.communities.assertRole(community.id, userId, ["owner", "admin"]);
    const rows = await this.db
      .select()
      .from(courses)
      .where(
        and(eq(courses.communityId, community.id), eq(courses.slug, courseSlug))
      )
      .limit(1);
    if (rows.length === 0) throw new NotFoundException("Course not found");
    await this.db.delete(courses).where(eq(courses.id, rows[0].id));
    return { deleted: true };
  }

  async addLesson(
    communitySlug: string,
    courseSlug: string,
    creatorId: string,
    input: CreateLessonInput
  ) {
    const community = await this.communities.getBySlug(communitySlug);
    await this.communities.assertRole(community.id, creatorId, [
      "owner",
      "admin",
    ]);
    const courseRows = await this.db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.communityId, community.id),
          eq(courses.slug, courseSlug)
        )
      )
      .limit(1);
    if (courseRows.length === 0) {
      throw new NotFoundException("Course not found");
    }
    if (!/^\d+$/.test(input.order)) {
      throw new BadRequestException("order must be a non-negative integer string");
    }
    try {
      const inserted = await this.db
        .insert(lessons)
        .values({
          courseId: courseRows[0].id,
          slug: input.slug,
          title: input.title,
          order: input.order,
          content: input.content ?? null,
        })
        .returning();
      return inserted[0];
    } catch (err) {
      if (err instanceof Error && /duplicate|unique/i.test(err.message)) {
        throw new ConflictException(
          `Lesson slug "${input.slug}" already exists in this course`
        );
      }
      throw err;
    }
  }
}
