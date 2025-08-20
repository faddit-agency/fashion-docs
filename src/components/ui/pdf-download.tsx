"use client";

import { useState } from "react";
import { Button } from "./button";
import { PDFGenerator } from "@/lib/pdf-generator";
import { Download, FileText, Image } from "lucide-react";

interface PDFDownloadProps {
  // HTML 요소를 PDF로 변환할 때 사용
  elementRef?: React.RefObject<HTMLElement | null>;
  // 텍스트를 PDF로 변환할 때 사용
  content?: string;
  filename?: string;
  title?: string;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  type?: "element" | "text";
  options?: {
    format?: 'a4' | 'a3' | 'letter' | 'legal';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
    scale?: number;
    fontSize?: number;
    lineHeight?: number;
  };
}

export function PDFDownload({
  elementRef,
  content,
  filename = "document.pdf",
  title = "문서",
  className = "",
  variant = "outline",
  size = "sm",
  type = "element",
  options = {}
}: PDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);

      switch (type) {
        case "element":
          if (elementRef?.current) {
            await PDFGenerator.generatePDFFromElement(
              elementRef.current,
              filename,
              options
            );
          } else {
            throw new Error("HTML 요소를 찾을 수 없습니다.");
          }
          break;

        case "text":
          if (content) {
            PDFGenerator.generatePDFFromText(content, filename, {
              title,
              ...options
            });
          } else {
            throw new Error("텍스트 내용이 없습니다.");
          }
          break;

        default:
          throw new Error("지원하지 않는 PDF 타입입니다.");
      }
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case "element":
        return <Image className="w-4 h-4 mr-2" />;
      case "text":
        return <FileText className="w-4 h-4 mr-2" />;
      default:
        return <Download className="w-4 h-4 mr-2" />;
    }
  };

  const getButtonText = () => {
    if (isGenerating) {
      return "PDF 생성 중...";
    }

    switch (type) {
      case "element":
        return "페이지 PDF 다운로드";
      case "text":
        return "텍스트 PDF 다운로드";
      default:
        return "PDF 다운로드";
    }
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={className}
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {getButtonText()}
        </>
      ) : (
        <>
          {getIcon()}
          {getButtonText()}
        </>
      )}
    </Button>
  );
} 