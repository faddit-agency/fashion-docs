"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export default function SellerPage() {
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // 판매자 정보
    businessName: "",
    businessNumber: "",
    phone: "",
    email: "",
    address: "",
    
    // 상품 정보
    productName: "",
    category: "",
    gender: "",
    season: "",
    price: "",
    description: "",
    
    // 파일 업로드
    productFiles: [] as { url: string; path: string }[],
    imageFiles: [] as { url: string; path: string }[]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploadComplete = (url: string, path: string, type: 'product' | 'image') => {
    if (type === 'product') {
      setFormData(prev => ({
        ...prev,
        productFiles: [...prev.productFiles, { url, path }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        imageFiles: [...prev.imageFiles, { url, path }]
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // TODO: 실제 API 호출로 상품 등록
    console.log("상품 등록:", formData);
    alert("상품이 성공적으로 등록되었습니다!");
    setStep(1);
    setFormData({
      businessName: "",
      businessNumber: "",
      phone: "",
      email: "",
      address: "",
      productName: "",
      category: "",
      gender: "",
      season: "",
      price: "",
      description: "",
      productFiles: [],
      imageFiles: []
    });
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.businessName && formData.businessNumber && formData.phone && formData.email;
      case 2:
        return formData.productName && formData.category && formData.gender && formData.season && formData.price;
      case 3:
        return formData.productFiles.length > 0 && formData.imageFiles.length > 0;
      default:
        return false;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-600 mb-6">판매자 등록을 위해 로그인해주세요.</p>
            <Button asChild>
              <Link href="/sign-in">로그인하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">판매자 등록</h1>
          <p className="text-gray-600">
            패턴과 도식화를 판매하여 수익을 창출하세요. 간단한 절차로 판매자로 등록하고 상품을 등록해보세요.
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">판매자 정보</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">상품 정보</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 3 ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">파일 업로드</span>
            </div>
          </div>
        </div>

        {/* 단계별 폼 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">판매자 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업자명 *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="사업자명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사업자등록번호 *
                  </label>
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="000-00-00000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="010-0000-0000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="example@email.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="주소를 입력하세요"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">상품 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="상품명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">카테고리 선택</option>
                    <option value="상의">상의</option>
                    <option value="하의">하의</option>
                    <option value="원피스">원피스</option>
                    <option value="아우터">아우터</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    성별 *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">성별 선택</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                    <option value="유니섹스">유니섹스</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시즌 *
                  </label>
                  <select
                    value={formData.season}
                    onChange={(e) => handleInputChange('season', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">시즌 선택</option>
                    <option value="봄/여름">봄/여름</option>
                    <option value="가을/겨울">가을/겨울</option>
                    <option value="사계절">사계절</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격 *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="가격을 입력하세요"
                    min="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 resize-none"
                    placeholder="상품에 대한 자세한 설명을 입력하세요"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">파일 업로드</h2>
              
              <div className="space-y-8">
                {/* 상품 파일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    도식화/패턴 파일 *
                  </label>
                  <FileUpload
                    onUploadComplete={(url, path) => handleFileUploadComplete(url, path, 'product')}
                    onUploadError={(error) => console.error(error)}
                    accept=".pdf,.ai,.eps,.cdr"
                    maxSize={50 * 1024 * 1024} // 50MB
                    bucket="faddit-products"
                    path="patterns"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    PDF, AI, EPS, CDR 형식 지원 (최대 50MB)
                  </p>
                  {formData.productFiles.length > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ {formData.productFiles.length}개의 파일이 업로드되었습니다
                      </p>
                    </div>
                  )}
                </div>

                {/* 이미지 파일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 이미지 *
                  </label>
                  <FileUpload
                    onUploadComplete={(url, path) => handleFileUploadComplete(url, path, 'image')}
                    onUploadError={(error) => console.error(error)}
                    accept=".jpg,.jpeg,.png,.gif"
                    maxSize={10 * 1024 * 1024} // 10MB
                    bucket="faddit-products"
                    path="images"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG, GIF 형식 지원 (최대 10MB)
                  </p>
                  {formData.imageFiles.length > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ {formData.imageFiles.length}개의 이미지가 업로드되었습니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 네비게이션 버튼 */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                이전
              </Button>
            )}
            
            <div className="ml-auto">
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceedToNext()}
                >
                  다음
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedToNext()}
                >
                  상품 등록하기
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 판매자 혜택 안내 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">판매자 혜택</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">💰</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">높은 수익률</h4>
              <p className="text-sm text-blue-700">판매 수익의 90% 지급</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">🚀</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">빠른 등록</h4>
              <p className="text-sm text-blue-700">3단계로 간편한 상품 등록</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">📊</span>
              </div>
              <h4 className="font-medium text-blue-900 mb-1">실시간 통계</h4>
              <p className="text-sm text-blue-700">판매 현황 및 수익 분석</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 