"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";

export function Header() {
  const { user, isLoaded } = useUser();
  const { cartCount: _cartCount } = useCart(user?.id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-12">
            <Link href="/" className="flex items-center hover-lift">
              <Image
                src="/logo_faddit.svg"
                alt="Faddit"
                width={96}
                height={21}
                className={`h-6 w-auto ${theme === 'light' ? 'logo-light' : 'logo-dark'}`}
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className={`${isActive("/") ? "text-foreground" : "text-muted-foreground"} hover:text-foreground font-medium transition-colors duration-200 hover-lift`}
              >
                홈
              </Link>
              <Link 
                href="/products" 
                className={`${isActive("/products") ? "text-foreground" : "text-muted-foreground"} hover:text-foreground font-medium transition-colors duration-200 hover-lift`}
              >
                도식화 & 패턴
              </Link>
              <Link 
                href="/worksheet" 
                className={`${isActive("/worksheet") ? "text-foreground" : "text-muted-foreground"} hover:text-foreground font-medium transition-colors duration-200 hover-lift`}
              >
                작업지시서
              </Link>
            </nav>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 hover-lift"
              aria-label={theme === 'light' ? '다크 모드로 변경' : '라이트 모드로 변경'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
            
            {!isLoaded ? (
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse-slow"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Link href="/mypage" className="flex items-center space-x-3 hover-lift">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-foreground hidden sm:block font-medium">
                      {user.firstName || '사용자'}
                    </span>
                  </Link>
                </div>
                <SignOutButton>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-border hover:bg-accent hover:border-primary transition-all duration-200 hover-lift"
                  >
                    로그아웃
                  </Button>
                </SignOutButton>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-muted-foreground hover:text-foreground font-medium transition-colors duration-200 hover-lift"
                >
                  로그인
                </Link>
                <Button 
                  asChild 
                  className="bg-primary hover:bg-primary/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                >
                  <Link href="/sign-up">
                    회원가입
                  </Link>
                </Button>
              </>
            )}
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className={`${isActive("/") ? "text-foreground" : "text-muted-foreground"} hover:text-foreground font-medium transition-colors duration-200`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                홈
              </Link>
              <Link 
                href="/products" 
                className={`${isActive("/products") ? "text-foreground" : "text-muted-foreground"} hover:text-foreground font-medium transition-colors duration-200`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                도식화 & 패턴
              </Link>
              <Link 
                href="/worksheet" 
                className={`${isActive("/worksheet") ? "text-foreground" : "text-muted-foreground"} hover:text-foreground font-medium transition-colors duration-200`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                작업지시서
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 