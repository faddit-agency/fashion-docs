"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { FileDownload } from "./file-download";
import { X, Folder, FileText, Image, File } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  path: string;
  category: "패턴" | "인쇄" | "원단" | "라벨" | "기타";
  uploadedAt: string;
  fileSize?: string;
  fileType?: string;
}

interface DriveSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  title?: string;
}

export function DriveSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  title = "드라이브에서 파일 선택" 
}: DriveSelectorProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, selectedCategory]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const userId = typeof window !== 'undefined' ? (window as any).__FAKE_USER_ID__ || 'user1' : 'user1';
      const categoryParam = selectedCategory === "전체" ? "" : selectedCategory;
      
      console.log('Fetching assets with params:', { userId, categoryParam });
      
      const response = await fetch(`/api/drive/assets?userId=${userId}&category=${categoryParam}`);
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch assets: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      // 오류 발생 시 빈 배열로 설정
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["전체", "패턴", "인쇄", "원단", "라벨", "기타"];
  
  const filteredAssets = selectedCategory === "전체" 
    ? assets 
    : assets.filter(asset => asset.category === selectedCategory);

  const getFileIcon = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-5 h-5 text-green-500" />;
      case 'ai':
      case 'eps':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'dxf':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 카테고리 필터 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* 파일 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">불러오는 중...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">선택된 카테고리에 파일이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleSelect(asset)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(asset.path)}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {asset.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {asset.path}
                    </p>
                    {asset.fileSize && (
                      <p className="text-xs text-gray-400 mt-1">
                        {asset.fileSize} • {asset.fileType?.toUpperCase()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(asset.uploadedAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(asset);
                      }}
                    >
                      선택
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              총 {filteredAssets.length}개 파일
            </p>
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
