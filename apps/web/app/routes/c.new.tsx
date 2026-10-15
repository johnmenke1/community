import {
  Form,
  Link,
  redirect,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/c.new";
import { apiFetch, requireUser } from "../lib/server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!name || !slug) {
    return { error: "Name and slug are required" };
  }
  const res = await apiFetch(request, "/api/communities", {
    method: "POST",
    body: JSON.stringify({
      name,
      slug,
      description: description || undefined,
    }),
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
  return redirect(`/c/${slug}`);
}

export default function NewCommunity({ actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New community</h1>
        <Link
          to="/c"
          className="text-sm text-slate-600 underline"
        >
          Back
        </Link>
      </header>
      <Form method="post" className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?"
            title="Lowercase letters, digits, dashes"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">
            Public URL: /c/<span>{`<slug>`}</span>
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="description">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        {actionData?.error && (
          <p className="text-sm text-red-600">{actionData.error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create community"}
        </button>
      </Form>
    </main>
  );
}
