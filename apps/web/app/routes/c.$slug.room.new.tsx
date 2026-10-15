import {
  Form,
  Link,
  redirect,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/c.$slug.room.new";
import { apiFetch, requireUser } from "../lib/server";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request);
  return { slug: params.slug! };
}

export async function action({ request, params }: Route.ActionArgs) {
  const slug = params.slug!;
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Room name is required" };
  const res = await apiFetch(request, `/api/communities/${slug}/rooms`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    let msg = `Create failed (${res.status})`;
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      // ignore
    }
    return { error: msg };
  }
  const room = (await res.json()) as { id: string };
  return redirect(`/c/${slug}/room/${room.id}`);
}

export default function NewRoom({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Start a room</h1>
        <Link to={`/c/${loaderData.slug}`} className="text-sm underline">
          Back
        </Link>
      </header>
      <Form method="post" className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="name">
            Room name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            placeholder="Office Hours"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        {actionData?.error && (
          <p className="text-sm text-red-600">{actionData.error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Starting…" : "Start room"}
        </button>
        <p className="text-xs text-slate-500">
          A RealtimeKit session is provisioned on first join. Requires
          CF_REALTIMEKIT_TOKEN to be set on the API.
        </p>
      </Form>
    </main>
  );
}
