-- 외래 키 제약 조건 문제 해결

-- 1. 기존 외래 키 제약 조건 제거 (있다면)
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

-- 2. products 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT,
  gender TEXT,
  season TEXT,
  seller_id TEXT,
  file_url TEXT,
  image_urls TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 샘플 상품 데이터 삽입
INSERT INTO products (id, name, description, price, category, gender, season, seller_id, file_url, image_urls, status) VALUES
(1, '남성 기본 반팔 티셔츠 도식화', '기본적인 남성 반팔 티셔츠의 도식화입니다.', 50000, '상의', '남성', '봄/여름', 'seller1', '/files/product1.pdf', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop'], 'active'),
(2, '여성 기본 원피스 도식화', '우아한 여성 원피스 도식화입니다.', 70000, '원피스', '여성', '봄/여름', 'seller1', '/files/product2.pdf', ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop'], 'active'),
(3, '남성 데님 팬츠 패턴', '클래식한 남성 데님 팬츠 패턴입니다.', 60000, '하의', '남성', '사계절', 'seller2', '/files/product3.pdf', ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1000&fit=crop'], 'active'),
(4, '여성 블라우스 도식화', '여성스러운 블라우스 도식화입니다.', 45000, '상의', '여성', '봄/여름', 'seller2', '/files/product4.pdf', ARRAY['https://images.unsplash.com/photo-1564257631407-3deb5d3c3b1c?w=800&h=1000&fit=crop'], 'active'),
(5, '남성 후드 집업 패턴', '편안한 남성 후드 집업 패턴입니다.', 80000, '아우터', '남성', '가을/겨울', 'seller3', '/files/product5.pdf', ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=1000&fit=crop'], 'active'),
(6, '여성 미니 스커트 도식화', '여성스러운 미니 스커트 도식화입니다.', 55000, '하의', '여성', '봄/여름', 'seller3', '/files/product6.pdf', ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop'], 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. cart_items 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS 비활성화
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- 7. updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. products 테이블의 updated_at 트리거도 생성
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
