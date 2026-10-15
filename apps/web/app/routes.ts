import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("logout", "routes/logout.tsx"),
  // Communities
  route("c", "routes/c._index.tsx"),
  route("c/new", "routes/c.new.tsx"),
  route("c/:slug", "routes/c.$slug._index.tsx"),
  route("c/:slug/courses", "routes/c.$slug.courses._index.tsx"),
  route("c/:slug/courses/new", "routes/c.$slug.courses.new.tsx"),
  route("c/:slug/courses/:courseSlug", "routes/c.$slug.courses.$courseSlug.tsx"),
  route("c/:slug/room/new", "routes/c.$slug.room.new.tsx"),
  route("c/:slug/room/:id", "routes/c.$slug.room.$id.tsx"),
] satisfies RouteConfig;
