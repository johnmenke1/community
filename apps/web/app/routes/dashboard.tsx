import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/dashboard";
import { apiFetch, requireUser } from "../lib/server";

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  role: "owner" | "admin" | "member";
  memberCount: number;
  createdAt: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const me = await requireUser(request);
  // Pull the user's communities. Tolerate errors so a transient api hiccup
  // doesn't redirect the user back to /login.
  let communities: Community[] = [];
  try {
    const res = await apiFetch(request, "/api/communities/mine");
    if (res.ok) communities = (await res.json()) as Community[];
  } catch {
    // ignore
  }
  return { me, communities };
}

export async function action({ request }: Route.ActionArgs) {
  await apiFetch(request, "/api/auth/sign-out", { method: "POST" });
  return redirect("/");
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { me, communities } = loaderData;
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Form method="post">
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Log out
          </button>
        </Form>
      </header>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Signed in as
        </h2>
        <p className="mt-2 text-2xl font-semibold">{me.name}</p>
        <p className="mt-1 text-slate-600">{me.email}</p>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Your communities
          </h2>
          <div className="flex gap-2">
            <Link
              to="/c"
              className="text-sm underline"
            >
              Browse all
            </Link>
            <Link
              to="/c/new"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              New community
            </Link>
          </div>
        </div>
        {communities.length === 0 ? (
          <p className="mt-4 text-slate-500">
            You're not in any communities yet.{" "}
            <Link to="/c" className="underline">
              Browse communities
            </Link>{" "}
            or create one.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {communities.map((c) => (
              <li key={c.id} className="py-3">
                <Link to={`/c/${c.slug}`} className="block hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-slate-500">
                        {c.description ?? "No description"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className="rounded bg-slate-100 px-2 py-0.5 uppercase">
                        {c.role}
                      </p>
                      <p className="mt-1">{c.memberCount} members</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
