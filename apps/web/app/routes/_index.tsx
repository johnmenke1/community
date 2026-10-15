import { Link } from "react-router";
import { getUser } from "../lib/server";
import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "Community" },
    { name: "description", content: "A self-hostable community platform" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const me = await getUser(request);
  return { me };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { me } = loaderData;
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-5xl font-bold tracking-tight">Community</h1>
      <p className="mt-6 text-lg text-slate-600">
        Live audio/video rooms, communities, posts, and courses — all in one
        self-hostable platform.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        v0.2 — auth, communities, posts feed, RealtimeKit rooms, course
        scaffolding. Stripe payments and email notifications are out of scope.
      </p>
      <div className="mt-10 flex gap-3">
        {me ? (
          <>
            <Link
              to="/dashboard"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              to="/c"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Communities
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
