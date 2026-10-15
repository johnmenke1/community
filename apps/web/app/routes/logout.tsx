import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { apiFetch, forwardSetCookies } from "../lib/server";

export async function action({ request }: Route.ActionArgs) {
  const res = await apiFetch(request, "/api/auth/sign-out", { method: "POST" });
  return redirect("/", { headers: forwardSetCookies(res) });
}

export async function loader() {
  return redirect("/");
}
