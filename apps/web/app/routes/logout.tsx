import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";

const API = process.env.API_BASE_URL ?? "http://localhost:3001";

export async function action({ request }: ActionFunctionArgs) {
  const cookie = request.headers.get("cookie") ?? "";
  await fetch(`${API}/api/auth/sign-out`, {
    method: "POST",
    headers: { cookie, "Content-Type": "application/json" },
  });
  // Clear the better-auth session cookie by setting it to empty + expired.
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "better-auth.session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  );
  return redirect("/", { headers });
}

export async function loader() {
  return redirect("/");
}
