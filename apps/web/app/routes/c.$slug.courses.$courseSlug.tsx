import { Link } from "react-router";
import type { Route } from "./+types/c.$slug.courses.$courseSlug";
import { apiFetch, getUser } from "../lib/server";

interface Community {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const me = await getUser(request);
  if (!me) {
    return { kind: "guest" as const, slug: params.slug! };
  }
  // The course detail endpoint isn't in the api yet (commit 3 wiring).
  // For v0.2 we read the community and the course list separately so the
  // page renders something useful.
  const communityRes = await apiFetch(
    request,
    `/api/communities/${params.slug}`
  );
  if (!communityRes.ok) {
    if (communityRes.status === 404) throw new Response("Not found", { status: 404 });
    if (communityRes.status === 403) return { kind: "non-member" as const, slug: params.slug! };
    throw new Response("Failed to load community", { status: 502 });
  }
  const community = (await communityRes.json()) as Community;
  // The list endpoint doesn't return lessons either (api doesn't have
  // /api/communities/:slug/courses/:courseSlug yet). For v0.2 we show
  // an empty state with a clear "client builds the player" note.
  return {
    kind: "member" as const,
    community,
    courseSlug: params.courseSlug!,
    isOwner: community.ownerId === me.id,
  };
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
  const { community, courseSlug, isOwner } = loaderData;
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            /c/{community.slug}/courses/{courseSlug}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{courseSlug}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/c/${community.slug}/courses`} className="text-sm underline">
            Back
          </Link>
        </div>
      </header>
      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-slate-700">
          Course content UI is not yet built.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          The <code>lessons</code> table is provisioned in the schema and the
          API exposes <code>POST /api/communities/:slug/courses</code>,{" "}
          <code>POST /api/communities/:slug/courses/:courseSlug/lessons</code>,
          and <code>DELETE /api/communities/:slug/courses/:courseSlug</code>.
          The client team can build the player against these endpoints in
          commit 3.
        </p>
        {isOwner && (
          <p className="mt-4 text-xs text-slate-400">
            Use the API directly to add lessons via{" "}
            <code>POST /api/communities/{community.slug}/courses/{courseSlug}/lessons</code>.
          </p>
        )}
      </div>
    </main>
  );
}
