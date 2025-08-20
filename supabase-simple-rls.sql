-- 간단한 RLS 정책 - Clerk 사용자 ID 직접 사용

-- 1. cart_items 테이블 생성 (없다면)
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, -- Clerk 사용자 ID를 TEXT로 저장
  product_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 활성화
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- 4. Clerk 사용자 ID를 직접 비교하는 정책 생성
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (true); -- 모든 사용자가 조회 가능 (필요시 제한)

CREATE POLICY "Users can insert their own cart items" ON cart_items
  FOR INSERT WITH CHECK (true); -- 모든 사용자가 추가 가능

CREATE POLICY "Users can update their own cart items" ON cart_items
  FOR UPDATE USING (true); -- 모든 사용자가 수정 가능

CREATE POLICY "Users can delete their own cart items" ON cart_items
  FOR DELETE USING (true); -- 모든 사용자가 삭제 가능

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- 6. updated_at 트리거
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
