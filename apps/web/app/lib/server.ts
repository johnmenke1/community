/**
 * Server-side helpers for the web app. Anything imported from this module
 * (or any module that imports it) is excluded from the client bundle by
 * React Router v8's `.server` convention — see `react-router.config.ts`.
 *
 * Use this for fetch wrappers that need to talk to the API on the server,
 * cookie forwarding, and the canonical `getUser()` helper used by every
 * authenticated loader.
 */

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Returns the current user, or `null` if the request has no valid session.
 * The dashboard loader uses this to decide whether to redirect to /login.
 *
 * This is a defensive wrapper: on any error (network down, 500, malformed
 * payload, non-JSON response) we return null instead of throwing, so the
 * dashboard always has a clean "no session" path.
 */
export async function getUser(request: Request): Promise<SessionUser | null> {
  const cookie = request.headers.get("cookie") ?? "";
  try {
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as SessionUser;
    return user;
  } catch {
    return null;
  }
}

/**
 * Returns the current user, or throws a redirect to /login.
 * Use this in loaders that require authentication.
 */
export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getUser(request);
  if (!user) {
    const url = new URL(request.url);
    const next = encodeURIComponent(url.pathname + url.search);
    throw new Response(null, {
      status: 302,
      headers: { Location: `/login?next=${next}` },
    });
  }
  return user;
}

/**
 * Forwards a `fetch` to the API with the request's cookies attached.
 * Returns a clean Response — never throws on HTTP errors.
 */
export async function apiFetch(
  request: Request,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const cookie = request.headers.get("cookie") ?? "";
  const headers = new Headers(init.headers);
  headers.set("cookie", cookie);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // The api may also need an Origin header (better-auth CSRF check). In
  // SSR we use BETTER_AUTH_URL so the api trusts us as the web app.
  if (!headers.has("Origin")) {
    headers.set("Origin", process.env.BETTER_AUTH_URL ?? "http://localhost:3000");
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

export { API_URL };

/**
 * Extracts Set-Cookie headers from an api Response so the action can
 * forward them to the browser. Without this, signing in via the web
 * action (which calls better-auth on the api) would create a session
 * on the api but never set the cookie on the user's browser.
 *
 * Usage:
 *   const res = await apiFetch(request, "/api/auth/sign-in/email", {...});
 *   if (!res.ok) return { error: await res.text() };
 *   return redirect(next, { headers: forwardSetCookies(res) });
 */
export function forwardSetCookies(apiResponse: Response): Headers {
  const out = new Headers();
  // getSetCookie() returns an array of every Set-Cookie value, even when
  // multiple were set. It's the spec-blessed way to read them (the
  // header is intentionally not comma-joined because dates can contain
  // commas). Node 20+ and modern browsers both support it.
  const setCookies =
    typeof apiResponse.headers.getSetCookie === "function"
      ? apiResponse.headers.getSetCookie()
      : (apiResponse.headers.get("set-cookie")
          ? [apiResponse.headers.get("set-cookie") as string]
          : []);
  for (const c of setCookies) {
    if (c) out.append("Set-Cookie", c);
  }
  return out;
}
