"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { productAPI } from "@/lib/database";
import { Product } from "@/lib/supabase";
import { getSampleProducts } from "@/lib/sample-data";
import Link from "next/link";
import { Search, Filter, X, Grid, List, Star } from "lucide-react";

export default function ProductsPage() {
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
      <div className="min-h-screen section-gray">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">상품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen section-gray">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">상품 목록</h1>
          <p className="text-xl text-gray-600">도식화와 패턴을 둘러보고 필요한 제품을 찾아보세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="card mb-8 animate-fade-in">
          {/* 검색바 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="상품명, 설명, 카테고리로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-4 pr-12 py-4 text-lg"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* 필터 및 뷰 모드 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              <Filter className="w-4 h-4" />
              <span>필터</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  <span>필터 초기화</span>
                </button>
              )}
            </div>
          </div>

          {/* 필터 옵션들 */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-6 border-t border-gray-200 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  타입
                </label>
                <select 
                  className="input w-full"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="도식화">도식화</option>
                  <option value="패턴">패턴</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select 
                  className="input w-full"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성별
                </label>
                <select 
                  className="input w-full"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시즌
                </label>
                <select 
                  className="input w-full"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가격대
                </label>
                <select 
                  className="input w-full"
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
            <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200 animate-fade-in">
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 font-medium">
                  타입: {filters.type}
                  <button
                    onClick={() => handleFilterChange('type', '')}
                    className="ml-2 text-purple-500 hover:text-purple-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 font-medium">
                  카테고리: {filters.category}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.gender && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 font-medium">
                  성별: {filters.gender}
                  <button
                    onClick={() => handleFilterChange('gender', '')}
                    className="ml-2 text-green-500 hover:text-green-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.season && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700 font-medium">
                  시즌: {filters.season}
                  <button
                    onClick={() => handleFilterChange('season', '')}
                    className="ml-2 text-orange-500 hover:text-orange-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.priceRange && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700 font-medium">
                  가격: {filters.priceRange === "0-30000" ? "3만원 이하" : 
                         filters.priceRange === "30000-50000" ? "3-5만원" :
                         filters.priceRange === "50000-80000" ? "5-8만원" : "8만원 이상"}
                  <button
                    onClick={() => handleFilterChange('priceRange', '')}
                    className="ml-2 text-pink-500 hover:text-pink-700"
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
          <p className="text-gray-600">
            총 <span className="font-semibold text-gray-900">{filteredProducts.length}</span>개의 상품
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
                className={`card hover-lift animate-fade-in`}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-gray-500 text-sm">이미지</div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {product.category}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">{product.gender}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
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
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-gray-400 mb-6">
              <Search className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">조건에 맞는 상품이 없습니다</h3>
            <p className="text-gray-500 mb-8 text-lg">검색어나 필터를 변경해보세요</p>
            <Button 
              onClick={clearFilters} 
              variant="outline"
              className="border-2 border-gray-300 hover:border-primary hover:text-primary transition-all duration-200"
            >
              필터 초기화
            </Button>
          </div>
        )}

        {/* 페이지네이션 */}
        {filteredProducts.length > 0 && (
          <div className="mt-12 flex justify-center animate-fade-in">
            <nav className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-gray-200 hover:border-primary hover:text-primary">
                이전
              </Button>
              <Button size="sm" className="bg-primary text-white border-0">
                1
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200 hover:border-primary hover:text-primary">
                2
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200 hover:border-primary hover:text-primary">
                3
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200 hover:border-primary hover:text-primary">
                다음
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
} 