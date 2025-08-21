"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { X, FileText, ShoppingCart, FolderOpen, Settings, Sparkles } from "lucide-react";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    title: "프로모션 패키지",
    description: "42개의 고품질 패턴과 도식화를 특별 가격으로 제공합니다."
  },
  {
    icon: <FolderOpen className="w-6 h-6" />,
    title: "드라이브 관리",
    description: "구매한 에셋을 카테고리별로 정리하여 효율적으로 관리하세요."
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "작업지시서 작성",
    description: "AI가 도식화를 분석하여 자동으로 작업지시서를 생성합니다."
  },
  {
    icon: <Settings className="w-6 h-6" />,
    title: "스토리지 제한",
    description: "기본 계정은 1GB 스토리지와 1개 작업지시서 제한이 있습니다."
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI 추천 기능",
    description: "FAQ 선택과 AI 프롬프트로 작업지시서 작성을 도와드립니다."
  }
];

export function WelcomePopup({ isOpen, onClose }: WelcomePopupProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // 로컬 스토리지에 첫 로그인 완료 표시
    localStorage.setItem('faddit_welcome_completed', 'true');
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">faddit에 오신 것을 환영합니다! 🎉</h2>
            <p className="text-sm text-gray-600 mt-1">주요 기능을 간단히 소개해드릴게요</p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {features[currentStep].icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {features[currentStep].title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {features[currentStep].description}
            </p>
          </div>

          {/* 진행 표시 */}
          <div className="flex justify-center space-x-2 mb-6">
            {features.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="text-gray-600"
          >
            건너뛰기
          </Button>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                이전
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === features.length - 1 ? '시작하기' : '다음'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
