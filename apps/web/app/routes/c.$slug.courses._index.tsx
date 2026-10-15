import { Link } from "react-router";
import type { Route } from "./+types/c.$slug.courses._index";
import { apiFetch, getUser } from "../lib/server";

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
}

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
  const [communityRes, coursesRes] = await Promise.all([
    apiFetch(request, `/api/communities/${params.slug}`),
    apiFetch(request, `/api/communities/${params.slug}/courses`),
  ]);
  if (!communityRes.ok) {
    if (communityRes.status === 403) return { kind: "non-member" as const, slug: params.slug! };
    if (communityRes.status === 404) throw new Response("Not found", { status: 404 });
    throw new Response("Failed to load community", { status: 502 });
  }
  const community = (await communityRes.json()) as Community;
  const courses = coursesRes.ok
    ? ((await coursesRes.json()) as Course[])
    : [];
  return {
    kind: "member" as const,
    community,
    courses,
    isOwner: community.ownerId === me.id,
  };
}

export default function CourseList({ loaderData }: Route.ComponentProps) {
  if (loaderData.kind === "guest") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="mt-2 text-slate-600">
          <Link to={`/login?next=/c/${loaderData.slug}/courses`} className="underline">
            Log in
          </Link>{" "}
          to view courses.
        </p>
      </main>
    );
  }
  if (loaderData.kind === "non-member") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="mt-2 text-slate-600">
          Join this community to see its courses.
        </p>
        <Link to="/c" className="mt-4 inline-block text-sm underline">
          Browse communities
        </Link>
      </main>
    );
  }
  const { community, courses, isOwner } = loaderData;
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">/c/{community.slug}/courses</p>
          <h1 className="mt-1 text-3xl font-bold">Courses</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/c/${community.slug}`} className="text-sm underline">
            Back
          </Link>
          {isOwner && (
            <Link
              to={`/c/${community.slug}/courses/new`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              New course
            </Link>
          )}
        </div>
      </header>
      {courses.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">No courses yet.</p>
          {isOwner && (
            <Link
              to={`/c/${community.slug}/courses/new`}
              className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create the first course
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {courses.map((c) => (
            <li key={c.id} className="p-4">
              <Link to={`/c/${community.slug}/courses/${c.slug}`} className="block">
                <p className="font-semibold">{c.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {c.description ?? "No description"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
