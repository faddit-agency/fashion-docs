import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Supabase 설정이 기본값인지 확인
const isDefaultConfig = supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your-anon-key';

export const supabase = isDefaultConfig 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);

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