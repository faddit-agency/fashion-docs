"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FileDownload } from "@/components/ui/file-download";

import { DriveSelector } from "@/components/ui/drive-selector";
import { TechnicalDrawingEditor } from "@/components/ui/technical-drawing-editor";

type Asset = {
  id: string;
  name: string;
  path: string;
  category: "패턴" | "도식화" | "인쇄" | "원단" | "라벨" | "기타";
  uploadedAt: string;
  fileSize?: string;
  fileType?: string;
};

export default function DrivePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"files" | "drawing">("files");
  const [selectedCategory, setSelectedCategory] = useState<Asset["category"] | "전체">("전체");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<"front" | "back" | null>(null);
  const [frontImagePath, setFrontImagePath] = useState<string | null>(null);
  const [backImagePath, setBackImagePath] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const userId = typeof window !== 'undefined' ? (window as any).__FAKE_USER_ID__ || 'user1' : 'user1';
        const res = await fetch(`/api/drive/assets?userId=${userId}`);
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        let serverAssets: Asset[] = data.assets || [];
        // 로컬 데모 드라이브 병합 (작업지시서 카테고리 포함 가능)
        try {
          const localKey = 'demo_drive_assets';
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
          const localAssets: Asset[] = raw ? JSON.parse(raw) : [];
          const byKey = new Map<string, Asset>();
          [...serverAssets, ...localAssets].forEach(a => byKey.set(`${a.path}`, a));
          serverAssets = Array.from(byKey.values());
        } catch {}
        setAssets(serverAssets);
      } catch {
        setAssets([
          { id: "1", name: "패턴 DXF", path: "products/1/patterns/sample.dxf", category: "패턴", uploadedAt: new Date().toISOString(), fileType: "dxf" },
          { id: "2", name: "도식화 PDF", path: "products/1/specs/techpack.pdf", category: "인쇄", uploadedAt: new Date().toISOString(), fileType: "pdf" },
          { id: "3", name: "라벨 가이드", path: "assets/labels/guide.pdf", category: "라벨", uploadedAt: new Date().toISOString(), fileType: "pdf" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const categories: Asset["category"][] = ["패턴", "도식화", "인쇄", "원단", "라벨", "기타"];
  const filterCategories: (Asset["category"] | "전체")[] = ["전체", "패턴", "도식화", "인쇄", "원단", "라벨", "기타"];

  const frontImageUrl = useMemo(() => (
    frontImagePath
      ? `/api/files/thumbnail?path=${encodeURIComponent(frontImagePath)}&w=800&h=600&q=85`
      : "/api/placeholder/400/300"
  ), [frontImagePath]);

  const backImageUrl = useMemo(() => (
    backImagePath
      ? `/api/files/thumbnail?path=${encodeURIComponent(backImagePath)}&w=800&h=600&q=85`
      : "/api/placeholder/400/300"
  ), [backImagePath]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">드라이브</h1>
          <p className="text-gray-600 mt-2">구매 및 업로드한 에셋을 한 곳에서 관리합니다.</p>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex items-center gap-2">
          <Button
            variant={activeTab === "files" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("files")}
          >
            파일
          </Button>
          <Button
            variant={activeTab === "drawing" ? "primary" : "outline"}
            size="sm"
            onClick={() => setActiveTab("drawing")}
          >
            도식화
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // 업로드 화면으로 통일: 템플릿 없이 워크시트로 이동
              if (typeof window !== 'undefined') window.location.href = '/worksheet';
            }}
            className="ml-auto"
          >
            새로 만들기
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">불러오는 중...</p>
          </div>
        ) : activeTab === "files" ? (
          <div className="space-y-6">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              {filterCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 필터링된 에셋 표시 */}
            <div className="space-y-10">
              {categories.map((cat) => {
                const items = assets.filter(a => 
                  a.category === cat && 
                  (selectedCategory === "전체" || selectedCategory === cat)
                );
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{cat}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((asset) => (
                        <div key={asset.id} className="bg-white rounded-lg border overflow-hidden">
                          <div className="aspect-video bg-gray-100">
                            <img
                              src={`/api/files/thumbnail?path=${encodeURIComponent(asset.path)}&w=480&h=300&q=70`}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-4">
                            <div className="font-medium text-gray-900">{asset.name}</div>
                            <div className="text-xs text-gray-500 mt-1 truncate" title={asset.path}>{asset.path}</div>
                            <div className="mt-4">
                              <FileDownload filePath={asset.path} size="sm" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">도식화</h2>
                <p className="text-gray-600 text-sm">앞/뒷면 이미지를 선택해 도식화를 편집하세요.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectorTarget("front"); setSelectorOpen(true); }}
                >
                  앞면 이미지 선택
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectorTarget("back"); setSelectorOpen(true); }}
                >
                  뒷면 이미지 선택
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEditorOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  도식화 편집 열기
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100">
                  <img src={frontImageUrl} alt="앞면 미리보기" className="w-full h-full object-contain" />
                </div>
                <div className="p-3 text-sm text-gray-600">앞면 미리보기</div>
              </div>
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100">
                  <img src={backImageUrl} alt="뒷면 미리보기" className="w-full h-full object-contain" />
                </div>
                <div className="p-3 text-sm text-gray-600">뒷면 미리보기</div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 파일 선택 모달 */}
      <DriveSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(asset) => {
          if (selectorTarget === "front") setFrontImagePath(asset.path);
          if (selectorTarget === "back") setBackImagePath(asset.path);
          setSelectorOpen(false);
        }}
        title={selectorTarget === "back" ? "뒷면 이미지 선택" : "앞면 이미지 선택"}
      />

      {/* 도식화 편집기 */}
      {isEditorOpen && (
        <TechnicalDrawingEditor
          frontImage={frontImageUrl}
          backImage={backImageUrl}
          onSave={(front, back) => {
            console.log("도식화 저장", { front, back });
            setIsEditorOpen(false);
          }}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
}


