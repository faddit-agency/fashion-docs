"use client";

import { useState } from "react";
import { Button } from "./button";
import { StorageService } from "@/lib/storage";

interface FileDownloadProps {
  filePath: string;
  fileName?: string;
  bucket?: string;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function FileDownload({
  filePath,
  fileName,
  bucket = "faddit-files",
  className = "",
  variant = "outline",
  size = "sm"
}: FileDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // 다운로드 URL 생성
      const downloadUrl = await StorageService.getDownloadUrl(filePath, bucket);

      // 파일 다운로드
      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      // 파일명 결정
      const finalFileName = fileName || filePath.split('/').pop() || 'download';

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      // 사용자에게 더 친화적인 오류 메시지 표시
      alert('파일 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      variant={variant}
      size={size}
      className={className}
    >
      {isDownloading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          다운로드 중...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          다운로드
        </>
      )}
    </Button>
  );
} 