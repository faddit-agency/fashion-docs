-- Supabase Storage 버킷 생성 및 정책 설정

-- 1. drawings 버킷 생성 (Supabase Dashboard에서 실행)
-- Storage > Buckets > Create bucket
-- Name: drawings
-- Public: true
-- File size limit: 50MB (또는 필요한 크기)
-- Allowed MIME types: image/*, application/pdf, application/illustrator, application/postscript

-- 2. RLS 정책 설정 (SQL Editor에서 실행)

-- drawings 버킷에 대한 SELECT 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Public drawings read access" ON storage.objects
FOR SELECT USING (bucket_id = 'drawings');

-- drawings 버킷에 대한 INSERT 정책 (인증된 사용자만 업로드 가능)
CREATE POLICY "Authenticated drawings upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'drawings' 
  AND auth.role() = 'authenticated'
);

-- drawings 버킷에 대한 UPDATE 정책 (인증된 사용자만 수정 가능)
CREATE POLICY "Authenticated drawings update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'drawings' 
  AND auth.role() = 'authenticated'
);

-- drawings 버킷에 대한 DELETE 정책 (인증된 사용자만 삭제 가능)
CREATE POLICY "Authenticated drawings delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'drawings' 
  AND auth.role() = 'authenticated'
);

-- 3. 임시 해결책: RLS 비활성화 (개발 환경에서만 사용)
-- RLS가 문제를 일으키는 경우 다음 명령어로 비활성화할 수 있습니다:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 4. 대안: 모든 사용자에게 업로드 권한 부여 (개발 환경에서만)
-- 기존 정책 삭제 후 새로운 정책 생성
-- DROP POLICY IF EXISTS "Authenticated drawings upload" ON storage.objects;
-- CREATE POLICY "Public drawings upload" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'drawings');

-- 5. PDF 파일 업로드를 위한 추가 설정
-- Supabase Dashboard에서 Storage > Settings > File size limit을 50MB로 설정
-- Allowed MIME types에 다음을 추가:
-- - application/pdf
-- - application/illustrator
-- - application/postscript
-- - image/* 