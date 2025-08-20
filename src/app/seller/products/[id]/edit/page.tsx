"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";

import { Product } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    gender: "",
    season: "",
    price: "",
    description: "",
    status: "active" as "active" | "inactive"
  });

  const [files, setFiles] = useState({
    productFiles: [] as { url: string; path: string }[],
    imageFiles: [] as { url: string; path: string }[]
  });

  useEffect(() => {
    if (params.id && user) {
      loadProduct();
    }
  }, [params.id, user]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productId = parseInt(params.id as string);
      // TODO: 실제 API 호출로 변경
      const data = {
        id: productId,
        name: "남성 기본 반팔 티셔츠 도식화",
        category: "상의",
        gender: "남성",
        season: "봄/여름",
        price: 50000,
        description: "기본적인 남성 반팔 티셔츠의 도식화입니다.",
        seller_id: user?.id || "seller1",
        file_url: "/files/product1.pdf",
        image_urls: ["/images/product1.jpg"],
        status: "active" as const,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z"
      };
      setProduct(data);
      setFormData({
        name: data.name,
        category: data.category,
        gender: data.gender,
        season: data.season,
        price: data.price.toString(),
        description: data.description,
        status: data.status
      });
    } catch (err) {
      console.error("상품 로딩 오류:", err);
      setError("상품을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploadComplete = (url: string, path: string, type: 'product' | 'image') => {
    if (type === 'product') {
      setFiles(prev => ({
        ...prev,
        productFiles: [...prev.productFiles, { url, path }]
      }));
    } else {
      setFiles(prev => ({
        ...prev,
        imageFiles: [...prev.imageFiles, { url, path }]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !product) return;
    
    try {
      setSaving(true);
      const productId = parseInt(params.id as string);
      
      // TODO: Implement updateProduct API
      console.log("상품 수정:", {
        productId,
        name: formData.name,
        category: formData.category,
        gender: formData.gender,
        season: formData.season,
        price: parseInt(formData.price),
        description: formData.description,
        status: formData.status,
        file_url: files.productFiles.length > 0 ? files.productFiles[0].url : product.file_url,
        image_urls: files.imageFiles.length > 0 ? files.imageFiles.map(f => f.url) : product.image_urls
      });
      
      alert("상품이 성공적으로 수정되었습니다!");
      router.push("/seller/dashboard");
    } catch (err) {
      console.error("상품 수정 오류:", err);
      alert("상품 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 상품을 삭제하시겠습니까?")) return;
    
    try {
      const productId = parseInt(params.id as string);
      // TODO: Implement deleteProduct API
      console.log("상품 삭제:", productId);
      alert("상품이 삭제되었습니다.");
      router.push("/seller/dashboard");
    } catch (err) {
      console.error("상품 삭제 오류:", err);
      alert("상품 삭제에 실패했습니다.");
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
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
            <p className="text-gray-600 mb-6">상품 수정을 위해 로그인해주세요.</p>
            <Button asChild>
              <Link href="/sign-in">로그인하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-6">{error || "요청하신 상품이 존재하지 않습니다."}</p>
            <Button asChild>
              <Link href="/seller/dashboard">대시보드로 돌아가기</Link>
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
        {/* 브레드크럼 */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-gray-700">홈</Link></li>
            <li>/</li>
            <li><Link href="/seller/dashboard" className="hover:text-gray-700">판매자 대시보드</Link></li>
            <li>/</li>
            <li className="text-gray-900">상품 수정</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/seller/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    돌아가기
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">상품 수정</h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 상품 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  상품명 *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">카테고리 선택</option>
                  <option value="상의">상의</option>
                  <option value="하의">하의</option>
                  <option value="원피스">원피스</option>
                  <option value="아우터">아우터</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  성별 *
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">성별 선택</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                  <option value="유니섹스">유니섹스</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                  시즌 *
                </label>
                <select
                  id="season"
                  value={formData.season}
                  onChange={(e) => handleInputChange('season', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">시즌 선택</option>
                  <option value="봄/여름">봄/여름</option>
                  <option value="가을/겨울">가을/겨울</option>
                  <option value="사계절">사계절</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  가격 *
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="가격을 입력하세요"
                  min="0"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  상품 설명
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="상품에 대한 자세한 설명을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 파일 업로드 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">파일 업로드</h3>
              
              <div className="space-y-6">
                {/* 상품 파일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    도식화/패턴 파일
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
                  {files.productFiles.length > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ {files.productFiles.length}개의 파일이 업로드되었습니다
                      </p>
                    </div>
                  )}
                </div>

                {/* 이미지 파일 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 이미지
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
                  {files.imageFiles.length > 0 && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ {files.imageFiles.length}개의 이미지가 업로드되었습니다
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/seller/dashboard")}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 