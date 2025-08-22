import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fromPath } from 'pdf2pic';

/* eslint-disable @typescript-eslint/no-require-imports */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'drawings';
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // PDF 파일인지 확인
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'pdf') {
      return NextResponse.json(
        { error: 'PDF 파일만 변환 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일명에서 특수문자 제거 및 안전한 파일명 생성
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .replace(/\.pdf$/i, '.png'); // PDF 확장자를 PNG로 변경
    
    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // PDF를 이미지로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 임시 파일로 저장
    const tempPdfPath = `/tmp/${Date.now()}-temp.pdf`;
    const fs = require('fs');
    fs.writeFileSync(tempPdfPath, buffer);

    // PDF를 이미지로 변환
    const options = {
      density: 100,
      saveFilename: fileName.replace('.png', ''),
      savePath: '/tmp',
      format: 'png',
      width: 800,
      height: 600
    };

    const convert = fromPath(tempPdfPath, options);
    const pageData = await convert(1); // 첫 페이지만 변환

    // 변환된 이미지 파일 읽기
    const imagePath = `/tmp/${fileName.replace('.png', '')}.1.png`;
    const imageBuffer = fs.readFileSync(imagePath);

    // 임시 파일들 삭제
    fs.unlinkSync(tempPdfPath);
    fs.unlinkSync(imagePath);

    // 이미지 파일 생성 (Buffer를 Uint8Array로 변환)
    const imageFile = new File([new Uint8Array(imageBuffer)], fileName, { type: 'image/png' });

    console.log('PDF 변환 파일 정보:', {
      originalName: file.name,
      convertedName: fileName,
      filePath: filePath,
      fileSize: imageFile.size
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('변환된 파일 업로드 실패:', error);
      return NextResponse.json(
        { error: `파일 변환 실패: ${error.message}` },
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
      path: filePath,
      message: 'PDF 파일이 이미지로 변환되어 업로드되었습니다.'
    });

  } catch (error) {
    console.error('PDF 변환 오류:', error);
    return NextResponse.json(
      { error: 'PDF 변환 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
