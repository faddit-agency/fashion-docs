"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment/payment-modal";
import { PromotionCodeInput } from "@/components/ui/promotion-code-input";
import { formatPrice } from "@/lib/utils";
import { promotionProduct } from "@/lib/sample-data";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ArrowLeft, 
  ShoppingCart, 
  Check,
  Gift,
  Package,
  Download,
  Users,
  Calendar,
  Sparkles
} from "lucide-react";

export default function PromotionProductPage() {
  const router = useRouter();
  const { user } = useUser();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const { updateCartCount } = useCart(user?.id);

  const handlePurchase = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log("결제 성공:", paymentResult);
    setShowPaymentModal(false);
    alert("결제가 완료되었습니다! 42개의 패턴/도식화가 드라이브에 자동으로 추가됩니다.");
    router.push("/mypage");
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/sign-in");
      return;
    }
    
    try {
      setCartLoading(true);
      setCartSuccess(false);
      
      // 장바구니 API 호출 (실제로는 cartAPI.addToCart 사용)
      setTimeout(() => {
        updateCartCount(1);
        setCartSuccess(true);
        setTimeout(() => setCartSuccess(false), 3000);
        setCartLoading(false);
      }, 1000);
    } catch (err) {
      console.error("장바구니 추가 오류:", err);
      alert("장바구니 추가에 실패했습니다.");
      setCartLoading(false);
    }
  };

  const handlePromoCodeApplied = (code: string, discount: number) => {
    setAppliedPromoCode(code);
    setPromoDiscount(discount);
  };

  const handlePromoCodeRemoved = () => {
    setAppliedPromoCode("");
    setPromoDiscount(0);
  };

  const nextImage = () => {
    if (!promotionProduct?.image_urls) return;
    setSelectedImage((prev) => 
      prev === promotionProduct.image_urls.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!promotionProduct?.image_urls) return;
    setSelectedImage((prev) => 
      prev === 0 ? promotionProduct.image_urls.length - 1 : prev - 1
    );
  };

  const subtotal = promotionProduct.price * quantity;
  const discountAmount = subtotal * promoDiscount;
  const totalPrice = subtotal - discountAmount;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">홈</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-foreground">상품</Link></li>
            <li>/</li>
            <li className="text-foreground">프로모션 패키지</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* 이미지 섹션 */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {promotionProduct?.image_urls && promotionProduct.image_urls.length > 0 ? (
                <>
                  <img
                    src={promotionProduct.image_urls[selectedImage]}
                    alt={promotionProduct.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setShowImageModal(true)}
                    className="absolute top-4 right-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  이미지 없음
                </div>
              )}
              
              {/* 이미지 네비게이션 */}
              {promotionProduct?.image_urls && promotionProduct.image_urls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* 썸네일 이미지들 */}
            {promotionProduct?.image_urls && promotionProduct.image_urls.length > 1 && (
              <div className="flex space-x-2">
                {promotionProduct.image_urls.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === selectedImage ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${promotionProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 상품 정보 섹션 */}
          <div className="space-y-6">
            {/* 프로모션 배지 */}
            <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full">
              <Gift className="w-4 h-4 mr-1" />
              🎉 프로모션 패키지
            </div>

            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {promotionProduct.name}
              </h1>
              <p className="text-muted-foreground text-lg">
                {promotionProduct.description}
              </p>
            </div>

            {/* 가격 정보 */}
            <div className="space-y-3">
              {promotionProduct.original_price && promotionProduct.original_price > promotionProduct.price ? (
                <div className="flex items-center space-x-3">
                  <span className="text-3xl line-through text-muted-foreground">
                    {formatPrice(promotionProduct.original_price)}
                  </span>
                  <span className="text-4xl font-bold text-foreground">
                    {formatPrice(promotionProduct.price)}
                  </span>
                  <span className="text-lg text-muted-foreground">원</span>
                  <div className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                    {Math.round(((promotionProduct.original_price - promotionProduct.price) / promotionProduct.original_price) * 100)}% 할인
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-4xl font-bold text-foreground">
                    {formatPrice(promotionProduct.price)}
                  </span>
                  <span className="text-lg text-muted-foreground">원</span>
                </div>
              )}
            </div>

            {/* 패키지 내용 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                패키지 내용
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800">총 42개 패턴/도식화</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800">남성/여성 의류</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800">상의/하의/아우터</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800">사계절 컬렉션</span>
                </div>
              </div>
            </div>

            {/* 프로모션 코드 입력 */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">프로모션 코드</h3>
              <PromotionCodeInput
                onCodeApplied={handlePromoCodeApplied}
                onCodeRemoved={handlePromoCodeRemoved}
                appliedCode={appliedPromoCode}
                discount={promoDiscount}
                isPromotionProduct={true}
              />
            </div>

            {/* 할인 정보 */}
            {promoDiscount > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground">상품 금액</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-green-600">
                  <span>할인 금액 ({Math.round(promoDiscount * 100)}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <span className="font-medium text-foreground">총 결제 금액</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            )}

            {/* 수량 선택 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                수량
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  disabled={quantity <= 1}
                >
                  <span className="text-foreground">-</span>
                </button>
                <span className="w-16 text-center font-medium text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <span className="text-foreground">+</span>
                </button>
              </div>
            </div>

            {/* 구매 버튼 */}
            <div className="space-y-4">
              <Button 
                onClick={handlePurchase}
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                프로모션 패키지 구매하기
              </Button>
              <Button 
                variant="outline"
                onClick={handleAddToCart}
                disabled={cartLoading}
                className={`w-full h-14 text-lg border-2 transition-all duration-200 ${
                  cartSuccess 
                    ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-500/10' 
                    : 'border-border hover:border-primary hover:text-primary hover:bg-primary/5'
                }`}
              >
                {cartLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    추가 중...
                  </div>
                ) : cartSuccess ? (
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    장바구니에 추가됨
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    장바구니에 추가
                  </div>
                )}
              </Button>
            </div>

            {/* 추가 정보 */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Download className="w-4 h-4" />
                <span>구매 즉시 드라이브에 자동 추가</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>42개 패턴/도식화 포함</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>무제한 사용 가능</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 모달 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        product={{
          ...promotionProduct,
          quantity
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
