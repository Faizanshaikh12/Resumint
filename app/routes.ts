import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("health", "routes/health.ts"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("logout", "routes/logout.ts"),
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
