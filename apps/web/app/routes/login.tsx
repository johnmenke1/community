import { useState } from "react";
import { Form, Link, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { error: body || "Sign-in failed" };
  }
  // Forward Set-Cookie headers to the browser on this response
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    // react-router v8 will forward response cookies; we just redirect.
  }
  return redirect("/dashboard", {
    headers: setCookie ? { "set-cookie": setCookie } : undefined,
  });
}

export default function Login() {
  const data = useActionData<typeof action>();
  const [submitting, setSubmitting] = useState(false);
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-bold">Log in</h1>
      <p className="mt-2 text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/signup" className="underline">
          Sign up
        </Link>
      </p>
      <Form
        method="post"
        className="mt-8 space-y-4"
        onSubmit={() => setSubmitting(true)}
      >
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
        {data?.error && (
          <p className="text-sm text-red-600">{data.error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </Form>
    </main>
  );
}
