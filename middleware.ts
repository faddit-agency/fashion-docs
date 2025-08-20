// 임시로 미들웨어 비활성화
export function middleware() {
  // 인증 로직은 각 페이지에서 처리
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
