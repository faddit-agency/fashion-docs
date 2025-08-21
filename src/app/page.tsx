"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { ArrowRight, Sparkles, Users, FileText, ShoppingBag } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { WelcomePopup } from "@/components/ui/welcome-popup";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function Home() {
  const { theme } = useTheme();
  const { user, isLoaded } = useUser();
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // 첫 로그인 팝업 표시 여부 확인
  useEffect(() => {
    if (isLoaded && user) {
      const welcomeCompleted = localStorage.getItem('faddit_welcome_completed');
      if (!welcomeCompleted) {
        setShowWelcomePopup(true);
      }
    }
  }, [isLoaded, user]);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="hero-section relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <Image
                src="/logo_faddit.svg"
                alt="Faddit"
                width={200}
                height={44}
                className={`mx-auto h-12 w-auto hover-lift ${theme === 'light' ? 'logo-light' : 'logo-dark'}`}
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
              의류 제작의 새로운 시작
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
              도식화와 패턴을 사고팔 수 있는 B2B 커머스 플랫폼
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold"
              >
                상품 둘러보기
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/worksheet"
                className="btn-secondary inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold"
              >
                작업지시서 만들기
                <Sparkles className="w-5 h-5" />
              </Link>
            {/* 드라이브 버튼 제거: 드라이브는 마이페이지에서만 접근 */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Faddit의 핵심 기능
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              의류 제작 과정을 더욱 효율적으로 만들어드립니다
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="icon-container w-16 h-16 mx-auto mb-6">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">도식화 & 패턴 거래</h3>
              <p className="text-muted-foreground leading-relaxed">
                전문가들이 제작한 고품질 도식화와 패턴을 안전하게 거래하세요
              </p>
            </div>
            
            <div className="card text-center animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="icon-container w-16 h-16 mx-auto mb-6">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">GPT 자동 작업지시서</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI가 도식화를 분석하여 작업지시서를 자동으로 생성해드립니다
              </p>
            </div>
            
            <div className="card text-center animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="icon-container w-16 h-16 mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">생산 의뢰 연결</h3>
              <p className="text-muted-foreground leading-relaxed">
                작업지시서를 바탕으로 신뢰할 수 있는 생산업체와 연결해드립니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Users Section */}
      <section className="py-24 section-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              누구를 위한 서비스인가요?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              다양한 사용자들이 Faddit을 통해 가치를 창출하고 있습니다
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card hover-lift animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="icon-container w-12 h-12 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">디자이너 / 브랜드 운영자</h3>
              <p className="text-muted-foreground leading-relaxed">
                고품질 패턴과 도식화를 구매하여 제품 개발 시간을 단축하세요
              </p>
            </div>
            
            <div className="card hover-lift animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="icon-container w-12 h-12 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">패턴 디자이너</h3>
              <p className="text-muted-foreground leading-relaxed">
                자신의 패턴을 판매하여 수익을 창출하고 새로운 기회를 만들어보세요
              </p>
            </div>
            
            <div className="card hover-lift animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="icon-container w-12 h-12 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">생산업체</h3>
              <p className="text-muted-foreground leading-relaxed">
                작업지시서를 통해 효율적인 생산 계획을 수립하고 품질을 향상시키세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="stats-item animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="text-3xl font-bold text-foreground mb-2">1000+</div>
              <div className="text-muted-foreground">등록된 패턴</div>
            </div>
            <div className="stats-item animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="text-3xl font-bold text-foreground mb-2">500+</div>
              <div className="text-muted-foreground">활성 사용자</div>
            </div>
            <div className="stats-item animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="text-3xl font-bold text-foreground mb-2">50+</div>
              <div className="text-muted-foreground">생산 파트너</div>
            </div>
            <div className="stats-item animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="text-3xl font-bold text-foreground mb-2">99%</div>
              <div className="text-muted-foreground">고객 만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 cta-section relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 text-white animate-fade-in">
            의류 제작의 새로운 패러다임을 경험해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link
              href="/products"
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 hover-lift inline-flex items-center gap-2"
            >
              상품 둘러보기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/sign-up"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-all duration-200 hover-lift"
            >
              회원가입
            </Link>
          </div>
        </div>
      </section>

      {/* Seller Registration Section */}
      <section className="py-24 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              판매자가 되어보세요
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              당신의 패턴과 도식화를 Faddit에서 판매하고 수익을 창출하세요
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="card p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  판매자 등록 혜택
                </h3>
                <ul className="space-y-4 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>전국 패턴 디자이너와 브랜드에게 노출</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>안전한 결제 시스템으로 안정적인 수익 창출</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>AI 작업지시서 자동 생성으로 고객 만족도 향상</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>전문적인 마케팅 지원 및 판매 통계 제공</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="animate-fade-in">
              <div className="card p-8 text-center">
                <div className="icon-container w-16 h-16 mx-auto mb-6">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  판매자 등록하기
                </h3>
                <p className="text-muted-foreground mb-8">
                  간단한 절차로 판매자로 등록하고 당신의 패턴을 판매해보세요
                </p>
                <Link
                  href="/seller"
                  className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold"
                >
                  판매자 등록
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <Image
                src="/logo_faddit.svg"
                alt="Faddit"
                width={120}
                height={26}
                className={`mx-auto h-8 w-auto ${theme === 'light' ? 'logo-light' : 'logo-dark'}`}
              />
            </div>
            <p className="text-gray-300 mb-4">
              의류 제작의 새로운 패러다임을 만들어갑니다
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-300">
              <Link href="/products" className="hover:text-white transition-colors duration-200">
                상품
              </Link>
              <Link href="/worksheet" className="hover:text-white transition-colors duration-200">
                작업지시서
              </Link>
              <Link href="/mypage" className="hover:text-white transition-colors duration-200">
                마이페이지
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-600">
              <p className="text-gray-400">
                © 2024 Faddit. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* 첫 로그인 팝업 */}
      <WelcomePopup 
        isOpen={showWelcomePopup} 
        onClose={() => setShowWelcomePopup(false)} 
      />
    </div>
  );
}
