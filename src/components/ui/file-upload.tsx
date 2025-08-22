"use client";

import { useState, useRef } from "react";

import { StorageService } from "@/lib/storage";

interface FileUploadProps {
  onUploadComplete: (url: string, path: string) => void;
  onUploadError: (error: string) => void;
  accept?: string;
  maxSize?: number;
  bucket?: string;
  path?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = ".pdf,.jpg,.jpeg,.png,.ai,.eps",
  maxSize = 5 * 1024 * 1024, // 5MB
  bucket = "faddit-files", // drawings에서 faddit-files로 변경
  path,
  className = "",
  disabled = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const _file = event.target.files?.[0];
    if (!_file) return;

    try {
      // 파일 확장자 확인
      const fileExtension = _file.name.toLowerCase().split('.').pop();
      
      // AI 파일인 경우 크기 제한 적용
      if (fileExtension === 'ai') {
        const aiMaxSize = 2 * 1024 * 1024; // 2MB
        if (_file.size > aiMaxSize) {
          onUploadError(`AI 파일 크기가 너무 큽니다. 최대 2MB까지 지원됩니다. (현재: ${(_file.size / (1024 * 1024)).toFixed(1)}MB)`);
          return;
        }
      } else {
        // 다른 파일들은 기존 크기 제한 적용
        if (_file.size > maxSize) {
          onUploadError(`파일 크기가 너무 큽니다. 최대 ${maxSize / (1024 * 1024)}MB까지 지원됩니다.`);
          return;
        }
      }

      // 파일 검증
      StorageService.validateFile(_file, maxSize);

      setIsUploading(true);
      setUploadProgress(0);

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // 파일 업로드
      const result = await StorageService.uploadFile(_file, bucket, path);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 완료 콜백
      onUploadComplete(result.url, result.path);

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : "업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (disabled || isUploading) return;

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const _file = files[0];
    const input = fileInputRef.current;
    if (input) {
      input.files = files;
      await handleFileSelect({ target: { files } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${
          disabled ? "bg-gray-50 cursor-not-allowed" : "hover:border-blue-400 cursor-pointer"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">업로드 중...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-gray-600">
              <span className="font-medium">클릭하여 파일 선택</span>
              <p className="text-sm">또는 파일을 여기에 드래그하세요</p>
            </div>
            <p className="text-xs text-gray-500">
              지원 형식: {accept.replace(/\./g, '').toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">
              최대 크기: {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 