"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const itemsParam = searchParams.get("items");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo<Array<{ id: number; quantity: number; price: number }>>(() => {
    if (!itemsParam) return [];
    try {
      return JSON.parse(decodeURIComponent(itemsParam)) as Array<{ id: number; quantity: number; price: number }>;
    } catch {
      return [];
    }
  }, [itemsParam]);

  useEffect(() => {
    const confirm = async () => {
      try {
        // 임시 사용자 ID: 실제로는 세션에서 조회
        const userId = "user1";
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), userId, items: items.map((it: { id: number; quantity: number; price: number }) => ({ productId: it.id, quantity: it.quantity, price: it.price })) })
        });
        if (!res.ok) {
          throw new Error("결제 확인 실패");
        }
        setConfirmed(true);
      } catch (e: any) {
        setError(e.message || "결제 확인 중 오류가 발생했습니다.");
      }
    };
    if (amount && items.length > 0) {
      confirm();
    }
  }, [paymentKey, orderId, amount, items]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h1>
            <p className="text-gray-600">구매해주셔서 감사합니다.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호:</span>
                <span className="font-medium">{orderId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제금액:</span>
                <span className="font-medium">{amount ? `${Number(amount).toLocaleString()}원` : "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제키:</span>
                <span className="font-medium text-xs">{paymentKey || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            {!error && !confirmed && (
              <div className="p-3 rounded bg-yellow-50 text-yellow-700 text-sm">결제 확인 중입니다...</div>
            )}
            <Button className="w-full" asChild>
              <Link href="/mypage">
                구매 내역 확인
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/products">
                계속 쇼핑하기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
} 