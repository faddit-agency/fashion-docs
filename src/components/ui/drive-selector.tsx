"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "./button";

import { X, Folder, FileText, Image, File, Upload, Plus } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  path: string;
  category: "패턴" | "도식화" | "인쇄" | "원단" | "라벨" | "기타";
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
  const { user } = useUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("도식화");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, selectedCategory]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const userId = user?.id || 'anonymous';
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
      console.log('Number of assets received:', data.assets?.length || 0);
      console.log('Assets array:', data.assets);
      console.log('Assets type:', typeof data.assets);
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      // 오류 발생 시 빈 배열로 설정
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["전체", "패턴", "도식화", "인쇄", "원단", "라벨", "기타"];
  
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
    console.log('DriveSelector: Asset selected:', asset);
    console.log('DriveSelector: Calling onSelect with asset:', asset);
    onSelect(asset);
    console.log('DriveSelector: Closing modal');
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);
      formData.append('userId', user?.id || 'anonymous');

      const response = await fetch('/api/drive/assets', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // 파일 목록 새로고침
      await fetchAssets();
      
      // 업로드 폼 닫기
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    setShowUploadForm(true);
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
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm"
                >
                  {category}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              className="text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              파일 업로드
            </Button>
          </div>
        </div>

        {/* 파일 업로드 폼 */}
        {showUploadForm && (
          <div className="p-6 border-b bg-blue-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">파일 업로드</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 선택
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="패턴">패턴</option>
                    <option value="도식화">도식화</option>
                    <option value="인쇄">인쇄</option>
                    <option value="원단">원단</option>
                    <option value="라벨">라벨</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    파일 선택
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.ai,.eps,.dxf,.psd,.docx,.xlsx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={uploading}
                  />
                </div>
                
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    업로드 중...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
              <p className="text-sm text-gray-400 mt-2">총 {assets.length}개 파일 중 {selectedCategory} 카테고리: {assets.filter(asset => asset.category === selectedCategory).length}개</p>
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
