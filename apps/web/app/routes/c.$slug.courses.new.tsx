import {
  Form,
  Link,
  redirect,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/c.$slug.courses.new";
import { apiFetch, requireUser } from "../lib/server";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request);
  return { slug: params.slug! };
}

export async function action({ request, params }: Route.ActionArgs) {
  const slug = params.slug!;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const courseSlug = String(form.get("slug") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!title || !courseSlug) {
    return { error: "Title and slug are required" };
  }
  const res = await apiFetch(
    request,
    `/api/communities/${slug}/courses`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        slug: courseSlug,
        description: description || undefined,
      }),
    }
  );
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
  return redirect(`/c/${slug}/courses/${courseSlug}`);
}

export default function NewCourse({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New course</h1>
        <Link to={`/c/${loaderData.slug}/courses`} className="text-sm underline">
          Back
        </Link>
      </header>
      <Form method="post" className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={120}
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
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
          {busy ? "Creating…" : "Create course"}
        </button>
      </Form>
    </main>
  );
}
