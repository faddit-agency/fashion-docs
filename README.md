# Fashion Docs - 패션 문서 관리 플랫폼

이 프로젝트는 [Next.js](https://nextjs.org)로 구축된 패션 문서 관리 플랫폼입니다.

## 환경 설정

프로젝트를 실행하기 전에 다음 환경변수를 설정해야 합니다:

1. `.env.local` 파일을 프로젝트 루트에 생성하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Admin 설정 (서버 사이드에서만 사용)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 기타 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Supabase 프로젝트를 생성하고 위의 값들을 설정하세요.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
