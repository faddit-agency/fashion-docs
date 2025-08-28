'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from './button';
import { X, Phone, AlertCircle } from 'lucide-react';

interface PhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function PhoneNumberModal({ isOpen, onClose, onComplete }: PhoneNumberModalProps) {
  const { user } = useUser();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // 기존 휴대폰 번호가 있으면 불러오기
      const existingPhone = user.phoneNumbers[0]?.phoneNumber;
      if (existingPhone) {
        setPhoneNumber(existingPhone);
        setIsValid(true);
      }
    }
  }, [isOpen, user]);

  const validatePhoneNumber = (phone: string) => {
    // 한국 휴대폰 번호 형식 검증 (010-1234-5678, 01012345678 등)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setError(null);
    
    // 자동 하이픈 추가
    let formatted = value.replace(/[^0-9]/g, '');
    if (formatted.length >= 3 && formatted.length <= 7) {
      formatted = formatted.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else if (formatted.length >= 8) {
      formatted = formatted.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
    }
    
    setPhoneNumber(formatted);
    setIsValid(validatePhoneNumber(formatted));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clerk 사용자 정보에 휴대폰 번호 추가
      await user?.update({
        phoneNumbers: [phoneNumber]
      });

      // 로컬 스토리지에 휴대폰 번호 저장
      localStorage.setItem('userPhoneNumber', phoneNumber);
      
      onComplete();
    } catch (err) {
      console.error('휴대폰 번호 업데이트 실패:', err);
      setError('휴대폰 번호 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">휴대폰 번호 입력</h2>
              <p className="text-sm text-gray-500">봉제공장 연락을 위해 필요합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                휴대폰 번호 *
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="010-1234-5678"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  phoneNumber && !isValid ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {phoneNumber && !isValid && (
                <p className="text-sm text-red-500 mt-1">
                  올바른 휴대폰 번호 형식으로 입력해주세요 (예: 010-1234-5678)
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">!</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">휴대폰 번호가 필요한 이유</p>
                  <p>봉제공장 사장님이 디자이너에게 연락할 수 있도록 휴대폰 번호를 입력해주세요.</p>
                </div>
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
              disabled={isLoading}
            >
              나중에
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  저장 중...
                </div>
              ) : (
                '저장하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
