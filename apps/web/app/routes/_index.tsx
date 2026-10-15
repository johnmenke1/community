import { Link } from "react-router";

export function meta() {
  return [
    { title: "Community" },
    { name: "description", content: "A self-hostable community platform" },
  ];
}

export default function Index() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-5xl font-bold tracking-tight">Community</h1>
      <p className="mt-6 text-lg text-slate-600">
        Live audio/video rooms, communities, posts, and courses — all in one
        self-hostable platform.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        v0.1 foundation — auth, health checks, and a Realtime stub. Realtime
        wiring, communities, feed, courses, and payments land in commit 2.
      </p>
      <div className="mt-10 flex gap-3">
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
      </div>
    </main>
  );
}
