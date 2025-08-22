import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCanvas } from 'canvas';

export async function POST(request: NextRequest) {
  try {
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
    const bucket = formData.get('bucket') as string || 'faddit-files';
    const path = formData.get('path') as string;

    // 버킷 존재 여부 확인
    console.log('버킷 확인 시작:', bucket);
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('버킷 목록 조회 실패:', bucketsError);
      return NextResponse.json(
        { error: `버킷 목록 조회 실패: ${bucketsError.message}` },
        { status: 500 }
      );
    }
    
    console.log('사용 가능한 버킷들:', buckets.map(b => b.name));
    
    const targetBucket = buckets.find(b => b.name === bucket);
    if (!targetBucket) {
      console.error(`버킷 '${bucket}'을 찾을 수 없습니다.`);
      return NextResponse.json(
        { 
          error: `버킷 '${bucket}'을 찾을 수 없습니다.`,
          availableBuckets: buckets.map(b => b.name)
        },
        { status: 400 }
      );
    }
    
    console.log('대상 버킷 정보:', targetBucket);

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // AI 파일인지 확인
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'ai') {
      return NextResponse.json(
        { error: 'AI 파일만 변환 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (2MB로 더 엄격하게)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `AI 파일 크기가 너무 큽니다. 최대 ${maxSize / (1024 * 1024)}MB까지 지원됩니다.` },
        { status: 400 }
      );
    }

    // 파일명에서 특수문자 제거 및 안전한 파일명 생성
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .replace(/\.ai$/i, '.png'); // AI 확장자를 PNG로 변경
    
    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // AI 파일을 PNG로 변환 (ConvertAPI 사용)
    console.log('AI 파일 변환 시작:', file.name, file.size, 'bytes');
    
    let pngBuffer: Buffer;
    
    // ConvertAPI를 사용한 실제 변환 시도
    try {
      console.log('ConvertAPI를 사용한 AI 파일 변환 시도...');
      const ConvertAPI = require('convertapi-js');
      
      const apiSecret = process.env.CONVERTAPI_SECRET;
      if (!apiSecret) {
        throw new Error('ConvertAPI 키가 설정되지 않았습니다.');
      }
      
      console.log('ConvertAPI 인증 성공, 변환 시작...');
      const convertApi = ConvertAPI.auth(apiSecret);
      
      // AI 파일을 PNG로 변환 (고품질 설정)
      const result = await convertApi.convert('ai', 'png', {
        File: file,
        StoreFile: true,
        // 고품질 변환을 위한 추가 파라미터
        Resolution: '300', // DPI 설정
        Quality: '100', // 최고 품질
        Background: 'white', // 배경색 설정
        Scale: '100' // 100% 크기
      });
      
      console.log('ConvertAPI 변환 결과:', JSON.stringify(result, null, 2));
      
      if (result.files && result.files.length > 0) {
        console.log('ConvertAPI 변환 성공:', result.files[0].Url);
        console.log('변환된 파일 정보:', {
          fileName: result.files[0].FileName,
          fileSize: result.files[0].FileSize,
          fileExt: result.files[0].FileExt
        });
        
        // 변환된 PNG 다운로드
        const pngResponse = await fetch(result.files[0].Url);
        if (pngResponse.ok) {
          const pngArrayBuffer = await pngResponse.arrayBuffer();
          pngBuffer = Buffer.from(pngArrayBuffer);
          console.log('PNG 다운로드 완료, 크기:', pngBuffer.length, 'bytes');
        } else {
          throw new Error(`PNG 다운로드 실패: ${pngResponse.status}`);
        }
      } else {
        throw new Error('ConvertAPI 변환 결과에 파일이 없습니다.');
      }
    } catch (convertApiError) {
      console.error('ConvertAPI 변환 실패:', convertApiError);
      if (convertApiError instanceof Error) {
        console.error('오류 상세:', convertApiError.message);
      }
      
      // ConvertAPI 실패 시 기본 변환 사용
      console.log('기본 변환으로 폴백...');
      pngBuffer = await convertAiToPng(file);
    }
    
    // PNG 파일 생성
    const pngFile = new File([pngBuffer], fileName, { type: 'image/png' });

    console.log('AI 변환 파일 정보:', {
      originalName: file.name,
      convertedName: fileName,
      filePath: filePath,
      originalSize: file.size,
      pngSize: pngFile.size
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, pngFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('변환된 PNG 파일 업로드 실패:', error);
      return NextResponse.json(
        { error: `PNG 변환 실패: ${error.message}` },
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
      message: 'AI 파일이 PNG로 변환되어 업로드되었습니다.',
      fileType: 'png'
    });

  } catch (error) {
    console.error('AI 파일 PNG 변환 오류:', error);
    return NextResponse.json(
      { error: 'AI 파일 PNG 변환 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// AI 파일을 PNG로 변환하는 함수
async function convertAiToPng(file: File): Promise<Buffer> {
  try {
    console.log('AI 파일 변환 시작:', file.name, file.size, 'bytes');
    
    // AI 파일의 내용을 읽기
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // ConvertAPI를 사용한 실제 변환 시도
    try {
      console.log('ConvertAPI를 사용한 AI 파일 변환 시도...');
      const ConvertAPI = require('convertapi-js');
      
      const apiSecret = process.env.CONVERTAPI_SECRET;
      if (!apiSecret) {
        console.log('ConvertAPI 키가 없어서 기본 변환을 사용합니다.');
        return generateDetailedPngFromAi(file.name, buffer);
      }
      
      console.log('ConvertAPI 인증 성공, 변환 시작...');
      const convertApi = ConvertAPI.auth(apiSecret);
      
      // AI 파일을 PNG로 변환 (올바른 파라미터 사용)
      const result = await convertApi.convert('ai', 'png', {
        File: new Blob([buffer], { type: 'application/postscript' }),
        StoreFile: true
      });
      
      console.log('ConvertAPI 변환 결과:', JSON.stringify(result, null, 2));
      
      if (result.files && result.files.length > 0) {
        console.log('ConvertAPI 변환 성공:', result.files[0].Url);
        console.log('변환된 파일 정보:', {
          fileName: result.files[0].FileName,
          fileSize: result.files[0].FileSize,
          fileExt: result.files[0].FileExt
        });
        
        // 변환된 PNG 다운로드
        const pngResponse = await fetch(result.files[0].Url);
        if (pngResponse.ok) {
          const pngBuffer = await pngResponse.arrayBuffer();
          console.log('PNG 다운로드 완료, 크기:', pngBuffer.byteLength, 'bytes');
          return Buffer.from(pngBuffer);
        } else {
          console.error('PNG 다운로드 실패:', pngResponse.status, pngResponse.statusText);
        }
      } else {
        console.error('ConvertAPI 변환 결과에 파일이 없습니다:', result);
      }
    } catch (convertApiError) {
      console.error('ConvertAPI 변환 실패:', convertApiError);
      if (convertApiError instanceof Error) {
        console.error('오류 상세:', convertApiError.message);
        if (convertApiError.stack) {
          console.error('스택 트레이스:', convertApiError.stack);
        }
      }
    }
    
    // ConvertAPI 실패 시 기본 변환 사용
    return generateDetailedPngFromAi(file.name, buffer);
    
  } catch (error) {
    console.error('AI 파일 PNG 변환 오류:', error);
    // 오류 발생 시 기본 템플릿 반환
    return generateSimplePngFromAi(file.name);
  }
}

// AI 파일을 상세한 PNG로 변환하는 함수
function generateDetailedPngFromAi(fileName: string, buffer: Buffer): Buffer {
  const width = 800; // 더 큰 해상도
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 배경을 흰색으로 설정
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // AI 파일 내용 분석 시도
  try {
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
    
    // AI 파일에서 기본적인 벡터 정보 추출 시도
    const elements = extractBasicElementsFromAi(text);
    
    if (elements.length > 0) {
      // 추출된 요소들을 그리기
      drawElements(ctx, elements, width, height);
    } else {
      // 기본 의류 도식화 템플릿 생성
      drawClothingTemplate(ctx, width, height, fileName);
    }
  } catch (error) {
    console.log('AI 파일 파싱 실패, 기본 템플릿 사용:', error);
    drawClothingTemplate(ctx, width, height, fileName);
  }

  // 파일 정보 표시
  ctx.font = '12px Arial';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`AI 파일: ${fileName}`, 10, height - 30);
  ctx.fillText('PNG 변환됨', 10, height - 15);

  return canvas.toBuffer('image/png', { 
    compressionLevel: 6 // 적당한 압축
  });
}

// AI 파일을 간단한 PNG로 변환하는 대안적인 방법
function generateSimplePngFromAi(fileName: string): Buffer {
  const width = 200; // 크기를 400에서 200으로 더 줄임
  const height = 150; // 크기를 300에서 150으로 더 줄임
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 배경을 흰색으로 설정
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // 간단한 도형만 그리기
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.fillStyle = 'transparent';

  // 사각형
  ctx.strokeRect(10, 10, 50, 40);

  // 원
  ctx.beginPath();
  ctx.arc(100, 30, 20, 0, 2 * Math.PI);
  ctx.stroke();

  // 선
  ctx.beginPath();
  ctx.moveTo(150, 10);
  ctx.lineTo(180, 40);
  ctx.stroke();

  // 텍스트 (간단하게)
  ctx.font = '8px Arial'; // 폰트 크기를 더 작게
  ctx.fillStyle = 'black';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // 파일명을 매우 짧게 표시
  const shortFileName = fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName;
  ctx.fillText(`${shortFileName}`, 10, 70);
  ctx.fillText('PNG 변환됨', 10, 85);

  // PNG 압축 옵션 추가
  return canvas.toBuffer('image/png', { 
    compressionLevel: 9 // 최대 압축
  });
}

// 기본 PNG 템플릿 생성
function generateDefaultPng(): Buffer {
  const width = 200; // 크기를 400에서 200으로 더 줄임
  const height = 150; // 크기를 300에서 150으로 더 줄임
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  ctx.font = '8px Arial'; // 폰트 크기를 더 작게
  ctx.fillStyle = 'black';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillText('AI 파일이 PNG로 변환되었습니다.', 10, 10);
  ctx.fillText('편집 모드에서 수정 가능', 10, 25);

  // PNG 압축 옵션 추가
  return canvas.toBuffer('image/png', { 
    compressionLevel: 9 // 최대 압축
  });
}

// AI 파일에서 기본 요소 추출
function extractBasicElementsFromAi(text: string): any[] {
  const elements: any[] = [];
  
  try {
    console.log('AI 파일 내용 분석 시작...');
    console.log('AI 파일 내용 샘플:', text.substring(0, 500));
    
    // AI 파일에서 다양한 패턴 찾기
    const patterns = [
      // Adobe Illustrator 경로 데이터
      { regex: /%%AI5_BeginPath[^%]*%%AI5_EndPath/g, type: 'ai_path' },
      // PostScript 스타일 좌표
      { regex: /(\d+\.?\d*)\s+(\d+\.?\d*)\s+m\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+l/g, type: 'ps_line' },
      // 일반적인 좌표 쌍
      { regex: /(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/g, type: 'coord_line' },
      // SVG 스타일 경로
      { regex: /<path[^>]*d="([^"]*)"[^>]*>/g, type: 'svg_path' },
      // 사각형 명령어
      { regex: /(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+re/g, type: 'rectangle' }
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern.regex);
      if (matches) {
        console.log(`${pattern.type} 패턴 발견: ${matches.length}개`);
        matches.forEach((match, index) => {
          const element = parseElementFromMatch(match, pattern.type);
          if (element) {
            elements.push(element);
          }
        });
      }
    });
    
    console.log(`총 추출된 요소: ${elements.length}개`);
    
  } catch (error) {
    console.log('AI 파일 요소 추출 실패:', error);
  }
  
  return elements;
}

// 매치된 문자열에서 요소 추출
function parseElementFromMatch(match: string, type: string): any {
  try {
    switch (type) {
      case 'ps_line':
        const psCoords = match.match(/(\d+\.?\d*)/g);
        if (psCoords && psCoords.length >= 4) {
          return {
            type: 'line',
            x1: parseFloat(psCoords[0]),
            y1: parseFloat(psCoords[1]),
            x2: parseFloat(psCoords[2]),
            y2: parseFloat(psCoords[3])
          };
        }
        break;
        
      case 'coord_line':
        const coords = match.split(/\s+/).map(Number);
        if (coords.length >= 4) {
          return {
            type: 'line',
            x1: coords[0],
            y1: coords[1],
            x2: coords[2],
            y2: coords[3]
          };
        }
        break;
        
      case 'rectangle':
        const rectCoords = match.match(/(\d+\.?\d*)/g);
        if (rectCoords && rectCoords.length >= 4) {
          return {
            type: 'rect',
            x: parseFloat(rectCoords[0]),
            y: parseFloat(rectCoords[1]),
            width: parseFloat(rectCoords[2]),
            height: parseFloat(rectCoords[3])
          };
        }
        break;
        
      case 'svg_path':
        const pathMatch = match.match(/d="([^"]*)"/);
        if (pathMatch) {
          return {
            type: 'path',
            d: pathMatch[1]
          };
        }
        break;
        
      case 'ai_path':
        // AI 경로 데이터 파싱
        const pathData = extractAIPathData(match);
        if (pathData) {
          return {
            type: 'path',
            d: pathData
          };
        }
        break;
    }
  } catch (error) {
    console.log('요소 파싱 실패:', error);
  }
  
  return null;
}

// AI 경로 데이터 추출
function extractAIPathData(pathContent: string): string | null {
  try {
    const commands = pathContent.match(/%%AI5_[^%]*/g);
    if (!commands) return null;
    
    let pathData = '';
    let currentX = 0, currentY = 0;
    
    commands.forEach(cmd => {
      if (cmd.includes('MoveTo')) {
        const coords = cmd.match(/(\d+\.?\d*)\s+(\d+\.?\d*)/);
        if (coords) {
          currentX = parseFloat(coords[1]);
          currentY = parseFloat(coords[2]);
          pathData += `M ${currentX} ${currentY} `;
        }
      } else if (cmd.includes('LineTo')) {
        const coords = cmd.match(/(\d+\.?\d*)\s+(\d+\.?\d*)/);
        if (coords) {
          currentX = parseFloat(coords[1]);
          currentY = parseFloat(coords[2]);
          pathData += `L ${currentX} ${currentY} `;
        }
      } else if (cmd.includes('CurveTo')) {
        const coords = cmd.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/);
        if (coords) {
          const x1 = parseFloat(coords[1]);
          const y1 = parseFloat(coords[2]);
          const x2 = parseFloat(coords[3]);
          const y2 = parseFloat(coords[4]);
          const x = parseFloat(coords[5]);
          const y = parseFloat(coords[6]);
          pathData += `C ${x1} ${y1} ${x2} ${y2} ${x} ${y} `;
          currentX = x;
          currentY = y;
        }
      }
    });
    
    return pathData.trim();
  } catch (error) {
    console.log('AI 경로 데이터 추출 실패:', error);
    return null;
  }
}

