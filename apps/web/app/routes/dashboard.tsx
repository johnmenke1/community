import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/dashboard";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

interface MeResponse {
  id: string;
  email: string;
  name: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookie = request.headers.get("cookie") ?? "";
  // Validate session via the API's /api/users/me (which uses the auth guard)
  const meRes = await fetch(`${API_URL}/api/users/me`, {
    headers: { cookie },
  });
  if (meRes.status === 401) {
    return redirect("/login");
  }
  if (!meRes.ok) {
    // Forward to login on any auth failure
    return redirect("/login");
  }
  const me = (await meRes.json()) as MeResponse;

  // Realtime health (does not require auth)
  let realtimeConfigured = false;
  try {
    const r = await fetch(`${API_URL}/api/realtime/health`);
    if (r.ok) {
      const j = (await r.json()) as { configured: boolean };
      realtimeConfigured = Boolean(j.configured);
    }
  } catch {
    // ignore — show "not configured" if API is down
  }

  return { me, realtimeConfigured };
}

export async function action({ request }: Route.ActionArgs) {
  const cookie = request.headers.get("cookie") ?? "";
  await fetch(`${API_URL}/api/auth/sign-out`, {
    method: "POST",
    headers: { cookie },
  });
  return redirect("/login");
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { me, realtimeConfigured } = loaderData;
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
      <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Signed in as
        </h2>
        <p className="mt-2 text-2xl font-semibold">{me.name}</p>
        <p className="mt-1 text-slate-600">{me.email}</p>
      </section>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Realtime health
        </h2>
        <p className="mt-2 text-2xl font-semibold">
          {realtimeConfigured ? (
            <span className="text-emerald-600">configured</span>
          ) : (
            <span className="text-amber-600">not configured</span>
          )}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          RealtimeKit is stubbed in commit 1. Wire in commit 2.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          Back to home
        </Link>
      </section>
    </main>
  );
}
