import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/c._index";
import { apiFetch, requireUser } from "../lib/server";

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  role: "owner" | "admin" | "member" | null;
  memberCount: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  // For now, list ALL communities (no global search). The "Browse all"
  // view is the directory; users can join any.
  // The api has no /api/communities list endpoint yet, so derive from mine
  // and offer a fallback "no communities yet" message. (Commit 3 will add
  // a proper list endpoint.)
  let communities: Community[] = [];
  try {
    const res = await apiFetch(request, "/api/communities/mine");
    if (res.ok) communities = (await res.json()) as Community[];
  } catch {
    // ignore
  }
  return { communities };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  if (!slug) return { error: "Missing slug" };
  const res = await apiFetch(request, `/api/communities/${slug}/join`, {
    method: "POST",
  });
  if (!res.ok) {
    return { error: `Join failed: ${res.status}` };
  }
  return redirect(`/c/${slug}`);
}

export default function CommunitiesList({ loaderData }: Route.ComponentProps) {
  const { communities } = loaderData;
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Communities</h1>
        <div className="flex gap-2">
          <Link
            to="/dashboard"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Back
          </Link>
          <Link
            to="/c/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            New community
          </Link>
        </div>
      </header>

      {communities.length === 0 ? (
        <p className="mt-8 text-slate-500">
          You haven't joined any communities yet. Create the first one.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {communities.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-slate-500">/c/{c.slug}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {c.description ?? "No description"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.role ? (
                  <Link
                    to={`/c/${c.slug}`}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Open
                  </Link>
                ) : (
                  <Form method="post">
                    <input type="hidden" name="slug" value={c.slug} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy ? "Joining…" : "Join"}
                    </button>
                  </Form>
                )}
                <p className="text-xs text-slate-500">
                  {c.memberCount} members
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
