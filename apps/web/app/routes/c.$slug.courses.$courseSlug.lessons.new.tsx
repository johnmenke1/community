import {
  Form,
  Link,
  redirect,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/c.$slug.courses.$courseSlug.lessons.new";
import { apiFetch, requireUser } from "../lib/server";

export async function loader({ request, params }: Route.LoaderArgs) {
  // requireUser handles the unauthenticated case; the api's role guard
  // (admin/owner) will reject non-owners with 403 if they somehow get here.
  await requireUser(request);
  return {
    slug: params.slug!,
    courseSlug: params.courseSlug!,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const slug = params.slug!;
  const courseSlug = params.courseSlug!;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const lessonSlug = String(form.get("slug") ?? "").trim();
  const orderRaw = String(form.get("order") ?? "0").trim();
  const content = String(form.get("content") ?? "");

  if (!title || !lessonSlug) {
    return { error: "Title and slug are required" };
  }
  if (orderRaw && !/^\d+$/.test(orderRaw)) {
    return { error: "Order must be a non-negative integer" };
  }

  const res = await apiFetch(
    request,
    `/api/communities/${slug}/courses/${courseSlug}/lessons`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        slug: lessonSlug,
        order: orderRaw || "0",
        content: content || undefined,
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
  return redirect(
    `/c/${slug}/courses/${courseSlug}/lessons/${lessonSlug}`
  );
}

export default function NewLesson({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New lesson</h1>
        <Link
          to={`/c/${loaderData.slug}/courses/${loaderData.courseSlug}`}
          className="text-sm underline"
        >
          Back
        </Link>
      </header>
      <p className="mt-2 text-sm text-slate-500">
        Content is rendered as GitHub-flavored markdown. Headings, lists, code
        blocks, links, and emphasis are supported. HTML in your content is
        stripped for safety.
      </p>
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
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium" htmlFor="order">
              Order
            </label>
            <input
              id="order"
              name="order"
              type="number"
              min="0"
              defaultValue="0"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              0 = first. Smaller numbers come first.
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="content">
            Content (markdown)
          </label>
          <textarea
            id="content"
            name="content"
            rows={14}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder={`# Lesson 1\n\nWelcome to the course. In this lesson we'll cover...\n\n- What is X?\n- Why X matters\n- A short example\n\n\`\`\`js\nconsole.log("hello world")\n\`\`\`\n`}
          />
          <p className="mt-1 text-xs text-slate-500">
            Max 100,000 characters. Markdown supports headings, lists, code
            blocks, links, bold/italic, tables.
          </p>
        </div>
        {actionData?.error && (
          <p className="text-sm text-red-600">{actionData.error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Link
            to={`/c/${loaderData.slug}/courses/${loaderData.courseSlug}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create lesson"}
          </button>
        </div>
      </Form>
    </main>
  );
}
