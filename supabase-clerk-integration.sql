-- Clerk와 Supabase 연동을 위한 설정

-- 1. Clerk 사용자를 Supabase auth.users에 동기화하는 함수
CREATE OR REPLACE FUNCTION handle_clerk_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Clerk 사용자 ID를 Supabase auth.users에 삽입
  INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    encrypted_password,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    NEW.id::uuid,
    NEW.email_addresses[1]->>'email_address',
    CASE WHEN NEW.email_addresses[1]->>'verification' = 'verified' THEN NOW() ELSE NULL END,
    NEW.created_at,
    NEW.updated_at,
    jsonb_build_object(
      'provider', 'clerk',
      'providers', ARRAY['clerk']
    ),
    jsonb_build_object(
      'first_name', COALESCE(NEW.first_name, ''),
      'last_name', COALESCE(NEW.last_name, ''),
      'clerk_id', NEW.id
    ),
    false,
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = EXCLUDED.updated_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clerk 사용자 테이블 생성 (웹훅에서 사용)
CREATE TABLE IF NOT EXISTS clerk_users (
  id TEXT PRIMARY KEY,
  email_addresses JSONB,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Clerk 사용자 변경 시 트리거
DROP TRIGGER IF EXISTS on_clerk_user_change ON clerk_users;
CREATE TRIGGER on_clerk_user_change
  AFTER INSERT OR UPDATE ON clerk_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_clerk_user();

-- 4. RLS 정책 수정 - Clerk 사용자 ID 지원
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- Clerk 사용자 ID를 지원하는 새로운 정책
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can insert their own cart items" ON cart_items
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text OR 
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can update their own cart items" ON cart_items
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR 
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "Users can delete their own cart items" ON cart_items
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR 
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
  );
