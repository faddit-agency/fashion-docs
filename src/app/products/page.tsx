"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { productAPI, cartAPI } from "@/lib/database";
import { Product } from "@/lib/supabase";
import { getSampleProducts } from "@/lib/sample-data";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Search, Filter, X, Grid, List, ShoppingCart, Check } from "lucide-react";

export default function ProductsPage() {
  const { user } = useUser();
  const router = useRouter();
  const { updateCartCount } = useCart(user?.id);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    gender: "",
    season: "",
    priceRange: ""
  });
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cartLoading, setCartLoading] = useState<number | null>(null);
  const [cartSuccess, setCartSuccess] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // 먼저 샘플 데이터 사용
      const sampleData = getSampleProducts();
      setProducts(sampleData);
      
      // API 호출은 백그라운드에서 시도 (실패해도 샘플 데이터는 유지)
      try {
        const data = await productAPI.getAllProducts();
        if (data && data.length > 0) {
          setProducts(data);
        }
      } catch (apiErr) {
        console.error("API 상품 로딩 오류:", apiErr);
        // 샘플 데이터를 계속 사용
      }
    } catch (err) {
      console.error("상품 로딩 오류:", err);
      setError("상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      category: "",
      gender: "",
      season: "",
      priceRange: ""
    });
    setSearchQuery("");
  };

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/sign-in");
      return;
    }
    
    try {
      setCartLoading(productId);
      setCartSuccess(null);
      
      const result = await cartAPI.addToCart(user.id, productId, 1);
      
      if (result) {
        updateCartCount(1);
        setCartSuccess(productId);
        setTimeout(() => setCartSuccess(null), 3000);
      } else {
        alert("장바구니 추가에 실패했습니다.");
      }
    } catch (err) {
      console.error("장바구니 추가 오류:", err);
      alert("장바구니 추가에 실패했습니다.");
    } finally {
      setCartLoading(null);
    }
  };

  const hasActiveFilters = () => {
    return searchQuery || Object.values(filters).some(value => value !== "");
  };

  const filteredProducts = products.filter(product => {
    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // 필터 적용
    if (filters.type) {
      const productType = product.name.includes('도식화') ? '도식화' : 
                         product.name.includes('패턴') ? '패턴' : '기타';
      if (productType !== filters.type) return false;
    }
    if (filters.category && product.category !== filters.category) return false;
    if (filters.gender && product.gender !== filters.gender) return false;
    if (filters.season && product.season !== filters.season) return false;
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (max && product.price > max) return false;
      if (min && product.price < min) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">상품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-4">상품 목록</h1>
          <p className="text-xl text-muted-foreground">도식화와 패턴을 둘러보고 필요한 제품을 찾아보세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-card border border-card-border rounded-lg p-6 mb-8 animate-fade-in">
          {/* 검색바 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="상품명, 설명, 카테고리로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-4 text-lg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>
          </div>

          {/* 필터 및 뷰 모드 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground font-medium transition-colors duration-200"
            >
              <Filter className="w-4 h-4" />
              <span>필터</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  <span>필터 초기화</span>
                </button>
              )}
            </div>
          </div>

          {/* 필터 옵션들 */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-6 border-t border-border animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  타입
                </label>
                <select 
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="도식화">도식화</option>
                  <option value="패턴">패턴</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  카테고리
                </label>
                <select 
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="상의">상의</option>
                  <option value="하의">하의</option>
                  <option value="원피스">원피스</option>
                  <option value="아우터">아우터</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  성별
                </label>
                <select 
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                  <option value="유니섹스">유니섹스</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  시즌
                </label>
                <select 
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  value={filters.season}
                  onChange={(e) => handleFilterChange('season', e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="봄/여름">봄/여름</option>
                  <option value="가을/겨울">가을/겨울</option>
                  <option value="사계절">사계절</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  가격대
                </label>
                <select 
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="0-30000">3만원 이하</option>
                  <option value="30000-50000">3-5만원</option>
                  <option value="50000-80000">5-8만원</option>
                  <option value="80000-999999">8만원 이상</option>
                </select>
              </div>
            </div>
          )}

          {/* 활성 필터 표시 */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-border animate-fade-in">
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium">
                  검색: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-2 text-primary hover:text-primary/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                  타입: {filters.type}
                  <button
                    onClick={() => handleFilterChange('type', '')}
                    className="ml-2 text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                  카테고리: {filters.category}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="ml-2 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.gender && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                  성별: {filters.gender}
                  <button
                    onClick={() => handleFilterChange('gender', '')}
                    className="ml-2 text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.season && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">
                  시즌: {filters.season}
                  <button
                    onClick={() => handleFilterChange('season', '')}
                    className="ml-2 text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.priceRange && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-500/10 text-pink-600 dark:text-pink-400 font-medium">
                  가격: {filters.priceRange === "0-30000" ? "3만원 이하" : 
                         filters.priceRange === "30000-50000" ? "3-5만원" :
                         filters.priceRange === "50000-80000" ? "5-8만원" : "8만원 이상"}
                  <button
                    onClick={() => handleFilterChange('priceRange', '')}
                    className="ml-2 text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="card mb-8 bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 결과 개수 표시 */}
        <div className="mb-6 animate-fade-in">
          <p className="text-muted-foreground">
            총 <span className="font-semibold text-foreground">{filteredProducts.length}</span>개의 상품
            {hasActiveFilters() && " (필터 적용됨)"}
          </p>
        </div>

        {/* 상품 그리드/리스트 */}
        {filteredProducts.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className={`bg-card border border-card-border rounded-lg p-6 hover-lift animate-fade-in`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {viewMode === 'list' ? (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gradient-to-br from-muted to-muted/80 overflow-hidden flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">이미지</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.is_promotion && (
                          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full font-medium">
                            🎉 프로모션
                          </span>
                        )}
                        <span className="text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">
                          {product.category}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{product.gender}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                            {product.name}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-lg font-bold text-foreground">
                            {product.original_price && product.original_price > product.price ? (
                              <div className="flex items-center space-x-2">
                                <span className="line-through text-muted-foreground text-sm">
                                  {formatPrice(product.original_price)}
                                </span>
                                <span>{formatPrice(product.price)}</span>
                              </div>
                            ) : (
                              formatPrice(product.price)
                            )}
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              size="sm"
                              onClick={() => handleAddToCart(product.id)}
                              disabled={cartLoading === product.id}
                              className={`transition-all duration-200 ${
                                cartSuccess === product.id 
                                  ? 'bg-green-500 hover:bg-green-600 text-white border-0' 
                                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'
                              }`}
                            >
                              {cartLoading === product.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                              ) : cartSuccess === product.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <ShoppingCart className="w-3 h-3" />
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              asChild 
                              className="bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Link href={product.is_promotion ? "/products/promotion" : `/products/${product.id}`}>
                                상세보기
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/80 rounded-xl flex items-center justify-center mb-4">
                      <div className="text-muted-foreground text-sm">이미지</div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {product.is_promotion && (
                            <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full font-medium">
                              🎉 프로모션
                            </span>
                          )}
                          <span className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full font-medium">
                            {product.category}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">{product.gender}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                                              <div className="flex items-center justify-between pt-2">
                          <div className="text-2xl font-bold text-foreground">
                            {product.original_price && product.original_price > product.price ? (
                              <div className="flex flex-col items-end">
                                <span className="line-through text-muted-foreground text-sm">
                                  {formatPrice(product.original_price)}
                                </span>
                                <span>{formatPrice(product.price)}</span>
                              </div>
                            ) : (
                              formatPrice(product.price)
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => handleAddToCart(product.id)}
                              disabled={cartLoading === product.id}
                              className={`transition-all duration-200 ${
                                cartSuccess === product.id 
                                  ? 'bg-green-500 hover:bg-green-600 text-white border-0' 
                                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'
                              }`}
                            >
                              {cartLoading === product.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                              ) : cartSuccess === product.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <ShoppingCart className="w-3 h-3" />
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              asChild 
                              className="bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                            >
                              <Link href={`/products/${product.id}`}>
                                상세보기
                              </Link>
                            </Button>
                          </div>
                        </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-muted-foreground mb-6">
              <Search className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">조건에 맞는 상품이 없습니다</h3>
            <p className="text-muted-foreground mb-8 text-lg">검색어나 필터를 변경해보세요</p>
            <Button 
              onClick={clearFilters} 
              variant="outline"
              className="border-2 border-border hover:border-primary hover:text-primary transition-all duration-200"
            >
              필터 초기화
            </Button>
          </div>
        )}

        {/* 페이지네이션 */}
        {filteredProducts.length > 0 && (
          <div className="mt-12 flex justify-center animate-fade-in">
            <nav className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-border hover:border-primary hover:text-primary">
                이전
              </Button>
              <Button size="sm" className="bg-primary text-white border-0">
                1
              </Button>
              <Button variant="outline" size="sm" className="border-border hover:border-primary hover:text-primary">
                2
              </Button>
              <Button variant="outline" size="sm" className="border-border hover:border-primary hover:text-primary">
                3
              </Button>
              <Button variant="outline" size="sm" className="border-border hover:border-primary hover:text-primary">
                다음
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
} 