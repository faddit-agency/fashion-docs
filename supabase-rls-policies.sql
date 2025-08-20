-- cart_items 테이블에 대한 RLS 정책 설정

-- 1. cart_items 테이블이 존재하지 않으면 생성
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 활성화
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- 4. 새로운 RLS 정책 생성

-- 사용자가 자신의 장바구니 아이템을 조회할 수 있음
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- 사용자가 자신의 장바구니에 아이템을 추가할 수 있음
CREATE POLICY "Users can insert their own cart items" ON cart_items
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 사용자가 자신의 장바구니 아이템을 수정할 수 있음
CREATE POLICY "Users can update their own cart items" ON cart_items
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 사용자가 자신의 장바구니 아이템을 삭제할 수 있음
CREATE POLICY "Users can delete their own cart items" ON cart_items
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 5. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- 6. 외래 키 제약 조건 (products 테이블이 존재한다면)
-- ALTER TABLE cart_items ADD CONSTRAINT fk_cart_items_product_id 
--   FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 7. updated_at 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
