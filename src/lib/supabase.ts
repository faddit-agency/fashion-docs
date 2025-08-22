import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 설정이 있는지 확인
const hasSupabaseConfig = supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = hasSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Supabase 설정 상태 로깅
if (typeof window === 'undefined') { // 서버 사이드에서만 로깅
  console.log('Supabase 설정 상태:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    configured: hasSupabaseConfig,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'None'
  });
}

// 데이터베이스 타입 정의
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number; // 원래 가격 (할인 시)
  category: string;
  gender: string;
  season: string;
  seller_id: string;
  file_url: string;
  image_urls: string[];
  status?: 'active' | 'inactive';
  is_promotion?: boolean; // 프로모션 상품 여부
  promotion_code?: string; // 프로모션 코드
  items_count?: number; // 패키지 상품의 경우 아이템 개수
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface Purchase {
  id: number;
  user_id: string;
  product_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_key?: string;
  created_at: string;
}

export interface Worksheet {
  id: number;
  user_id: string;
  title: string;
  category: string;
  size_range: string;
  content: any; // JSON 형태로 저장
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
  product?: Product; // 조인된 상품 정보
} 