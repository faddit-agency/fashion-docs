"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment/payment-modal";
import { formatPrice } from "@/lib/utils";
import { cartAPI } from "@/lib/database";
import { CartItem } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const { updateCartCount } = useCart(user?.id);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      loadCart();
    }
  }, [isLoaded, user, router]);

  const loadCart = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await cartAPI.getUserCart(user.id);
      setCartItems(data || []);
    } catch (err) {
      console.error("장바구니 로딩 오류:", err);
      setError("장바구니를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      await cartAPI.updateCartItemQuantity(cartItemId, newQuantity);
      setCartItems(prev => 
        prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (err) {
      console.error("수량 변경 오류:", err);
      alert("수량 변경에 실패했습니다.");
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      setSelectedItems(prev => prev.filter(id => id !== cartItemId));
      updateCartCount(-1);
    } catch (err) {
      console.error("상품 제거 오류:", err);
      alert("상품 제거에 실패했습니다.");
    }
  };

  const handleSelectItem = (cartItemId: number) => {
    setSelectedItems(prev => 
      prev.includes(cartItemId)
        ? prev.filter(id => id !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await Promise.all(selectedItems.map(id => cartAPI.removeFromCart(id)));
      setCartItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      updateCartCount(-selectedItems.length);
    } catch (err) {
      console.error("선택 상품 제거 오류:", err);
      alert("선택한 상품 제거에 실패했습니다.");
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("구매할 상품을 선택해주세요.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log("결제 성공:", paymentResult);
    setShowPaymentModal(false);
    alert("결제가 완료되었습니다! 파일 다운로드가 가능합니다.");
    router.push("/mypage");
  };

  const selectedItemsData = cartItems.filter(item => selectedItems.includes(item.id));
  const totalPrice = selectedItemsData.reduce((sum, item) => 
    sum + (item.product?.price || 0) * item.quantity, 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">장바구니를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">오류가 발생했습니다</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={loadCart}>다시 시도</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">홈</Link></li>
            <li>/</li>
            <li className="text-foreground">장바구니</li>
          </ol>
        </nav>

        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">장바구니</h1>
            <p className="text-muted-foreground mt-1">
              {cartItems.length}개의 상품이 담겨있습니다
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-muted-foreground mb-4">
                <ShoppingCart className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">장바구니가 비어있습니다</h3>
              <p className="text-muted-foreground mb-6">상품을 추가해보세요!</p>
              <Button asChild>
                <Link href="/products">상품 둘러보기</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* 선택된 상품 관리 */}
              <div className="p-6 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === cartItems.length}
                        onChange={handleSelectAll}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">전체 선택</span>
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {selectedItems.length}개 선택됨
                    </span>
                  </div>
                  {selectedItems.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveSelected}
                      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      선택 삭제
                    </Button>
                  )}
                </div>
              </div>

              {/* 장바구니 상품 목록 */}
              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      
                      <div className="flex-1 flex items-center space-x-4">
                        {/* 상품 이미지 */}
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {item.product?.image_urls && item.product.image_urls.length > 0 ? (
                            <img 
                              src={item.product.image_urls[0]} 
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground text-xs">이미지</div>
                          )}
                        </div>

                        {/* 상품 정보 */}
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">
                            {item.product?.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                            <span>{item.product?.category}</span>
                            <span>•</span>
                            <span>{item.product?.gender}</span>
                            <span>•</span>
                            <span>{item.product?.season}</span>
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {formatPrice(item.product?.price || 0)}
                          </div>
                        </div>

                        {/* 수량 조절 */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="w-4 h-4 text-foreground" />
                          </button>
                          <span className="w-12 text-center font-medium text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="w-4 h-4 text-foreground" />
                          </button>
                        </div>

                        {/* 총 가격 */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            {formatPrice((item.product?.price || 0) * item.quantity)}
                          </div>
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 결제 섹션 */}
              <div className="p-6 border-t border-border bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-medium text-foreground">
                    선택된 상품 ({selectedItems.length}개)
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatPrice(totalPrice)}
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={handleCheckout}
                    disabled={selectedItems.length === 0}
                    className="flex-1 h-12 text-lg"
                  >
                    선택 상품 구매하기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/products")}
                    className="h-12"
                  >
                    쇼핑 계속하기
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 결제 모달 */}
      {selectedItemsData.length > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          products={selectedItemsData.map(item => ({
            ...item.product!,
            quantity: item.quantity
          }))}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
} 