import {
  Form,
  Link,
  redirect,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/c.$slug._index";
import { apiFetch, getUser } from "../lib/server";

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string;
}

interface Post {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  reactionCount: number;
  viewerReacted: boolean;
}

interface ListResponse {
  items: Post[];
  nextCursor: string | null;
  community: Community;
}

interface Room {
  id: string;
  name: string;
  createdAt: string;
  realtimeKitSessionId: string | null;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const me = await getUser(request);
  const slug = params.slug!;
  // Members-only content. If not signed in, redirect to /login with ?next=.
  if (!me) {
    return redirect(`/login?next=${encodeURIComponent(`/c/${slug}`)}`);
  }
  // Fetch community + posts + rooms in parallel.
  const [communityRes, postsRes, roomsRes] = await Promise.all([
    apiFetch(request, `/api/communities/${slug}`),
    apiFetch(request, `/api/communities/${slug}/posts`),
    apiFetch(request, `/api/communities/${slug}/rooms`),
  ]);
  if (communityRes.status === 404) {
    throw new Response("Community not found", { status: 404 });
  }
  if (!communityRes.ok) {
    // 403 means we're not a member; 401 means session expired.
    if (communityRes.status === 401) {
      return redirect("/login");
    }
    if (communityRes.status === 403) {
      return {
        kind: "non-member" as const,
        community: (await communityRes.json()) as { message?: string },
        slug,
      };
    }
    throw new Response(`Failed to load community (${communityRes.status})`, {
      status: 502,
    });
  }
  const community = (await communityRes.json()) as Community;
  const posts = postsRes.ok
    ? ((await postsRes.json()) as ListResponse)
    : { items: [], nextCursor: null, community };
  const rooms = roomsRes.ok ? ((await roomsRes.json()) as Room[]) : [];
  return {
    kind: "member" as const,
    community,
    posts: posts.items,
    rooms,
    isOwner: community.ownerId === me.id,
    me,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const slug = params.slug!;
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "post") {
    const body = String(form.get("body") ?? "").trim();
    if (!body) return { error: "Post body is required" };
    const res = await apiFetch(request, `/api/communities/${slug}/posts`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return { error: `Post failed (${res.status})` };
    return null;
  }
  if (intent === "react") {
    const postId = String(form.get("postId") ?? "");
    if (!postId) return { error: "Missing post id" };
    const res = await apiFetch(request, `/api/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ kind: "like" }),
    });
    if (!res.ok) return { error: `React failed (${res.status})` };
    return null;
  }
  if (intent === "leave") {
    const res = await apiFetch(request, `/api/communities/${slug}/leave`, {
      method: "POST",
    });
    if (!res.ok) return { error: `Leave failed (${res.status})` };
    return redirect("/c");
  }
  return { error: "Unknown action" };
}

export default function CommunityHome({ loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  if (loaderData.kind === "non-member") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">/c/{loaderData.slug}</h1>
        <p className="mt-4 text-slate-600">
          You're not a member of this community yet.
        </p>
        <Form method="post" className="mt-4">
          <input type="hidden" name="intent" value="" />
          <button
            type="button"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={() => (window.location.href = `/c`)}
          >
            Browse communities
          </button>
        </Form>
        <Link
          to="/c"
          className="mt-4 inline-block text-sm underline"
        >
          Browse communities
        </Link>
      </main>
    );
  }
  const { community, posts, rooms, isOwner, me } = loaderData;
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">/c/{community.slug}</p>
          <h1 className="mt-1 text-3xl font-bold">{community.name}</h1>
          <p className="mt-2 text-slate-600">
            {community.description ?? "No description"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            to="/dashboard"
            className="text-sm text-slate-600 underline"
          >
            Dashboard
          </Link>
          <Link
            to={`/c/${community.slug}/courses`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Courses
          </Link>
          <Form method="post">
            <input type="hidden" name="intent" value="leave" />
            <button
              type="submit"
              disabled={busy || isOwner}
              title={isOwner ? "Owners cannot leave" : ""}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {busy ? "Leaving…" : "Leave community"}
            </button>
          </Form>
        </div>
      </header>

      {/* Rooms (live audio/video) */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Live rooms
          </h2>
          {isOwner && (
            <Link
              to={`/c/${community.slug}/room/new`}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Start a room
            </Link>
          )}
        </div>
        {rooms.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No rooms yet.
            {isOwner
              ? ' Click "Start a room" to spin one up.'
              : ""}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200">
            {rooms.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">
                    Created {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <Form method="post" action={`/c/${community.slug}/room/${r.id}`}>
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Join
                  </button>
                </Form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Posts feed */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Posts
        </h2>
        <Form method="post" className="mt-4 space-y-2">
          <input type="hidden" name="intent" value="post" />
          <textarea
            name="body"
            rows={3}
            required
            maxLength={10_000}
            placeholder={`What's on your mind, ${me.name}?`}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Posting…" : "Post"}
            </button>
          </div>
        </Form>
        <ul className="mt-6 divide-y divide-slate-200">
          {posts.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">
              No posts yet — be the first.
            </li>
          ) : (
            posts.map((p) => (
              <li key={p.id} className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{p.author.name}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-slate-800">
                  {p.body}
                </p>
                <Form method="post" className="mt-2">
                  <input type="hidden" name="intent" value="react" />
                  <input type="hidden" name="postId" value={p.id} />
                  <button
                    type="submit"
                    disabled={busy}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    {p.viewerReacted ? "♥" : "♡"} {p.reactionCount}
                  </button>
                </Form>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