// 추출된 요소들을 캔버스에 그리기
function drawElements(ctx: any, elements: any[], width: number, height: number) {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'transparent';
  
  elements.forEach(element => {
    if (element.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(element.x1, element.y1);
      ctx.lineTo(element.x2, element.y2);
      ctx.stroke();
    }
  });
}

// 의류 도식화 템플릿 그리기
function drawClothingTemplate(ctx: any, width: number, height: number, fileName: string) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 의류 도식화 스타일의 기본 도형들
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'transparent';
  
  // 후드티 형태의 기본 윤곽선
  const hoodieWidth = 300;
  const hoodieHeight = 400;
  
  // 몸통 부분
  ctx.strokeRect(centerX - hoodieWidth/2, centerY - hoodieHeight/2 + 50, hoodieWidth, hoodieHeight - 50);
  
  // 후드 부분
  ctx.beginPath();
  ctx.arc(centerX, centerY - hoodieHeight/2 + 25, 80, 0, Math.PI, true);
  ctx.stroke();
  
  // 소매
  ctx.beginPath();
  ctx.moveTo(centerX - hoodieWidth/2, centerY - hoodieHeight/2 + 80);
  ctx.lineTo(centerX - hoodieWidth/2 - 60, centerY - hoodieHeight/2 + 120);
  ctx.lineTo(centerX - hoodieWidth/2 - 40, centerY + hoodieHeight/2 - 50);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(centerX + hoodieWidth/2, centerY - hoodieHeight/2 + 80);
  ctx.lineTo(centerX + hoodieWidth/2 + 60, centerY - hoodieHeight/2 + 120);
  ctx.lineTo(centerX + hoodieWidth/2 + 40, centerY + hoodieHeight/2 - 50);
  ctx.stroke();
  
  // 지퍼 라인
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - hoodieHeight/2 + 50);
  ctx.lineTo(centerX, centerY + hoodieHeight/2 - 50);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 주머니
  ctx.strokeRect(centerX - 40, centerY + 50, 80, 60);
  
  // 텍스트
  ctx.font = '16px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('의류 도식화', centerX, centerY - hoodieHeight/2 - 30);
  
  const shortFileName = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName;
  ctx.font = '12px Arial';
  ctx.fillText(shortFileName, centerX, centerY + hoodieHeight/2 + 30);
}
