import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { apiFetch } from "../lib/server";

export async function action({ request }: Route.ActionArgs) {
  await apiFetch(request, "/api/auth/sign-out", { method: "POST" });
  return redirect("/");
}

export async function loader() {
  return redirect("/");
}
