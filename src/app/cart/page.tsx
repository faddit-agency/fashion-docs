"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment/payment-modal";
import { formatPrice } from "@/lib/utils";
import { cartAPI } from "@/lib/database";
import { CartItem } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const { updateCartCount } = useCart("user1"); // TODO: 실제 사용자 ID로 변경

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      // TODO: 실제 사용자 ID로 변경
      const userId = "user1";
      const data = await cartAPI.getUserCart(userId);
      setCartItems(data || []);
    } catch (err) {
      console.error("장바구니 로딩 오류:", err);
      setError("장바구니를 불러오는데 실패했습니다.");
      // 임시 데이터로 폴백
      setCartItems([
        {
          id: 1,
          user_id: "user1",
          product_id: 1,
          quantity: 2,
          created_at: "2024-01-15T00:00:00Z",
          product: {
            id: 1,
            name: "남성 기본 반팔 티셔츠 도식화",
            category: "상의",
            gender: "남성",
            season: "봄/여름",
            price: 50000,
            description: "기본적인 남성 반팔 티셔츠의 도식화입니다.",
            seller_id: "seller1",
            file_url: "/files/product1.pdf",
            image_urls: ["/images/product1.jpg"],
            created_at: "2024-01-15T00:00:00Z",
            updated_at: "2024-01-15T00:00:00Z"
          }
        },
        {
          id: 2,
          user_id: "user1",
          product_id: 2,
          quantity: 1,
          created_at: "2024-01-15T00:00:00Z",
          product: {
            id: 2,
            name: "여성 기본 원피스 도식화",
            category: "원피스",
            gender: "여성",
            season: "봄/여름",
            price: 70000,
            description: "우아한 여성 원피스 도식화입니다.",
            seller_id: "seller1",
            file_url: "/files/product2.pdf",
            image_urls: ["/images/product2.jpg"],
            created_at: "2024-01-15T00:00:00Z",
            updated_at: "2024-01-15T00:00:00Z"
          }
        }
      ]);
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">장바구니를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={loadCart}>다시 시도</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">홈</Link></li>
            <li>/</li>
            <li className="text-gray-900">장바구니</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">장바구니</h1>
            <p className="text-gray-600 mt-1">
              {cartItems.length}개의 상품이 담겨있습니다
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">장바구니가 비어있습니다</h3>
              <p className="text-gray-600 mb-6">상품을 추가해보세요!</p>
              <Button asChild>
                <Link href="/products">상품 둘러보기</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* 선택된 상품 관리 */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === cartItems.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">전체 선택</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {selectedItems.length}개 선택됨
                    </span>
                  </div>
                  {selectedItems.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveSelected}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      선택 삭제
                    </Button>
                  )}
                </div>
              </div>

              {/* 장바구니 상품 목록 */}
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1 flex items-center space-x-4">
                        {/* 상품 이미지 */}
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.product?.image_urls && item.product.image_urls.length > 0 ? (
                            <img 
                              src={item.product.image_urls[0]} 
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-500 text-xs">이미지</div>
                          )}
                        </div>

                        {/* 상품 정보 */}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {item.product?.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                            <span>{item.product?.category}</span>
                            <span>•</span>
                            <span>{item.product?.gender}</span>
                            <span>•</span>
                            <span>{item.product?.season}</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(item.product?.price || 0)}
                          </div>
                        </div>

                        {/* 수량 조절 */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 총 가격 */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice((item.product?.price || 0) * item.quantity)}
                          </div>
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 결제 섹션 */}
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-medium text-gray-900">
                    선택된 상품 ({selectedItems.length}개)
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
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