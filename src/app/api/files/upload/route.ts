import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 검증
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('환경 변수 확인:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl?.substring(0, 20) + '...'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { 
          error: '서버 설정 오류: Supabase 환경 변수가 없습니다.',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey
          }
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'faddit-files'; // drawings에서 faddit-files로 변경
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (Supabase Storage 제한 고려)
    const maxSize = 5 * 1024 * 1024; // 5MB로 줄임 (Supabase 제한)
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `파일 크기가 너무 큽니다. 최대 ${maxSize / (1024 * 1024)}MB까지 지원됩니다. (현재: ${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    // 파일명에서 특수문자 제거 및 안전한 파일명 생성
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
    
    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // AI/EPS/PDF 파일의 MIME 타입 처리
    let fileToUpload = file;
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'ai' || fileExtension === 'eps') {
      // AI/EPS 파일을 MIME 타입 없이 처리 (Supabase에서 자동 감지)
      fileToUpload = new File([file], file.name);
    } else if (fileExtension === 'pdf') {
      // PDF 파일의 경우 MIME 타입을 명시적으로 설정
      fileToUpload = new File([file], file.name, { type: 'application/pdf' });
    } else if (fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'jpeg') {
      // 이미지 파일의 경우 MIME 타입을 명시적으로 설정
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      fileToUpload = new File([file], file.name, { type: mimeType });
    }

    console.log('서버 업로드 파일 정보:', {
      originalName: file.name,
      safeName: safeFileName,
      filePath: filePath,
      fileSize: file.size,
      mimeType: fileToUpload.type,
      bucket: bucket
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage 업로드 실패:', error);
      return NextResponse.json(
        { error: `파일 업로드 실패: ${error.message}` },
        { status: 400 }
      );
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath
    });

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    
    // 오류 타입에 따른 적절한 응답
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `파일 업로드 오류: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: '알 수 없는 파일 업로드 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
}
