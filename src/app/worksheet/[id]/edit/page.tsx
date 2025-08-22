"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { worksheetAPI } from "@/lib/database";
import { Worksheet } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Camera } from "lucide-react";

export default function EditWorksheetPage() {
  const params = useParams();
  const router = useRouter();
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const worksheetRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    size_range: "",
    content: ""
  });

  // 썸네일 캡처 함수
  const captureThumbnail = async (worksheetId: string) => {
    if (!formRef.current) return null;
    
    setIsCapturing(true);
    try {
      // 캡처 전에 패딩 제거
      const originalPadding = formRef.current.style.padding;
      formRef.current.style.padding = '0';
      
      const html2canvas = (await import('html2canvas')).default;
      
      // 실제 콘텐츠 높이 계산
      const contentHeight = formRef.current.scrollHeight;
      const captureHeight = Math.min(contentHeight, 800);
      
      const canvas = await html2canvas(formRef.current, {
        width: 1200,
        height: captureHeight,
        scale: 0.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f5f5f5',
        scrollX: 0,
        scrollY: 0,
        logging: false,
        x: 0,
        y: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (element) => {
          // 편집 모드 버튼이나 불필요한 요소 제외
          return element.classList.contains('edit-mode-button') || 
                 element.classList.contains('capture-exclude');
        }
      });
      
      // 패딩 복원
      formRef.current.style.padding = originalPadding;
      
      const thumbnailUrl = canvas.toDataURL('image/png', 0.8);
      
      // 로컬 스토리지에 썸네일 저장
      const thumbnails = JSON.parse(localStorage.getItem('worksheet_thumbnails') || '{}');
      thumbnails[worksheetId] = thumbnailUrl;
      localStorage.setItem('worksheet_thumbnails', JSON.stringify(thumbnails));
      
      console.log('작업지시서 썸네일 캡처 완료:', worksheetId);
      return thumbnailUrl;
    } catch (error) {
      console.error('썸네일 캡처 오류:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  // 수동 썸네일 캡처 함수
  const handleManualCapture = async () => {
    if (!worksheet) return;
    
    const worksheetId = worksheet.id.toString();
    const thumbnailUrl = await captureThumbnail(worksheetId);
    
    if (thumbnailUrl) {
      alert('썸네일이 성공적으로 캡처되었습니다!');
    } else {
      alert('썸네일 캡처에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (params.id) {
      loadWorksheet();
    }
  }, [params.id]);

  const loadWorksheet = async () => {
    try {
      setLoading(true);
      const worksheetId = parseInt(params.id as string);
      // TODO: 실제 API 호출로 변경
      const data = {
        id: worksheetId,
        user_id: "user1",
        title: "남성 반팔 티셔츠 작업지시서",
        category: "상의",
        size_range: "S~XL",
        content: "작업지시서 내용...",
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z"
      };
      setWorksheet(data);
      setFormData({
        title: data.title,
        category: data.category,
        size_range: data.size_range,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
      });
    } catch (err) {
      console.error("작업지시서 로딩 오류:", err);
      setError("작업지시서를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const worksheetId = parseInt(params.id as string);
      
      await worksheetAPI.updateWorksheet(worksheetId, {
        title: formData.title,
        category: formData.category,
        size_range: formData.size_range,
        content: formData.content
      });
      
      // 썸네일 캡처
      try {
        await captureThumbnail(worksheetId.toString());
      } catch (captureError) {
        console.error('썸네일 캡처 오류:', captureError);
      }
      
      alert("작업지시서가 수정되었습니다.");
      router.push("/mypage");
    } catch (err) {
      console.error("작업지시서 수정 오류:", err);
      alert("작업지시서 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("작업지시서를 삭제하시겠습니까?")) return;
    
    try {
      const worksheetId = parseInt(params.id as string);
      await worksheetAPI.deleteWorksheet(worksheetId);
      alert("작업지시서가 삭제되었습니다.");
      router.push("/mypage");
    } catch (err) {
      console.error("작업지시서 삭제 오류:", err);
      alert("작업지시서 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">작업지시서를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !worksheet) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">작업지시서를 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-6">{error || "요청하신 작업지시서가 존재하지 않습니다."}</p>
            <Button asChild>
              <Link href="/mypage">마이페이지로 돌아가기</Link>
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
            <li><Link href="/mypage" className="hover:text-gray-700">마이페이지</Link></li>
            <li>/</li>
            <li className="text-gray-900">작업지시서 수정</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/mypage">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    돌아가기
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">작업지시서 수정</h1>
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

          <form onSubmit={handleSubmit} className="p-6 space-y-6" ref={formRef}>
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                작업지시서 제목
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">카테고리 선택</option>
                <option value="상의">상의</option>
                <option value="하의">하의</option>
                <option value="원피스">원피스</option>
                <option value="아우터">아우터</option>
                <option value="속옷">속옷</option>
                <option value="액세서리">액세서리</option>
              </select>
            </div>

            {/* 사이즈 범위 */}
            <div>
              <label htmlFor="size_range" className="block text-sm font-medium text-gray-700 mb-2">
                사이즈 범위
              </label>
              <input
                type="text"
                id="size_range"
                value={formData.size_range}
                onChange={(e) => setFormData(prev => ({ ...prev, size_range: e.target.value }))}
                placeholder="예: S~XL, 90~110"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 작업지시서 내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                작업지시서 내용
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="작업지시서 내용을 입력하세요..."
                required
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleManualCapture}
                disabled={isCapturing}
                title="썸네일 캡처"
              >
                {isCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    캡처 중...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    썸네일
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/mypage")}
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