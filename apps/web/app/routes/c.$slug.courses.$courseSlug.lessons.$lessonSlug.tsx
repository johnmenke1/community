import { Link } from "react-router";
import type { Route } from "./+types/c.$slug.courses.$courseSlug.lessons.$lessonSlug";
import { apiFetch, getUser } from "../lib/server";
import { renderMarkdown } from "../lib/markdown.server";

interface LessonRef {
  id: string;
  slug: string;
  title: string;
  order: string;
}

interface Lesson {
  id: string;
  slug: string;
  title: string;
  order: string;
  content: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
  };
  prev: LessonRef | null;
  next: LessonRef | null;
}

interface Community {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const me = await getUser(request);
  const communitySlug = params.slug!;
  const courseSlug = params.courseSlug!;
  const lessonSlug = params.lessonSlug!;

  if (!me) {
    return { kind: "guest" as const, slug: communitySlug };
  }

  // Three parallel fetches: community (for nav + owner check), course
  // (for the sidebar), lesson (for content + prev/next).
  const [communityRes, courseRes, lessonRes] = await Promise.all([
    apiFetch(request, `/api/communities/${communitySlug}`),
    apiFetch(
      request,
      `/api/communities/${communitySlug}/courses/${courseSlug}`
    ),
    apiFetch(
      request,
      `/api/communities/${communitySlug}/courses/${courseSlug}/lessons/${lessonSlug}`
    ),
  ]);

  if (communityRes.status === 404 || courseRes.status === 404 || lessonRes.status === 404) {
    throw new Response("Not found", { status: 404 });
  }
  if (communityRes.status === 403 || courseRes.status === 403 || lessonRes.status === 403) {
    return { kind: "non-member" as const, slug: communitySlug };
  }
  if (!communityRes.ok) {
    throw new Response("Failed to load community", { status: 502 });
  }
  if (!courseRes.ok) {
    throw new Response("Failed to load course", { status: 502 });
  }
  if (!lessonRes.ok) {
    throw new Response("Failed to load lesson", { status: 502 });
  }

  const community = (await communityRes.json()) as Community;
  const course = (await courseRes.json()) as {
    lessons: LessonRef[];
  };
  const lesson = (await lessonRes.json()) as Lesson;

  // Render the markdown to a sanitized HTML string on the server.
  // The HTML is safe to inject — see lib/markdown.server.ts.
  const html = renderMarkdown(lesson.content);

  return {
    kind: "member" as const,
    community,
    course: { slug: courseSlug, title: lesson.course.title, lessons: course.lessons },
    lesson,
    html,
    isOwner: community.ownerId === me.id,
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (data && data.kind === "member") {
    return [{ title: `${data.lesson.title} — ${data.course.title}` }];
  }
  return [{ title: "Lesson" }];
}

export default function LessonPlayer({ loaderData }: Route.ComponentProps) {
  if (loaderData.kind === "guest") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Lesson</h1>
        <p className="mt-2 text-slate-600">
          <Link to={`/login?next=/c/${loaderData.slug}`} className="underline">
            Log in
          </Link>{" "}
          to view this lesson.
        </p>
      </main>
    );
  }
  if (loaderData.kind === "non-member") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-slate-600">Join this community to view its lessons.</p>
        <Link to="/c" className="mt-4 inline-block text-sm underline">
          Browse communities
        </Link>
      </main>
    );
  }
  const { community, course, lesson, html, isOwner } = loaderData;
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-12">
      {/* Sidebar — lesson list for the course */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-8">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Course
          </p>
          <p className="mt-1 font-semibold">{course.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            <Link
              to={`/c/${community.slug}/courses/${course.slug}`}
              className="underline"
            >
              ← Course overview
            </Link>
          </p>
          <ol className="mt-6 space-y-1">
            {course.lessons.map((l, i) => {
              const isCurrent = l.id === lesson.id;
              return (
                <li key={l.id}>
                  <Link
                    to={`/c/${community.slug}/courses/${course.slug}/lessons/${l.slug}`}
                    className={
                      isCurrent
                        ? "block rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                        : "block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    }
                  >
                    <span className="mr-2 text-xs text-slate-400">{i + 1}</span>
                    {l.title}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>

      {/* Main player column */}
      <article className="min-w-0 flex-1">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm text-slate-500">
            <Link to={`/c/${community.slug}`} className="underline">
              /c/{community.slug}
            </Link>{" "}
            /{" "}
            <Link
              to={`/c/${community.slug}/courses/${course.slug}`}
              className="underline"
            >
              {course.title}
            </Link>{" "}
            / {lesson.title}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{lesson.title}</h1>
          {isOwner && (
            <p className="mt-2 text-xs text-slate-400">
              You own this course. Edit lessons via{" "}
              <code>POST /api/communities/.../lessons</code>.
            </p>
          )}
        </header>

        {/* Lesson content. The HTML has been sanitized server-side. */}
        <div
          className="prose mt-8 max-w-none prose-slate prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-code:before:hidden prose-code:after:hidden"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Prev / next nav */}
        <nav className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
          {lesson.prev ? (
            <Link
              to={`/c/${community.slug}/courses/${course.slug}/lessons/${lesson.prev.slug}`}
              className="group rounded-md border border-slate-300 bg-white px-4 py-3 text-sm hover:bg-slate-50"
            >
              <span className="block text-xs text-slate-500">← Previous</span>
              <span className="mt-1 block font-medium text-slate-900 group-hover:underline">
                {lesson.prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {lesson.next ? (
            <Link
              to={`/c/${community.slug}/courses/${course.slug}/lessons/${lesson.next.slug}`}
              className="group rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-right hover:bg-slate-50"
            >
              <span className="block text-xs text-slate-500">Next →</span>
              <span className="mt-1 block font-medium text-slate-900 group-hover:underline">
                {lesson.next.title}
              </span>
            </Link>
          ) : (
            <Link
              to={`/c/${community.slug}/courses/${course.slug}`}
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm hover:bg-slate-50"
            >
              <span className="block text-xs text-slate-500">End of course</span>
              <span className="mt-1 block font-medium text-slate-900">
                Back to overview
              </span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
}
