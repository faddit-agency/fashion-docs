'use client';

import { SignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function SignUpPage() {
  const { user } = useClerk();

  // GTM 이벤트 전송 함수
  const pushGTMEvent = (eventName: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName
      });
      console.log(`${eventName} event pushed to dataLayer`);
    }
  };

  // 사용자가 로그인되면 sign_up 이벤트 전송
  useEffect(() => {
    if (user) {
      // 새로 가입한 사용자인지 확인 (createdAt이 최근인 경우)
      const userCreatedAt = new Date(user.createdAt);
      const now = new Date();
      const timeDiff = now.getTime() - userCreatedAt.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // 5분 이내에 생성된 사용자라면 회원가입으로 간주
      if (minutesDiff <= 5) {
        pushGTMEvent('sign_up');
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Faddit</h1>
          <p className="text-muted-foreground">의류 제작을 위한 도식화와 패턴 커머스</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border-0 bg-card",
              headerTitle: "text-2xl font-bold text-foreground",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary: "bg-primary hover:bg-primary/90",
              footerActionLink: "text-primary hover:text-primary/80"
            }
          }}
        />
      </div>
    </div>
  );
}

