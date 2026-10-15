import { Link } from "react-router";
import type { Route } from "./+types/c.$slug.courses.$courseSlug";
import { apiFetch, getUser } from "../lib/server";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  order: string;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
  lessons: Lesson[];
}

interface Community {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const me = await getUser(request);
  const slug = params.slug!;
  if (!me) {
    return { kind: "guest" as const, slug };
  }
  const [communityRes, courseRes] = await Promise.all([
    apiFetch(request, `/api/communities/${slug}`),
    apiFetch(request, `/api/communities/${slug}/courses/${params.courseSlug}`),
  ]);
  if (communityRes.status === 404 || courseRes.status === 404) {
    throw new Response("Not found", { status: 404 });
  }
  if (communityRes.status === 403 || courseRes.status === 403) {
    return { kind: "non-member" as const, slug };
  }
  if (!communityRes.ok) {
    throw new Response("Failed to load community", { status: 502 });
  }
  if (!courseRes.ok) {
    throw new Response("Failed to load course", { status: 502 });
  }
  const community = (await communityRes.json()) as Community;
  const course = (await courseRes.json()) as Course;
  return {
    kind: "member" as const,
    community,
    course,
    isOwner: community.ownerId === me.id,
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (data && data.kind === "member") {
    return [{ title: `${data.course.title} — /c/${data.community.slug}` }];
  }
  return [{ title: "Course" }];
}

export default function CourseDetail({ loaderData }: Route.ComponentProps) {
  if (loaderData.kind === "guest") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Course</h1>
        <p className="mt-2 text-slate-600">
          <Link to={`/login?next=/c/${loaderData.slug}`} className="underline">
            Log in
          </Link>{" "}
          to view this course.
        </p>
      </main>
    );
  }
  if (loaderData.kind === "non-member") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-slate-600">Join this community to view its courses.</p>
        <Link to="/c" className="mt-4 inline-block text-sm underline">
          Browse communities
        </Link>
      </main>
    );
  }
  const { community, course, isOwner } = loaderData;
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header>
        <p className="text-sm text-slate-500">
          <Link to={`/c/${community.slug}/courses`} className="underline">
            Courses
          </Link>{" "}
          / {course.title}
        </p>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {course.description && (
              <p className="mt-2 text-slate-600">{course.description}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to={`/c/${community.slug}`}
              className="text-sm text-slate-600 underline"
            >
              Back to community
            </Link>
            {isOwner && (
              <Link
                to={`/c/${community.slug}/courses/${course.slug}/lessons/new`}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Add lesson
              </Link>
            )}
          </div>
        </div>
      </header>

      {course.lessons.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-700">No lessons yet.</p>
          {isOwner ? (
            <Link
              to={`/c/${community.slug}/courses/${course.slug}/lessons/new`}
              className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Add the first lesson
            </Link>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              The owner of this community hasn't added any lessons yet.
            </p>
          )}
        </div>
      ) : (
        <ol className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {course.lessons.map((lesson, i) => (
            <li key={lesson.id}>
              <Link
                to={`/c/${community.slug}/courses/${course.slug}/lessons/${lesson.slug}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-xs text-slate-500">/{lesson.slug}</p>
                  </div>
                </div>
                <span className="text-sm text-slate-400">Open →</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
