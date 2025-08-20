-- 임시로 RLS를 비활성화하여 장바구니 기능 테스트

-- 1. cart_items 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 비활성화 (임시)
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- 4. updated_at 트리거
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

-- 5. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO cart_items (user_id, product_id, quantity) VALUES 
-- ('user_30J9JBnucZxR3lppkDpS10bbM75', 1, 2),
-- ('user_30J9JBnucZxR3lppkDpS10bbM75', 2, 1);
