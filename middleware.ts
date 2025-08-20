import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // 공개 라우트 (인증이 필요하지 않은 라우트)
  publicRoutes: [
    "/",
    "/products",
    "/products/(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
  ],
  // 무시할 라우트
  ignoredRoutes: [
    "/api/webhooks(.*)",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
