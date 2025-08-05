"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment/payment-modal";
import { ReviewCard } from "@/components/ui/review-card";
import { ProductTags } from "@/components/ui/product-tags";
import { ShareButtons } from "@/components/ui/share-buttons";
import { formatPrice } from "@/lib/utils";
import { productAPI, cartAPI } from "@/lib/database";
import { Product } from "@/lib/supabase";
import { useCart } from "@/hooks/use-cart";
import { getSampleProduct } from "@/lib/sample-data";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight, ZoomIn, Download, Eye, Heart, Share2, Copy, ArrowLeft } from "lucide-react";

// 샘플 리뷰 데이터
const sampleReviews = [
  {
    id: "1",
    userId: "user1",
    userName: "패턴러버",
    rating: 5,
    comment: "정말 퀄리티가 좋은 패턴이에요! 도식화가 깔끔하고 수정하기도 쉬워서 만족합니다. 다음에도 구매할 예정입니다.",
    createdAt: "2024-01-20T00:00:00Z",
    helpful: 12
  },
  {
    id: "2",
    userId: "user2",
    userName: "디자이너킹",
    rating: 4,
    comment: "기본 티셔츠 패턴으로 활용하기 좋습니다. 사이즈별로 잘 나와있어서 바로 사용할 수 있어요.",
    createdAt: "2024-01-18T00:00:00Z",
    helpful: 8
  },
  {
    id: "3",
    userId: "user3",
    userName: "패션스타터",
    rating: 5,
    comment: "처음 패턴을 구매해봤는데 생각보다 퀄리티가 좋네요. 설명도 자세하고 파일도 깔끔합니다.",
    createdAt: "2024-01-15T00:00:00Z",
    helpful: 15
  }
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'specs'>('description');
  const { updateCartCount } = useCart("user1"); // TODO: 실제 사용자 ID로 변경

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productId = parseInt(params.id as string);
      
      // 먼저 샘플 데이터에서 찾기
      const sampleProduct = getSampleProduct(productId);
      if (sampleProduct) {
        setProduct(sampleProduct);
        return;
      }
      
      // 샘플 데이터에 없으면 API 호출 시도
      try {
        const data = await productAPI.getProductById(productId);
        setProduct(data);
      } catch (apiErr) {
        console.error("API 상품 로딩 오류:", apiErr);
        setError("상품을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("상품 로딩 오류:", err);
      setError("상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!product) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log("결제 성공:", paymentResult);
    setShowPaymentModal(false);
    alert("결제가 완료되었습니다! 파일 다운로드가 가능합니다.");
    router.push("/mypage");
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      // TODO: 실제 사용자 ID로 변경
      const userId = "user1";
      await cartAPI.addToCart(userId, product.id, quantity);
      updateCartCount(1);
      alert("장바구니에 추가되었습니다!");
    } catch (err) {
      console.error("장바구니 추가 오류:", err);
      alert("장바구니 추가에 실패했습니다.");
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    alert(isWishlisted ? "위시리스트에서 제거되었습니다." : "위시리스트에 추가되었습니다.");
  };

  const handleReviewHelpful = (reviewId: string) => {
    // TODO: 실제 리뷰 도움됨 기능 구현
    console.log("리뷰 도움됨:", reviewId);
  };

  const handleTagClick = (tag: string) => {
    // TODO: 태그 클릭 시 해당 태그로 검색
    console.log("태그 클릭:", tag);
  };

  const nextImage = () => {
    if (!product?.image_urls) return;
    setSelectedImage((prev) => 
      prev === product.image_urls.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!product?.image_urls) return;
    setSelectedImage((prev) => 
      prev === 0 ? product.image_urls.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-8 text-lg">{error || "요청하신 상품이 존재하지 않습니다."}</p>
            <Button 
              asChild
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
            >
              <Link href="/products" className="inline-flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                상품 목록으로 돌아가기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 상품 특징 (카테고리별로 동적 생성)
  const getProductFeatures = (category: string) => {
    const features = {
      "상의": [
        "면 100% 원단",
        "다양한 사이즈 지원 (S~XL)",
        "깔끔한 기본 디자인",
        "실용적인 패턴",
        "쉬운 수정 및 커스터마이징"
      ],
      "하의": [
        "편안한 착용감",
        "다양한 사이즈 지원",
        "실용적인 디자인",
        "쉬운 수정 가능",
        "고품질 패턴"
      ],
      "원피스": [
        "우아한 실루엣",
        "여성스러운 디자인",
        "다양한 사이즈 지원",
        "고급스러운 패턴",
        "쉬운 수정 가능"
      ],
      "아우터": [
        "보온성 우수",
        "스타일리시한 디자인",
        "다양한 사이즈 지원",
        "고품질 패턴",
        "실용적인 구조"
      ]
    };
    return features[category as keyof typeof features] || features["상의"];
  };

  // 상품 스펙 (카테고리별로 동적 생성)
  const getProductSpecifications = (category: string) => {
    const specs = {
      "상의": {
        material: "면 100%",
        weight: "180g",
        sizes: ["S", "M", "L", "XL"],
        colors: ["화이트", "네이비", "그레이", "블랙"],
        fileFormat: "PDF, AI, EPS"
      },
      "하의": {
        material: "면 100%",
        weight: "250g",
        sizes: ["S", "M", "L", "XL"],
        colors: ["블루", "블랙", "그레이", "베이지"],
        fileFormat: "PDF, AI, EPS"
      },
      "원피스": {
        material: "폴리에스터 100%",
        weight: "200g",
        sizes: ["S", "M", "L", "XL"],
        colors: ["블랙", "네이비", "레드", "그린"],
        fileFormat: "PDF, AI, EPS"
      },
      "아우터": {
        material: "울 80%, 폴리에스터 20%",
        weight: "400g",
        sizes: ["S", "M", "L", "XL"],
        colors: ["블랙", "네이비", "그레이", "베이지"],
        fileFormat: "PDF, AI, EPS"
      }
    };
    return specs[category as keyof typeof specs] || specs["상의"];
  };

  const features = getProductFeatures(product.category);
  const specifications = getProductSpecifications(product.category);
  const productTags = [product.category, product.gender, product.season, "패턴", "도식화", "디자인"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 브레드크럼 */}
        <nav className="mb-8 animate-fade-in">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-700 transition-colors duration-200">홈</Link></li>
            <li>/</li>
            <li><Link href="/products" className="hover:text-gray-700 transition-colors duration-200">상품</Link></li>
            <li>/</li>
            <li><Link href={`/products?category=${product.category}`} className="hover:text-gray-700 transition-colors duration-200">{product.category}</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="card animate-fade-in">
          <div className="grid md:grid-cols-2 gap-12 p-8">
            {/* 이미지 섹션 */}
            <div>
              <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6 overflow-hidden group hover-lift">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <>
                    <img 
                      src={product.image_urls[selectedImage]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-95 p-3 rounded-full hover:bg-opacity-100 shadow-lg hover-lift"
                      >
                        <ZoomIn className="w-6 h-6 text-gray-700" />
                      </button>
                    </div>
                    
                    {/* 이미지 네비게이션 버튼 */}
                    {product.image_urls.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all shadow-lg hover-lift"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all shadow-lg hover-lift"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 text-lg flex items-center justify-center">상품 이미지</div>
                )}
              </div>
              
              {/* 썸네일 이미지들 */}
              {product.image_urls && product.image_urls.length > 1 && (
                <div className="flex space-x-3">
                  {product.image_urls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 overflow-hidden transition-all hover-lift ${
                        selectedImage === index ? 'border-purple-500 scale-105 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {product.image_urls && product.image_urls[index] ? (
                        <img 
                          src={product.image_urls[index]} 
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xs text-gray-500 flex items-center justify-center">이미지 {index + 1}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 상품 정보 섹션 */}
            <div>
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-sm text-gray-600 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full font-medium">
                    {product.category}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500 font-medium">{product.gender}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500 font-medium">{product.season}</span>
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  {product.name}
                </h1>
                
                <div className="flex items-center space-x-4 mb-6">

                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-lg text-gray-500">원</span>
                </div>

                {/* 평점 및 리뷰 */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold text-gray-900">4.8</span>
                    </div>
                    <span className="text-sm text-gray-500">(127개 리뷰)</span>
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500 font-medium">판매자: 패턴마스터</span>
                </div>

                {/* 상품 태그 */}
                <div className="mb-8">
                  <ProductTags tags={productTags} onTagClick={handleTagClick} />
                </div>

                {/* 공유 버튼 */}
                <div className="mb-8">
                  <ShareButtons
                    productName={product.name}
                    productUrl={window.location.href}
                    onWishlist={handleWishlist}
                    isWishlisted={isWishlisted}
                  />
                </div>
              </div>

              {/* 구매 버튼 */}
              <div className="space-y-4 mb-8">
                <Button 
                  onClick={handlePurchase}
                  className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                >
                  구매하기
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleAddToCart}
                  className="w-full h-14 text-lg border-2 border-gray-200 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                >
                  장바구니에 추가
                </Button>
              </div>

              {/* 탭 네비게이션 */}
              <div className="border-b border-gray-200 mb-8">
                <nav className="flex space-x-8">
                  {[
                    { id: 'description', label: '상품 설명' },
                    { id: 'reviews', label: '리뷰' },
                    { id: 'specs', label: '상품 스펙' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 탭 콘텐츠 */}
              <div className="min-h-[400px]">
                {activeTab === 'description' && (
                  <div className="animate-fade-in">
                    <p className="text-gray-700 leading-relaxed mb-8 text-lg">
                      {product.description}
                    </p>
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">주요 특징</h3>
                      <ul className="space-y-4">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-4">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <span className="text-gray-700 text-lg">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">파일 정보</h3>
                      <div className="grid grid-cols-2 gap-6 text-lg">
                        <div>
                          <span className="text-gray-600">파일 크기:</span>
                          <p className="font-semibold text-gray-900">약 2.5MB</p>
                        </div>
                        <div>
                          <span className="text-gray-600">다운로드:</span>
                          <p className="font-semibold text-gray-900">구매 후 즉시 가능</p>
                        </div>
                        <div>
                          <span className="text-gray-600">사용 기간:</span>
                          <p className="font-semibold text-gray-900">무제한</p>
                        </div>
                        <div>
                          <span className="text-gray-600">파일 형식:</span>
                          <p className="font-semibold text-gray-900">{specifications.fileFormat}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">리뷰</h3>
                        <p className="text-sm text-gray-500">총 {sampleReviews.length}개의 리뷰</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-gray-200 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                      >
                        리뷰 작성
                      </Button>
                    </div>
                    
                    <div className="space-y-8">
                      {sampleReviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          onHelpful={handleReviewHelpful}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="animate-fade-in">
                    <h3 className="text-xl font-semibold text-gray-900 mb-8">상품 스펙</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="card">
                        <span className="text-sm text-gray-600 mb-2">원단</span>
                        <p className="font-semibold text-gray-900 text-lg">{specifications.material}</p>
                      </div>
                      <div className="card">
                        <span className="text-sm text-gray-600 mb-2">중량</span>
                        <p className="font-semibold text-gray-900 text-lg">{specifications.weight}</p>
                      </div>
                      <div className="card">
                        <span className="text-sm text-gray-600 mb-2">사이즈</span>
                        <p className="font-semibold text-gray-900 text-lg">{specifications.sizes.join(", ")}</p>
                      </div>
                      <div className="card">
                        <span className="text-sm text-gray-600 mb-2">색상</span>
                        <p className="font-semibold text-gray-900 text-lg">{specifications.colors.join(", ")}</p>
                      </div>
                      <div className="col-span-2 card">
                        <span className="text-sm text-gray-600 mb-2">파일 형식</span>
                        <p className="font-semibold text-gray-900 text-lg">{specifications.fileFormat}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 관련 상품 섹션 */}
        <div className="mt-16 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">관련 상품</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item, index) => (
              <div 
                key={item} 
                className="card hover-lift animate-fade-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-gray-500 text-sm">관련 상품 {item}</div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">관련 상품 {item}</h3>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(30000 + item * 10000)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      {showImageModal && product.image_urls && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 p-2 rounded-full hover-lift"
            >
              <span className="text-2xl">×</span>
            </button>
            <img
              src={product.image_urls[selectedImage]}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* 결제 모달 */}
      {product && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          product={product}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
} 