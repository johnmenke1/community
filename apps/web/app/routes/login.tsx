import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { apiFetch, forwardSetCookies } from "../lib/server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/dashboard");
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  const res = await apiFetch(request, "/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { error: body || "Sign-in failed" };
  }
  // Forward the api's Set-Cookie (the session token) to the browser —
  // otherwise the session is created on the api but the browser stays
  // anonymous and the redirect lands on /login again.
  return redirect(next, { headers: forwardSetCookies(res) });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-bold">Log in</h1>
      <p className="mt-2 text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/signup" className="underline">
          Sign up
        </Link>
      </p>
      <Form method="post" className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </Form>
    </main>
  );
}
