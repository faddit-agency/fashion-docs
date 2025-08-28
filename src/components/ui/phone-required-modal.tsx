'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from './button';
import { X, Phone, AlertTriangle } from 'lucide-react';
import PhoneNumberModal from './phone-number-modal';

interface PhoneRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function PhoneRequiredModal({ isOpen, onClose, onComplete }: PhoneRequiredModalProps) {
  const { user } = useUser();
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const handlePhoneComplete = () => {
    setShowPhoneInput(false);
    onComplete();
  };

  const handlePhoneSkip = () => {
    setShowPhoneInput(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">휴대폰 번호 필요</h2>
                <p className="text-sm text-gray-500">생산 의뢰를 위해 필수입니다</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 내용 */}
          <div className="p-6 space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">!</span>
                </div>
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-2">생산 의뢰를 위해 휴대폰 번호가 필요합니다</p>
                  <p>봉제공장 사장님이 디자이너에게 연락할 수 있도록 휴대폰 번호를 입력해주세요.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">현재 상태</p>
                  <p className="text-sm text-gray-500">
                    {user?.phoneNumbers && user.phoneNumbers.length > 0 
                      ? `📱 ${user.phoneNumbers[0].phoneNumber}` 
                      : '휴대폰 번호가 등록되지 않았습니다'}
                  </p>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={() => setShowPhoneInput(true)}
                className="flex-1"
              >
                휴대폰 번호 입력
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 휴대폰 번호 입력 모달 */}
      <PhoneNumberModal
        isOpen={showPhoneInput}
        onClose={handlePhoneSkip}
        onComplete={handlePhoneComplete}
      />
    </>
  );
}
