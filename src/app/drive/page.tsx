"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FileDownload } from "@/components/ui/file-download";
import { StorageService } from "@/lib/storage";

type Asset = {
  id: string;
  name: string;
  path: string;
  category: "패턴" | "인쇄" | "원단" | "라벨" | "기타";
  uploadedAt: string;
};

export default function DrivePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 실제 API 연동. 당장은 샘플로 표시
    setAssets([
      { id: "1", name: "패턴 DXF", path: "products/1/patterns/sample.dxf", category: "패턴", uploadedAt: new Date().toISOString() },
      { id: "2", name: "도식화 PDF", path: "products/1/specs/techpack.pdf", category: "인쇄", uploadedAt: new Date().toISOString() },
      { id: "3", name: "라벨 가이드", path: "assets/labels/guide.pdf", category: "라벨", uploadedAt: new Date().toISOString() },
    ]);
    setLoading(false);
  }, []);

  const categories: Asset["category"][] = ["패턴", "인쇄", "원단", "라벨", "기타"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">드라이브</h1>
          <p className="text-gray-600 mt-2">구매 및 업로드한 에셋을 한 곳에서 관리합니다.</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((cat) => {
              const items = assets.filter(a => a.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{cat}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((asset) => (
                      <div key={asset.id} className="bg-white rounded-lg border p-4">
                        <div className="font-medium text-gray-900">{asset.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{asset.path}</div>
                        <div className="mt-4">
                          <FileDownload filePath={asset.path} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


