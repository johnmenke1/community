import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/signup";
import { apiFetch } from "../lib/server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "");
  if (!email || !password || !name) {
    return { error: "Name, email, and password are required" };
  }
  const res = await apiFetch(request, "/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { error: body || "Sign-up failed" };
  }
  return redirect("/dashboard");
}

export default function Signup() {
  const data = useActionData<typeof action>();
  const nav = useNavigation();
  const busy = nav.state === "submitting";
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-slate-500">
        Already have one?{" "}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>
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
            minLength={8}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        {data?.error && <p className="text-sm text-red-600">{data.error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Sign up"}
        </button>
      </Form>
    </main>
  );
}
