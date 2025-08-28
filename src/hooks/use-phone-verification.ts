'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export function usePhoneVerification() {
  const { user, isLoaded } = useUser();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [hasCheckedPhone, setHasCheckedPhone] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // 이미 휴대폰 번호가 있는지 확인
    const hasPhoneNumber = user.phoneNumbers && user.phoneNumbers.length > 0;
    const savedPhoneNumber = localStorage.getItem('userPhoneNumber');
    
    // 소셜 로그인 사용자이고 휴대폰 번호가 없는 경우
    const isSocialUser = user.externalAccounts && user.externalAccounts.length > 0;
    
    if (isSocialUser && !hasPhoneNumber && !savedPhoneNumber && !hasCheckedPhone) {
      // 약간의 지연 후 모달 표시 (페이지 로딩 완료 후)
      const timer = setTimeout(() => {
        setShowPhoneModal(true);
        setHasCheckedPhone(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoaded, hasCheckedPhone]);

  const handlePhoneComplete = () => {
    setShowPhoneModal(false);
  };

  const handlePhoneSkip = () => {
    setShowPhoneModal(false);
    setHasCheckedPhone(true);
    // 나중에 다시 보지 않도록 설정
    localStorage.setItem('phoneModalSkipped', 'true');
  };

  const hasPhoneNumber = () => {
    if (!user) return false;
    return user.phoneNumbers && user.phoneNumbers.length > 0;
  };

  return {
    showPhoneModal,
    setShowPhoneModal,
    handlePhoneComplete,
    handlePhoneSkip,
    hasPhoneNumber: hasPhoneNumber(),
    isSocialUser: user?.externalAccounts && user.externalAccounts.length > 0
  };
}
