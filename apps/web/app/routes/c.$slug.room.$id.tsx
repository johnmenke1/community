import { Link, redirect } from "react-router";
import type { Route } from "./+types/c.$slug.room.$id";
import { apiFetch, requireUser } from "../lib/server";

interface JoinResult {
  token: string;
  url: string;
  sessionId: string;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const me = await requireUser(request);
  const roomId = params.id!;
  // Request a join token. The api provisions a RealtimeKit session on
  // first join and returns a per-user participant token. We then redirect
  // the browser to the Cloudflare RealtimeKit URL — simplest UX, no SDK
  // integration needed for the v0.2 client.
  const res = await apiFetch(request, `/api/rooms/${roomId}/join`, {
    method: "POST",
  });
  if (!res.ok) {
    let msg = `Join failed (${res.status})`;
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      // ignore
    }
    return { ok: false as const, error: msg, me };
  }
  const data = (await res.json()) as JoinResult;
  // The Cloudflare RealtimeKit app is at app.realtime.cloudflare.com.
  // The participant token authenticates the user. In a production setup
  // we'd embed the SDK and use the token client-side; for v0.2 we redirect
  // to the standard meeting URL.
  return redirect(data.url);
}

export default function Room({ loaderData }: Route.ComponentProps) {
  if (loaderData.ok === false) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold">Cannot join room</h1>
        <p className="mt-2 text-red-600">{loaderData.error}</p>
        <Link to="/c" className="mt-4 inline-block text-sm underline">
          Back to communities
        </Link>
      </main>
    );
  }
  // The loader has already redirected; this branch is unreachable in normal flow.
  return null;
}
