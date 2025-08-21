"use client";

import { useState } from "react";
import { Button } from "./button";
import { Gift, X, Check } from "lucide-react";

interface PromotionCodeInputProps {
  onCodeApplied: (code: string, discount: number) => void;
  onCodeRemoved: () => void;
  appliedCode?: string;
  discount?: number;
  isPromotionProduct?: boolean; // 프로모션 상품 여부
}

export function PromotionCodeInput({
  onCodeApplied,
  onCodeRemoved,
  appliedCode,
  discount,
  isPromotionProduct = false
}: PromotionCodeInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  const validatePromotionCode = async (promoCode: string) => {
    // 프로모션 코드 검증 로직
    const validCodes = {
      "FADDIT2025": 0.5, // 50% 할인 (프로모션 상품 전용)
    };

    return new Promise<{ valid: boolean; discount?: number }>((resolve) => {
      setTimeout(() => {
        // 프로모션 상품이 아닌 경우 코드 적용 불가
        if (!isPromotionProduct) {
          resolve({
            valid: false,
            discount: undefined
          });
          return;
        }
        
        const discount = validCodes[promoCode as keyof typeof validCodes];
        resolve({
          valid: !!discount,
          discount
        });
      }, 1000);
    });
  };

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("프로모션 코드를 입력해주세요.");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      const result = await validatePromotionCode(code.toUpperCase());
      
      if (result.valid && result.discount) {
        onCodeApplied(code.toUpperCase(), result.discount);
        setCode("");
      } else {
        if (!isPromotionProduct) {
          setError("프로모션 코드는 프로모션 상품에서만 사용할 수 있습니다.");
        } else {
          setError("유효하지 않은 프로모션 코드입니다.");
        }
      }
    } catch (err) {
      setError("코드 검증 중 오류가 발생했습니다.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCode = () => {
    onCodeRemoved();
  };

  return (
    <div className="space-y-3">
      {appliedCode ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              프로모션 코드 적용됨: {appliedCode}
            </span>
            {discount && (
              <span className="text-xs text-green-600">
                ({Math.round(discount * 100)}% 할인)
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCode}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={isPromotionProduct ? "FADDIT2025 입력" : "프로모션 상품에서만 사용 가능"}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isValidating || !isPromotionProduct}
              />
            </div>
            <Button
              onClick={handleApplyCode}
              disabled={isValidating || !code.trim() || !isPromotionProduct}
              className="px-4 py-2"
            >
              {isValidating ? "확인 중..." : "적용"}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
