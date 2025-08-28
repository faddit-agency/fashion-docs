'use client';

import { useEffect, useState } from 'react';

// GTM 이벤트 전송 함수
const pushGTMEvent = (eventName: string, additionalData: Record<string, any> = {}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    const eventData = {
      event: eventName,
      ...additionalData
    };
    window.dataLayer.push(eventData);
    console.log(`GTM Event pushed: ${eventName}`, eventData);
    return true;
  }
  return false;
};

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 페이지 로드 시 이전에 동의했는지 확인
    const hasConsented = localStorage.getItem('cookieConsent') === 'accepted';
    if (!hasConsented) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    // GTM 데이터 레이어에 consent_accepted 이벤트 전송
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'consent_accepted'
      });
      console.log('consent_accepted event pushed to dataLayer');
    }
    
    // 동의 상태를 브라우저에 저장
    localStorage.setItem('cookieConsent', 'accepted');
    
    // 배너 숨기기
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        textAlign: 'center',
        zIndex: 9999,
        fontSize: '14px'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        <span>본 웹사이트는 더 나은 사용자 경험을 위해 쿠키를 사용합니다.</span>
        <button
          onClick={handleAccept}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#0056b3';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#007bff';
          }}
        >
          동의합니다
        </button>
      </div>
    </div>
  );
}
