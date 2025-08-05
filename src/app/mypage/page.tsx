"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment/payment-modal";
import { formatPrice, formatDate } from "@/lib/utils";
import { purchaseAPI, worksheetAPI, cartAPI } from "@/lib/database";
import { Purchase, Worksheet, CartItem } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Download, Edit, FileText, Trash2, Plus, Minus, ShoppingCart } from "lucide-react";

export default function MyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'worksheets' | 'cart'>('overview');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [worksheetFilter, setWorksheetFilter] = useState<string>('all');
  const [selectedCartItems, setSelectedCartItems] = useState<number[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { updateCartCount } = useCart(user?.id);

  // URL 파라미터에서 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'cart') {
      setActiveTab('cart');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userId = user?.id || "user1"; // TODO: 실제 사용자 ID로 변경
      
      // 구매 내역, 작업지시서, 장바구니를 병렬로 로드
      const [purchasesData, worksheetsData, cartData] = await Promise.all([
        purchaseAPI.getUserPurchases(userId),
        worksheetAPI.getUserWorksheets(userId),
        cartAPI.getUserCart(userId)
      ]);
      
      setPurchases(purchasesData || []);
      setWorksheets(worksheetsData || []);
      setCartItems(cartData || []);
    } catch (err) {
      console.error("데이터 로딩 오류:", err);
      setError("데이터를 불러오는데 실패했습니다.");
      // 임시 데이터로 폴백
      setPurchases([
        {
          id: 1,
          user_id: "user1",
          product_id: 1,
          amount: 50000,
          status: "completed",
          created_at: "2024-01-15T00:00:00Z",
          products: {
            id: 1,
            name: "남성 기본 반팔 티셔츠 도식화",
            price: 50000,
            image_urls: ["/images/product1.jpg"],
            category: "상의",
            gender: "남성",
            season: "봄/여름",
            description: "기본적인 남성 반팔 티셔츠의 도식화입니다.",
            seller_id: "seller1",
            file_url: "/files/product1.pdf",
            created_at: "2024-01-15T00:00:00Z",
            updated_at: "2024-01-15T00:00:00Z"
          }
        },
        {
          id: 2,
          user_id: "user1",
          product_id: 2,
          amount: 70000,
          status: "completed",
          created_at: "2024-01-10T00:00:00Z",
          products: {
            id: 2,
            name: "여성 기본 원피스 도식화",
            price: 70000,
            image_urls: ["/images/product2.jpg"],
            category: "원피스",
            gender: "여성",
            season: "봄/여름",
            description: "우아한 여성 원피스 도식화입니다.",
            seller_id: "seller1",
            file_url: "/files/product2.pdf",
            created_at: "2024-01-10T00:00:00Z",
            updated_at: "2024-01-10T00:00:00Z"
          }
        }
      ]);
      setWorksheets([
        {
          id: 1,
          user_id: "user1",
          title: "남성 반팔 티셔츠 작업지시서",
          category: "상의",
          size_range: "S~XL",
          content: { /* 작업지시서 내용 */ },
          created_at: "2024-01-15T00:00:00Z",
          updated_at: "2024-01-15T00:00:00Z"
        },
        {
          id: 2,
          user_id: "user1",
          title: "여성 블라우스 작업지시서",
          category: "상의",
          size_range: "S~L",
          content: { /* 작업지시서 내용 */ },
          created_at: "2024-01-12T00:00:00Z",
          updated_at: "2024-01-12T00:00:00Z"
        }
      ]);
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

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    // 실제 파일 다운로드 로직
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteWorksheet = async (worksheetId: number) => {
    if (!confirm("작업지시서를 삭제하시겠습니까?")) return;
    
    try {
      await worksheetAPI.deleteWorksheet(worksheetId);
      setWorksheets(prev => prev.filter(w => w.id !== worksheetId));
      alert("작업지시서가 삭제되었습니다.");
    } catch (err) {
      console.error("작업지시서 삭제 오류:", err);
      alert("작업지시서 삭제에 실패했습니다.");
    }
  };

  // 장바구니 관련 함수들
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

  const handleRemoveCartItem = async (cartItemId: number) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      setSelectedCartItems(prev => prev.filter(id => id !== cartItemId));
      updateCartCount(-1);
    } catch (err) {
      console.error("상품 제거 오류:", err);
      alert("상품 제거에 실패했습니다.");
    }
  };

  const handleSelectCartItem = (cartItemId: number) => {
    setSelectedCartItems(prev => 
      prev.includes(cartItemId)
        ? prev.filter(id => id !== cartItemId)
        : [...prev, cartItemId]
    );
  };

  const handleSelectAllCartItems = () => {
    if (selectedCartItems.length === cartItems.length) {
      setSelectedCartItems([]);
    } else {
      setSelectedCartItems(cartItems.map(item => item.id));
    }
  };

  const handleRemoveSelectedCartItems = async () => {
    if (selectedCartItems.length === 0) return;
    
    try {
      await Promise.all(selectedCartItems.map(id => cartAPI.removeFromCart(id)));
      setCartItems(prev => prev.filter(item => !selectedCartItems.includes(item.id)));
      setSelectedCartItems([]);
      updateCartCount(-selectedCartItems.length);
    } catch (err) {
      console.error("선택 상품 제거 오류:", err);
      alert("선택한 상품 제거에 실패했습니다.");
    }
  };

  const handleCheckout = () => {
    if (selectedCartItems.length === 0) {
      alert("구매할 상품을 선택해주세요.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log("결제 성공:", paymentResult);
    setShowPaymentModal(false);
    alert("결제가 완료되었습니다! 파일 다운로드가 가능합니다.");
    setActiveTab('purchases');
  };

  const selectedCartItemsData = cartItems.filter(item => selectedCartItems.includes(item.id));
  const totalCartPrice = selectedCartItemsData.reduce((sum, item) => 
    sum + (item.product?.price || 0) * item.quantity, 0
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen section-gray">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen section-gray">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/sign-in">로그인하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen section-gray">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 사용자 정보 및 통계 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* 사용자 정보 */}
          <div className="md:col-span-2 card">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : '사용자'}
                </h1>
                <p className="text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
              </div>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="card">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{purchases.length}</div>
              <div className="text-sm text-gray-600">총 구매</div>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{worksheets.length}</div>
              <div className="text-sm text-gray-600">작업지시서</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={loadUserData} className="bg-primary hover:bg-primary/90">다시 시도</Button>
          </div>
        ) : (
          <>
            {/* 탭 네비게이션 */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    개요
                  </button>
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'purchases'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    구매 내역
                  </button>
                  <button
                    onClick={() => setActiveTab('worksheets')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'worksheets'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    작업지시서
                  </button>
                  <button
                    onClick={() => setActiveTab('cart')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'cart'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    장바구니 ({cartItems.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* 탭 콘텐츠 */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* 구매 내역 요약 */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">최근 구매</h2>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('purchases')}>
                      전체 보기
                    </Button>
                  </div>
                  {purchases.length > 0 ? (
                    <div className="space-y-4">
                      {purchases.slice(0, 3).map((purchase) => (
                        <div key={purchase.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {purchase.products?.image_urls && purchase.products.image_urls.length > 0 ? (
                                <img 
                                  src={purchase.products.image_urls[0]} 
                                  alt={purchase.products.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-500 text-xs">이미지</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 text-sm">{purchase.products?.name}</h3>
                              <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                                <span>{formatDate(new Date(purchase.created_at))}</span>
                                <span className="font-medium">{formatPrice(purchase.amount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">구매 내역이 없습니다</h3>
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                        <Link href="/products">상품 둘러보기</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* 작업지시서 요약 */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">최근 작업지시서</h2>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('worksheets')}>
                      전체 보기
                    </Button>
                  </div>
                  {worksheets.length > 0 ? (
                    <div className="space-y-4">
                      {worksheets.slice(0, 3).map((worksheet) => (
                        <div key={worksheet.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900 text-sm">{worksheet.title}</h3>
                            <span className="text-xs text-primary font-medium">{worksheet.category}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>{formatDate(new Date(worksheet.created_at))}</span>
                            <span>•</span>
                            <span>사이즈: {worksheet.size_range}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">작업지시서가 없습니다</h3>
                      <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                        <Link href="/worksheet">작업지시서 만들기</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">구매 내역</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPurchaseFilter('all')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'all' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setPurchaseFilter('completed')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      완료
                    </button>
                    <button
                      onClick={() => setPurchaseFilter('pending')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      진행중
                    </button>
                    <button
                      onClick={() => setPurchaseFilter('failed')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        purchaseFilter === 'failed' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      실패
                    </button>
                  </div>
                </div>
                {purchases.length > 0 ? (
                  <div className="space-y-4">
                    {purchases
                      .filter(purchase => purchaseFilter === 'all' || purchase.status === purchaseFilter)
                      .map((purchase) => (
                      <div key={purchase.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          {/* 상품 이미지 */}
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                            {purchase.products?.image_urls && purchase.products.image_urls.length > 0 ? (
                              <img 
                                src={purchase.products.image_urls[0]} 
                                alt={purchase.products.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-gray-500 text-xs">이미지</div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900">{purchase.products?.name}</h3>
                              <span className={`text-sm font-medium px-2 py-1 rounded ${
                                purchase.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : purchase.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {purchase.status === 'completed' ? '완료' : 
                                 purchase.status === 'pending' ? '진행중' : '실패'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                              <span>{formatDate(new Date(purchase.created_at))}</span>
                              <span className="font-medium">{formatPrice(purchase.amount)}</span>
                            </div>
                            {purchase.status === 'completed' && purchase.products?.file_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadFile(
                                  purchase.products!.file_url, 
                                  `${purchase.products!.name}.pdf`
                                )}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                파일 다운로드
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">구매 내역이 없습니다</h3>
                    <p className="text-gray-600 mb-4">상품을 구매해보세요!</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/products">상품 둘러보기</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'worksheets' && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">작업지시서</h2>
                  <div className="flex items-center space-x-4">
                    <select
                      value={worksheetFilter}
                      onChange={(e) => setWorksheetFilter(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">전체 카테고리</option>
                      <option value="상의">상의</option>
                      <option value="하의">하의</option>
                      <option value="원피스">원피스</option>
                      <option value="아우터">아우터</option>
                      <option value="속옷">속옷</option>
                      <option value="액세서리">액세서리</option>
                    </select>
                    <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/worksheet">
                        <Plus className="w-4 h-4 mr-1" />
                        새로 만들기
                      </Link>
                    </Button>
                  </div>
                </div>
                {worksheets.length > 0 ? (
                  <div className="space-y-4">
                    {worksheets
                      .filter(worksheet => worksheetFilter === 'all' || worksheet.category === worksheetFilter)
                      .map((worksheet) => (
                      <div key={worksheet.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{worksheet.title}</h3>
                          <span className="text-sm text-primary font-medium">{worksheet.category}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                          <span>{formatDate(new Date(worksheet.created_at))}</span>
                          <span>•</span>
                          <span>사이즈: {worksheet.size_range}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/worksheet/${worksheet.id}/edit`}>
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            PDF 다운로드
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            생산 의뢰
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteWorksheet(worksheet.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">작업지시서가 없습니다</h3>
                    <p className="text-gray-600 mb-4">첫 번째 작업지시서를 만들어보세요!</p>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/worksheet">작업지시서 만들기</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cart' && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">장바구니</h2>
                  <p className="text-gray-600">{cartItems.length}개의 상품이 담겨있습니다</p>
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
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
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedCartItems.length === cartItems.length}
                              onChange={handleSelectAllCartItems}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">전체 선택</span>
                          </label>
                          <span className="text-sm text-gray-500">
                            {selectedCartItems.length}개 선택됨
                          </span>
                        </div>
                        {selectedCartItems.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveSelectedCartItems}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            선택 삭제
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 장바구니 상품 목록 */}
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedCartItems.includes(item.id)}
                              onChange={() => handleSelectCartItem(item.id)}
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
                                onClick={() => handleRemoveCartItem(item.id)}
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
                    <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-medium text-gray-900">
                          선택된 상품 ({selectedCartItems.length}개)
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(totalCartPrice)}
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button
                          onClick={handleCheckout}
                          disabled={selectedCartItems.length === 0}
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
            )}
          </>
        )}

        {/* 계정 설정 */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">계정 설정</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              프로필 수정
            </Button>
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              비밀번호 변경
            </Button>
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              알림 설정
            </Button>
          </div>
        </div>
      </div>

      {/* 결제 모달 */}
      {selectedCartItemsData.length > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          products={selectedCartItemsData.map(item => ({
            ...item.product!,
            quantity: item.quantity
          }))}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
} 