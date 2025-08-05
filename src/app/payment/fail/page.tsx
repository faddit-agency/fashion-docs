"use client";

import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h1>
            <p className="text-gray-600">다시 시도해주세요.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">오류 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호:</span>
                <span className="font-medium">{orderId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">오류코드:</span>
                <span className="font-medium">{code || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">오류메시지:</span>
                <span className="font-medium text-xs">{message || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button className="w-full" asChild>
              <Link href="/products">
                다시 쇼핑하기
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/mypage">
                마이페이지로 이동
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 