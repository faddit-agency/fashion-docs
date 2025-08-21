"use client";

import { useEffect, useRef, useState } from "react";

interface WorksheetThumbnailProps {
  worksheetId: string;
  title: string;
  category: string;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
}

export function WorksheetThumbnail({ 
  worksheetId, 
  title, 
  category, 
  onThumbnailGenerated 
}: WorksheetThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);

  // 기본 썸네일 생성 (카테고리별 색상)
  const generateDefaultThumbnail = () => {
    const categoryColors: Record<string, string> = {
      '상의': '#dbeafe',
      '하의': '#dcfce7',
      '원피스': '#f3e8ff',
      '아우터': '#fed7aa',
      '속옷': '#fce7f3',
      '액세서리': '#fef3c7'
    };

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${categoryColors[category] || '#f3f4f6'}"/>
        <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle" font-weight="bold">${title}</text>
        <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${category}</text>
        <text x="50%" y="80%" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">작업지시서</text>
      </svg>
    `)}`;
  };

  // 작업지시서 화면 캡처
  const captureWorksheet = async () => {
    if (!worksheetRef.current) return;

    setIsGenerating(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(worksheetRef.current, {
        width: 1200,
        height: 800,
        scale: 0.5, // 해상도 조정
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        logging: false,
        ignoreElements: (element: Element) => {
          // 편집 모드 버튼이나 불필요한 요소 제외
          return element.classList.contains('edit-mode-button') || 
                 element.classList.contains('capture-exclude') ||
                 element.classList.contains('ai-chat-button');
        }
      });

      const thumbnailUrl = canvas.toDataURL('image/png', 0.8);
      setThumbnailUrl(thumbnailUrl);
      
      // 로컬 스토리지에 저장
      const thumbnails = JSON.parse(localStorage.getItem('worksheet_thumbnails') || '{}');
      thumbnails[worksheetId] = thumbnailUrl;
      localStorage.setItem('worksheet_thumbnails', JSON.stringify(thumbnails));
      
      onThumbnailGenerated?.(thumbnailUrl);
    } catch (error) {
      console.error('썸네일 생성 오류:', error);
      setThumbnailUrl(generateDefaultThumbnail());
    } finally {
      setIsGenerating(false);
    }
  };

  // 저장된 썸네일 불러오기
  useEffect(() => {
    const thumbnails = JSON.parse(localStorage.getItem('worksheet_thumbnails') || '{}');
    if (thumbnails[worksheetId]) {
      setThumbnailUrl(thumbnails[worksheetId]);
    } else {
      setThumbnailUrl(generateDefaultThumbnail());
    }
  }, [worksheetId, title, category]);

  return (
    <div className="relative">
      {/* 썸네일 이미지 */}
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={`${title} 썸네일`}
            className="w-full h-full object-cover"
            onError={() => setThumbnailUrl(generateDefaultThumbnail())}
          />
        )}
        
        {/* 로딩 오버레이 */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm">썸네일 생성 중...</div>
          </div>
        )}
      </div>

      {/* 숨겨진 작업지시서 요소 (캡처용) */}
      <div 
        ref={worksheetRef}
        className="absolute -top-[9999px] left-0 w-[1200px] h-[800px] bg-white p-8"
        style={{ visibility: 'hidden' }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-lg text-gray-600">{category} 작업지시서</p>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">기본 정보</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>제품명: {title}</p>
                <p>카테고리: {category}</p>
                <p>생성일: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">도식화</h3>
              <div className="aspect-square bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500 text-sm">도식화 이미지</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">사이즈 정보</h3>
              <div className="text-sm text-gray-600">
                <p>S, M, L, XL</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">원단 정보</h3>
              <div className="text-sm text-gray-600">
                <p>면 100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 썸네일 생성 함수 (외부에서 호출)
export const generateWorksheetThumbnail = async (
  worksheetId: string, 
  title: string, 
  category: string
): Promise<string> => {
  const categoryColors: Record<string, string> = {
    '상의': '#dbeafe',
    '하의': '#dcfce7',
    '원피스': '#f3e8ff',
    '아우터': '#fed7aa',
    '속옷': '#fce7f3',
    '액세서리': '#fef3c7'
  };

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${categoryColors[category] || '#f3f4f6'}"/>
      <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle" font-weight="bold">${title}</text>
      <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">${category}</text>
      <text x="50%" y="80%" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">작업지시서</text>
    </svg>
  `)}`;
};

// 저장된 썸네일 가져오기
export const getWorksheetThumbnail = (worksheetId: string): string | null => {
  try {
    const thumbnails = JSON.parse(localStorage.getItem('worksheet_thumbnails') || '{}');
    const thumbnail = thumbnails[worksheetId] || null;
    console.log('썸네일 조회:', worksheetId, thumbnail ? '있음' : '없음');
    return thumbnail;
  } catch (error) {
    console.error('썸네일 조회 오류:', error);
    return null;
  }
};

// 썸네일 저장
export const saveWorksheetThumbnail = (worksheetId: string, thumbnailUrl: string): void => {
  try {
    const thumbnails = JSON.parse(localStorage.getItem('worksheet_thumbnails') || '{}');
    thumbnails[worksheetId] = thumbnailUrl;
    localStorage.setItem('worksheet_thumbnails', JSON.stringify(thumbnails));
    console.log('썸네일 저장 완료:', worksheetId);
  } catch (error) {
    console.error('썸네일 저장 오류:', error);
  }
};

// 썸네일 삭제
export const deleteWorksheetThumbnail = (worksheetId: string): void => {
  try {
    const thumbnails = JSON.parse(localStorage.getItem('worksheet_thumbnails') || '{}');
    delete thumbnails[worksheetId];
    localStorage.setItem('worksheet_thumbnails', JSON.stringify(thumbnails));
    console.log('썸네일 삭제 완료:', worksheetId);
  } catch (error) {
    console.error('썸네일 삭제 오류:', error);
  }
};

