import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("health", "routes/health.ts"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("resumes/new", "routes/resumes.new.tsx"),
  route("resumes/:id/edit", "routes/resumes.$id.edit.tsx"),
  route("resumes/:id/share", "routes/resumes.$id.share.tsx"),
  route("resumes/:id/export.json", "routes/resumes.$id.export.json.ts"),
  route("resumes/:id/preview-data", "routes/resumes.$id.preview-data.ts"),
  route("r/:slug", "routes/r.$slug.tsx"),
  route("build", "routes/build.tsx"),
  route("logout", "routes/logout.ts"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
