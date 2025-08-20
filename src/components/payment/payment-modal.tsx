"use client";

import { useState, useEffect } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  quantity?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  products?: Product[];
  onSuccess: (paymentResult: any) => void;
}

export function PaymentModal({ isOpen, onClose, product, products }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 단일 상품을 배열로 변환
  const items = products || (product ? [product] : []);

  const handlePayment = async () => {
    if (!isOpen || items.length === 0) return;

    setIsLoading(true);

    try {
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"
      );

      const totalAmount = items.reduce((sum, item) => 
        sum + (item.price * (item.quantity || 1)), 0
      );

      const orderName = items.length === 1 
        ? items[0].name 
        : `${items[0].name} 외 ${items.length - 1}개`;

      const query = new URLSearchParams({
        amount: String(totalAmount),
        orderName,
        items: encodeURIComponent(JSON.stringify(items.map(i => ({ id: i.id, quantity: i.quantity || 1, price: i.price }))))
      }).toString();

      await tossPayments.requestPayment("카드", {
        amount: totalAmount,
        orderId: `order_${Date.now()}`,
        orderName,
        customerName: "구매자",
        customerEmail: "customer@example.com",
        successUrl: `${window.location.origin}/payment/success?${query}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error("결제 오류:", error);
      alert("결제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handlePayment();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => 
    sum + (item.price * (item.quantity || 1)), 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">결제 진행 중</h2>
        
        {items.length === 1 ? (
          <div className="mb-4">
            <p className="text-gray-600 mb-2">상품: {items[0].name}</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(totalAmount)}
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-gray-600 mb-2">상품 목록:</p>
            <div className="space-y-2 mb-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} {item.quantity && item.quantity > 1 ? `× ${item.quantity}` : ''}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.price * (item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>총 금액:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">결제창을 여는 중...</p>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handlePayment} className="flex-1">
              다시 시도
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 