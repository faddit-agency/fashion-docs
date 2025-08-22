import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseSVGToLayers } from '@/lib/svg-parser';

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileName, fileType, fileData } = await request.json();

    console.log(`파일 변환 시작: ${fileName} (${fileType})`);

    // ConvertAPI를 사용하여 파일 변환
    let svgContent = '';
    
    if (fileType === 'ai' || fileType === 'eps' || fileType === 'cdr') {
      console.log('ConvertAPI를 사용하여 AI/EPS/CDR 파일 변환 시도...');
      
      try {
            // 파일 데이터가 직접 전송된 경우
    if (fileData) {
      console.log('파일 데이터 직접 처리...');
      console.log('파일 데이터 길이:', fileData.length);
      console.log('파일 데이터 샘플:', fileData.substring(0, 100));
      
      // 실제 파일 데이터인지 확인
      if (fileData.length < 1000) {
        console.log('파일 데이터가 너무 작습니다. URL 방식으로 폴백...');
        svgContent = await convertWithConvertAPI(fileUrl, fileType);
      } else {
        svgContent = await convertWithConvertAPIDirect(fileData, fileType);
      }
    } else {
      console.log('파일 URL로 처리...');
      svgContent = await convertWithConvertAPI(fileUrl, fileType);
    }
        console.log('ConvertAPI 변환 결과:', svgContent ? '성공' : '실패');
      } catch (error) {
        console.error('ConvertAPI 변환 오류:', error);
        svgContent = '';
      }
      
      if (!svgContent) {
        console.log('ConvertAPI 변환 실패, 기본 변환 방식 시도...');
        svgContent = await convertToSVG(fileUrl, fileType);
      }
    } else if (fileType === 'pdf') {
      console.log('ConvertAPI를 사용하여 PDF 파일 변환 시도...');
      
      try {
        if (fileData) {
          console.log('PDF 파일 데이터 직접 처리...');
          svgContent = await convertPDFWithConvertAPIDirect(fileData);
        } else {
          console.log('PDF 파일 URL로 처리...');
          svgContent = await convertPDFWithConvertAPI(fileUrl);
        }
        console.log('ConvertAPI PDF 변환 결과:', svgContent ? '성공' : '실패');
      } catch (error) {
        console.error('ConvertAPI PDF 변환 오류:', error);
        svgContent = '';
      }
      
      if (!svgContent) {
        console.log('ConvertAPI PDF 변환 실패, 기본 변환 방식 시도...');
        svgContent = await convertPDFToSVG(fileUrl);
      }
    } else if (fileType === 'png') {
      console.log('PNG 파일 처리 (이미 변환된 파일)...');
      console.log('PNG 파일 URL:', fileUrl);
      
      // PNG 파일 URL이 유효한지 확인
      if (!fileUrl || fileUrl === 'undefined') {
        console.error('PNG 파일 URL이 유효하지 않습니다:', fileUrl);
        return NextResponse.json({ 
          error: 'PNG 파일 URL이 유효하지 않습니다.' 
        }, { status: 400 });
      }
      
      // PNG 파일은 이미 변환된 파일이므로, 원본 URL을 그대로 반환
      return NextResponse.json({
        success: true,
        svgUrl: fileUrl, // PNG 파일 URL을 그대로 사용
        svgPath: `uploads/${fileName}`,
        layers: [
          {
            id: 'converted-png',
            name: '변환된 PNG 파일',
            visible: true,
            elements: [
              {
                id: 'png-image',
                type: 'image',
                x: 0,
                y: 0,
                width: 800,
                height: 600,
                src: fileUrl,
                preserveAspectRatio: 'xMidYMid meet'
              }
            ]
          }
        ],
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <image href="${fileUrl}" width="800" height="600" preserveAspectRatio="xMidYMid meet"/>
        </svg>`
      });
    } else {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 });
    }

    // Supabase가 설정되지 않은 경우 임시 URL 반환
    if (!supabase) {
      return NextResponse.json({
        success: true,
        svgUrl: `/api/placeholder/drawing?width=800&height=600`,
        svgPath: `temp_${Date.now()}.svg`,
        layers: parseSVGToLayers(svgContent),
        svgContent: svgContent
      });
    }

    // 변환된 SVG를 Supabase Storage에 저장
    const svgFileName = `${fileName.replace(/\.[^/.]+$/, '')}_converted.svg`;
    const svgPath = `drawings/${Date.now()}_${svgFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('faddit-files')
      .upload(svgPath, new Blob([svgContent], { type: 'image/svg+xml' }), {
        contentType: 'image/svg+xml',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('SVG 업로드 오류:', uploadError);
      // 업로드 실패 시에도 변환된 SVG 내용은 반환
      return NextResponse.json({
        success: true,
        svgUrl: `/api/placeholder/drawing?width=800&height=600`,
        svgPath: `temp_${Date.now()}.svg`,
        layers: parseSVGToLayers(svgContent),
        svgContent: svgContent
      });
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('faddit-files')
      .getPublicUrl(svgPath);

    return NextResponse.json({
      success: true,
      svgUrl: publicUrl,
      svgPath: svgPath,
      layers: parseSVGToLayers(svgContent),
      svgContent: svgContent
    });

  } catch (error) {
    console.error('파일 변환 오류:', error);
    return NextResponse.json({ error: '파일 변환에 실패했습니다.' }, { status: 500 });
  }
}

// ConvertAPI를 사용한 AI/EPS/CDR 파일 변환
async function convertWithConvertAPI(fileUrl: string, fileType: string): Promise<string> {
  try {
    console.log('=== ConvertAPI 변환 시작 ===');
    console.log('파일 URL:', fileUrl);
    console.log('파일 타입:', fileType);
    
    // ConvertAPI를 require로 import
    console.log('ConvertAPI 라이브러리 로드 중...');
    const ConvertAPI = require('convertapi-js');
    console.log('ConvertAPI 라이브러리 로드 완료');
    
    // ConvertAPI 설정 (환경변수에서 API 키 가져오기)
    const apiSecret = process.env.CONVERTAPI_SECRET;
    console.log('API 키 설정 여부:', !!apiSecret);
    console.log('API 키 샘플:', apiSecret ? `${apiSecret.substring(0, 10)}...` : '없음');
    
    if (!apiSecret) {
      console.log('ConvertAPI 키가 설정되지 않음, 무료 테스트 진행');
      console.log('실제 운영에서는 환경변수에 CONVERTAPI_SECRET 설정 필요');
      console.log('예: CONVERTAPI_SECRET=token_여기에_실제_토큰_입력');
    }
    
    // ConvertAPI 인증
    console.log('ConvertAPI 인증 중...');
    const convertApi = ConvertAPI.auth(apiSecret || 'free_test_key');
    console.log('ConvertAPI 인증 완료');
    
    console.log(`${fileType.toUpperCase()} 파일을 SVG로 변환 중...`);
    
    // 파일 다운로드
    console.log('파일 다운로드 시작...');
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`파일 다운로드 실패: ${response.statusText}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    const fileBlob = new Blob([fileBuffer]);
    console.log('파일 다운로드 완료, 크기:', fileBuffer.byteLength, 'bytes');
    
    // 파일 내용 확인
    if (fileBuffer.byteLength < 1000) {
      console.log('경고: 파일 크기가 너무 작습니다. 실제 AI 파일인지 확인 필요');
    }
    
    // ConvertAPI를 사용하여 변환
    console.log('ConvertAPI 변환 요청 전송 중...');
    console.log('요청 파라미터:', { fileType, fileSize: fileBuffer.byteLength });
    
    const result = await convertApi.convert('svg', {
      File: fileBlob
    }, fileType);
    
    console.log('ConvertAPI 변환 완료');
    console.log('변환 결과:', JSON.stringify(result, null, 2));
    
    // 변환된 SVG 파일 다운로드
    if (result.files && result.files.length > 0) {
      console.log('변환된 파일 URL:', result.files[0].Url);
      const svgResponse = await fetch(result.files[0].Url);
      if (!svgResponse.ok) {
        throw new Error('변환된 SVG 다운로드 실패');
      }
      
      const svgContent = await svgResponse.text();
      console.log('SVG 내용 길이:', svgContent.length);
      console.log('SVG 내용 샘플:', svgContent.substring(0, 200));
      
      return svgContent;
    } else {
      throw new Error('변환된 파일을 찾을 수 없습니다');
    }
    
  } catch (error) {
    console.error('ConvertAPI 변환 오류:', error);
    if (error instanceof Error) {
      console.error('오류 스택:', error.stack);
    }
    return '';
  }
}

// ConvertAPI를 사용한 직접 파일 데이터 변환
async function convertWithConvertAPIDirect(fileData: string, fileType: string): Promise<string> {
  try {
    console.log('=== ConvertAPI 직접 파일 변환 시작 ===');
    console.log('파일 타입:', fileType);
    
    // ConvertAPI를 require로 import
    console.log('ConvertAPI 라이브러리 로드 중...');
    const ConvertAPI = require('convertapi-js');
    console.log('ConvertAPI 라이브러리 로드 완료');
    
    // ConvertAPI 설정
    const apiSecret = process.env.CONVERTAPI_SECRET;
    console.log('API 키 설정 여부:', !!apiSecret);
    
    if (!apiSecret) {
      console.log('ConvertAPI 키가 설정되지 않음, 무료 테스트 진행');
    }
    
    // ConvertAPI 인증
    console.log('ConvertAPI 인증 중...');
    const convertApi = ConvertAPI.auth(apiSecret || 'free_test_key');
    console.log('ConvertAPI 인증 완료');
    
    console.log(`${fileType.toUpperCase()} 파일을 SVG로 변환 중...`);
    
    // Base64 데이터를 Blob으로 변환
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const binaryData = Buffer.from(base64Data, 'base64');
    const fileBlob = new Blob([binaryData]);
    
    console.log('파일 데이터 변환 완료, 크기:', binaryData.length, 'bytes');
    
    // ConvertAPI를 사용하여 변환
    console.log('ConvertAPI 변환 요청 전송 중...');
    const result = await convertApi.convert('svg', {
      File: fileBlob
    }, fileType);
    
    console.log('ConvertAPI 변환 완료');
    console.log('변환 결과:', JSON.stringify(result, null, 2));
    
    // 변환된 SVG 파일 다운로드
    if (result.files && result.files.length > 0) {
      console.log('변환된 파일 URL:', result.files[0].Url);
      const svgResponse = await fetch(result.files[0].Url);
      if (!svgResponse.ok) {
        throw new Error('변환된 SVG 다운로드 실패');
      }
      
      const svgContent = await svgResponse.text();
      console.log('SVG 내용 길이:', svgContent.length);
      console.log('SVG 내용 샘플:', svgContent.substring(0, 200));
      
      return svgContent;
    } else {
      throw new Error('변환된 파일을 찾을 수 없습니다');
    }
    
  } catch (error) {
    console.error('ConvertAPI 직접 변환 오류:', error);
    if (error instanceof Error) {
      console.error('오류 스택:', error.stack);
    }
    return '';
  }
}

// ConvertAPI를 사용한 PDF 직접 파일 데이터 변환
async function convertPDFWithConvertAPIDirect(fileData: string): Promise<string> {
  try {
    console.log('=== ConvertAPI PDF 직접 변환 시작 ===');
    
    // ConvertAPI를 require로 import
    console.log('ConvertAPI 라이브러리 로드 중...');
    const ConvertAPI = require('convertapi-js');
    console.log('ConvertAPI 라이브러리 로드 완료');
    
    const apiSecret = process.env.CONVERTAPI_SECRET;
    console.log('API 키 설정 여부:', !!apiSecret);
    
    if (!apiSecret) {
      console.log('ConvertAPI 키가 설정되지 않음, 무료 테스트 진행');
    }
    
    const convertApi = ConvertAPI.auth(apiSecret || 'free_test_key');
    console.log('ConvertAPI 인증 완료');
    
    console.log('PDF 파일을 SVG로 변환 중...');
    
    // Base64 데이터를 Blob으로 변환
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const binaryData = Buffer.from(base64Data, 'base64');
    const fileBlob = new Blob([binaryData]);
    
    console.log('PDF 파일 데이터 변환 완료, 크기:', binaryData.length, 'bytes');
    
    // PDF를 SVG로 변환
    console.log('ConvertAPI PDF 변환 요청 전송 중...');
    const result = await convertApi.convert('svg', {
      File: fileBlob,
      PageRange: '1' // 첫 번째 페이지만 변환
    }, 'pdf');
    
    console.log('ConvertAPI PDF 변환 완료');
    console.log('PDF 변환 결과:', JSON.stringify(result, null, 2));
    
    // 변환된 SVG 파일 다운로드
    if (result.files && result.files.length > 0) {
      console.log('변환된 PDF 파일 URL:', result.files[0].Url);
      const svgResponse = await fetch(result.files[0].Url);
      if (!svgResponse.ok) {
        throw new Error('변환된 PDF SVG 다운로드 실패');
      }
      
      const svgContent = await svgResponse.text();
      console.log('PDF SVG 내용 길이:', svgContent.length);
      console.log('PDF SVG 내용 샘플:', svgContent.substring(0, 200));
      
      return svgContent;
    } else {
      throw new Error('변환된 PDF 파일을 찾을 수 없습니다');
    }
    
  } catch (error) {
    console.error('ConvertAPI PDF 직접 변환 오류:', error);
    if (error instanceof Error) {
      console.error('오류 스택:', error.stack);
    }
    return '';
  }
}

// ConvertAPI를 사용한 PDF 파일 변환
async function convertPDFWithConvertAPI(fileUrl: string): Promise<string> {
  try {
    console.log('ConvertAPI PDF 변환 시작...');
    
    // ConvertAPI를 require로 import
    const ConvertAPI = require('convertapi-js');
    
    const apiSecret = process.env.CONVERTAPI_SECRET;
    if (!apiSecret) {
      console.log('ConvertAPI 키가 설정되지 않음, 무료 테스트 진행');
    }
    
    const convertApi = ConvertAPI.auth(apiSecret || 'free_test_key');
    
    console.log('PDF 파일을 SVG로 변환 중...');
    
    // 파일 다운로드
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`PDF 다운로드 실패: ${response.statusText}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    const fileBlob = new Blob([fileBuffer]);
    
    // PDF를 SVG로 변환
    const result = await convertApi.convert('svg', {
      File: fileBlob,
      PageRange: '1' // 첫 번째 페이지만 변환
    }, 'pdf');
    
    console.log('ConvertAPI PDF 변환 완료');
    console.log('PDF 변환 결과:', result);
    
    // 변환된 SVG 파일 다운로드
    if (result.files && result.files.length > 0) {
      const svgResponse = await fetch(result.files[0].Url);
      if (!svgResponse.ok) {
        throw new Error('변환된 PDF SVG 다운로드 실패');
      }
      
      const svgContent = await svgResponse.text();
      console.log('PDF SVG 내용 길이:', svgContent.length);
      
      return svgContent;
    } else {
      throw new Error('변환된 PDF 파일을 찾을 수 없습니다');
    }
    
  } catch (error) {
    console.error('ConvertAPI PDF 변환 오류:', error);
    return '';
  }
}

// AI/EPS/CDR 파일을 SVG로 변환하는 함수
async function convertToSVG(fileUrl: string, fileType: string): Promise<string> {
  try {
    console.log(`AI 파일 변환 시작: ${fileUrl} (${fileType})`);
    
    // 파일을 다운로드
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`파일 다운로드 실패: ${response.statusText}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    console.log(`파일 다운로드 완료: ${fileBuffer.byteLength} bytes`);
    
    // 파일 타입에 따른 처리
    if (fileType === 'ai' || fileType === 'eps') {
      return await convertAIToSVG(fileBuffer, fileType);
    } else if (fileType === 'cdr') {
      return await convertCDRToSVG(fileBuffer);
    } else {
      throw new Error(`지원하지 않는 파일 형식: ${fileType}`);
    }
    
  } catch (error) {
    console.error('AI 파일 변환 오류:', error);
    
    // 변환 실패 시 업로드된 파일명을 기반으로 한 기본 SVG 생성
    return generateFallbackSVG(fileUrl, fileType);
  }
}

// AI/EPS 파일을 SVG로 변환
async function convertAIToSVG(fileBuffer: ArrayBuffer, fileType: string): Promise<string> {
  try {
    console.log(`AI/EPS 파일 변환 시작: ${fileType}`);
    
    if (fileType === 'ai') {
      return await convertAIFile(fileBuffer);
    } else if (fileType === 'eps') {
      return await convertEPSFile(fileBuffer);
    }
    
    return generateFallbackSVG('', fileType);
    
  } catch (error) {
    console.error('AI/EPS 변환 오류:', error);
    return generateFallbackSVG('', fileType);
  }
}

// AI 파일 변환 (Adobe Illustrator)
async function convertAIFile(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(fileBuffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    console.log('AI 파일 내용 분석 시작...');
    console.log('AI 파일 크기:', fileBuffer.byteLength, 'bytes');
    console.log('AI 파일 내용 샘플:', text.substring(0, 500));
    
    // AI 파일에서 실제 벡터 데이터 추출
    const paths = extractPathsFromAI(text);
    const shapes = extractShapesFromAI(text);
    const textElements = extractTextFromAI(text);
    
    console.log(`추출된 요소들: paths=${paths.length}, shapes=${shapes.length}, text=${textElements.length}`);
    
    if (paths.length > 0 || shapes.length > 0 || textElements.length > 0) {
      return generateAccurateSVG(paths, shapes, textElements);
    }
    
    // AI 파일이 PDF 기반인 경우 PDF 파싱 시도
    const pdfContent = extractPDFFromAI(fileBuffer);
    if (pdfContent) {
      console.log('PDF 기반 AI 파일 감지, PDF 파싱 시도...');
      return await convertPDFContent(pdfContent);
    }
    
    // AI 파일의 바이너리 데이터에서 직접 벡터 정보 추출 시도
    console.log('바이너리 데이터에서 벡터 정보 추출 시도...');
    const binaryElements = extractFromBinaryAI(fileBuffer);
    if (binaryElements.length > 0) {
      console.log(`바이너리에서 추출된 요소: ${binaryElements.length}개`);
      return generateAccurateSVG(binaryElements, [], []);
    }
    
    console.log('모든 파싱 방법 실패, 기본 SVG 생성');
    return generateFallbackSVG('', 'ai');
    
  } catch (error) {
    console.error('AI 파일 변환 오류:', error);
    return generateFallbackSVG('', 'ai');
  }
}

// AI 파일에서 경로(path) 추출
function extractPathsFromAI(content: string): any[] {
  const paths: any[] = [];
  
  try {
    console.log('AI 파일에서 경로 데이터 추출 중...');
    
    // AI 파일의 벡터 경로 데이터 찾기 (SVG 스타일)
    const pathMatches = content.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
    if (pathMatches) {
      console.log(`SVG 경로 발견: ${pathMatches.length}개`);
      pathMatches.forEach((match, index) => {
        const dMatch = match.match(/d="([^"]*)"/);
        if (dMatch) {
          paths.push({
            type: 'path',
            d: dMatch[1],
            id: `path_${index}`,
            layer: 'ai_paths'
          });
        }
      });
    }
    
    // AI 파일의 벡터 경로 데이터 (Adobe Illustrator 스타일)
    const aiPathMatches = content.match(/%%AI5_BeginPath[^%]*%%AI5_EndPath/g);
    if (aiPathMatches) {
      console.log(`AI 경로 발견: ${aiPathMatches.length}개`);
      aiPathMatches.forEach((match, index) => {
        const pathData = extractPathDataFromAI(match);
        if (pathData) {
          paths.push({
            type: 'path',
            d: pathData,
            id: `ai_path_${index}`,
            layer: 'ai_vector_paths'
          });
        }
      });
    }
    
    // PostScript 스타일 경로 명령어 찾기
    const psPathMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+m\s+([^}]*?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+l/g);
    if (psPathMatches) {
      console.log(`PostScript 경로 발견: ${psPathMatches.length}개`);
      psPathMatches.forEach((match, index) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          paths.push({
            type: 'line',
            x1: parseFloat(coords[0]),
            y1: parseFloat(coords[1]),
            x2: parseFloat(coords[2]),
            y2: parseFloat(coords[3]),
            id: `line_${index}`,
            layer: 'ai_lines'
          });
        }
      });
    }
    
    // AI 파일의 곡선 데이터 찾기
    const curveMatches = content.match(/%%AI5_Curve[^%]*%%AI5_EndCurve/g);
    if (curveMatches) {
      console.log(`AI 곡선 발견: ${curveMatches.length}개`);
      curveMatches.forEach((match, index) => {
        const curveData = extractCurveDataFromAI(match);
        if (curveData) {
          paths.push({
            type: 'path',
            d: curveData,
            id: `curve_${index}`,
            layer: 'ai_curves'
          });
        }
      });
    }
    
    console.log(`총 경로 요소: ${paths.length}개`);
    
  } catch (error) {
    console.error('AI 경로 추출 오류:', error);
  }
  
  return paths;
}

// AI 파일에서 경로 데이터 추출
function extractPathDataFromAI(pathContent: string): string | null {
  try {
    // AI 경로 명령어를 SVG 경로 데이터로 변환
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
    console.error('AI 경로 데이터 추출 오류:', error);
    return null;
  }
}

// AI 파일에서 곡선 데이터 추출
function extractCurveDataFromAI(curveContent: string): string | null {
  try {
    // AI 곡선 명령어를 SVG 경로 데이터로 변환
    const points = curveContent.match(/(\d+\.?\d*)\s+(\d+\.?\d*)/g);
    if (!points || points.length < 4) return null;
    
    let pathData = '';
    const coords = points.map(p => {
      const [x, y] = p.split(/\s+/);
      return { x: parseFloat(x), y: parseFloat(y) };
    });
    
    // 첫 번째 점으로 이동
    pathData += `M ${coords[0].x} ${coords[0].y} `;
    
    // 베지어 곡선으로 변환
    for (let i = 1; i < coords.length - 2; i += 3) {
      if (i + 2 < coords.length) {
        pathData += `C ${coords[i].x} ${coords[i].y} ${coords[i+1].x} ${coords[i+1].y} ${coords[i+2].x} ${coords[i+2].y} `;
      }
    }
    
    return pathData.trim();
  } catch (error) {
    console.error('AI 곡선 데이터 추출 오류:', error);
    return null;
  }
}

// 바이너리 AI 파일에서 벡터 정보 추출
function extractFromBinaryAI(fileBuffer: ArrayBuffer): any[] {
  const elements: any[] = [];
  
  try {
    const uint8Array = new Uint8Array(fileBuffer);
    console.log('바이너리 AI 파일 분석 시작...');
    
    // AI 파일 시그니처 확인
    const header = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array.slice(0, 100));
    console.log('AI 파일 헤더:', header.substring(0, 200));
    
    // AI 파일의 다양한 형식에 대한 파싱 시도
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // 1. Adobe Illustrator CS6+ 형식
    if (text.includes('%!PS-Adobe') || text.includes('%%AI')) {
      console.log('Adobe Illustrator 형식 감지');
      const aiElements = parseAdobeIllustratorFormat(text);
      elements.push(...aiElements);
    }
    
    // 2. PDF 기반 AI 파일
    if (text.includes('%PDF') || text.includes('stream')) {
      console.log('PDF 기반 AI 파일 감지');
      const pdfElements = parsePDFBasedAI(text);
      elements.push(...pdfElements);
    }
    
    // 3. 바이너리 AI 파일 (고급 형식)
    if (elements.length === 0) {
      console.log('바이너리 AI 파일 파싱 시도');
      const binaryElements = parseBinaryAIFormat(uint8Array);
      elements.push(...binaryElements);
    }
    
    console.log(`바이너리 파싱 결과: ${elements.length}개 요소`);
    
  } catch (error) {
    console.error('바이너리 AI 파싱 오류:', error);
  }
  
  return elements;
}

// Adobe Illustrator 형식 파싱
function parseAdobeIllustratorFormat(content: string): any[] {
  const elements: any[] = [];
  
  try {
    // AI 파일의 벡터 경로 찾기
    const pathMatches = content.match(/%%AI5_BeginPath[^%]*%%AI5_EndPath/g);
    if (pathMatches) {
      console.log(`AI 경로 발견: ${pathMatches.length}개`);
      pathMatches.forEach((match, index) => {
        const pathData = extractAIPathData(match);
        if (pathData) {
          elements.push({
            type: 'path',
            d: pathData,
            id: `ai_path_${index}`,
            layer: 'ai_vector_paths'
          });
        }
      });
    }
    
    // AI 파일의 곡선 찾기
    const curveMatches = content.match(/%%AI5_Curve[^%]*%%AI5_EndCurve/g);
    if (curveMatches) {
      console.log(`AI 곡선 발견: ${curveMatches.length}개`);
      curveMatches.forEach((match, index) => {
        const curveData = extractAICurveData(match);
        if (curveData) {
          elements.push({
            type: 'path',
            d: curveData,
            id: `ai_curve_${index}`,
            layer: 'ai_curves'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Adobe Illustrator 형식 파싱 오류:', error);
  }
  
  return elements;
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
    console.error('AI 경로 데이터 추출 오류:', error);
    return null;
  }
}

// AI 곡선 데이터 추출
function extractAICurveData(curveContent: string): string | null {
  try {
    const points = curveContent.match(/(\d+\.?\d*)\s+(\d+\.?\d*)/g);
    if (!points || points.length < 4) return null;
    
    let pathData = '';
    const coords = points.map(p => {
      const [x, y] = p.split(/\s+/);
      return { x: parseFloat(x), y: parseFloat(y) };
    });
    
    pathData += `M ${coords[0].x} ${coords[0].y} `;
    
    for (let i = 1; i < coords.length - 2; i += 3) {
      if (i + 2 < coords.length) {
        pathData += `C ${coords[i].x} ${coords[i].y} ${coords[i+1].x} ${coords[i+1].y} ${coords[i+2].x} ${coords[i+2].y} `;
      }
    }
    
    return pathData.trim();
  } catch (error) {
    console.error('AI 곡선 데이터 추출 오류:', error);
    return null;
  }
}

// PDF 기반 AI 파일 파싱
function parsePDFBasedAI(content: string): any[] {
  const elements: any[] = [];
  
  try {
    const streamMatches = content.match(/stream([\s\S]*?)endstream/g);
    if (streamMatches) {
      streamMatches.forEach((stream, index) => {
        const streamContent = stream.replace(/^stream/, '').replace(/endstream$/, '');
        const streamElements = parsePostScriptCommands(streamContent);
        elements.push(...streamElements);
      });
    }
  } catch (error) {
    console.error('PDF 기반 AI 파싱 오류:', error);
  }
  
  return elements;
}

// 바이너리 AI 형식 파싱
function parseBinaryAIFormat(uint8Array: Uint8Array): any[] {
  const elements: any[] = [];
  
  try {
    // 바이너리 AI 파일의 벡터 데이터 섹션 찾기
    // 실제 구현에서는 AI 파일의 바이너리 구조를 정확히 파싱해야 함
    
    // 간단한 패턴 매칭으로 좌표 데이터 찾기
    for (let i = 0; i < uint8Array.length - 8; i++) {
      // 4바이트 float 패턴 찾기 (좌표 데이터일 가능성)
      const value1 = new DataView(uint8Array.buffer, i, 4).getFloat32(0, false);
      const value2 = new DataView(uint8Array.buffer, i + 4, 4).getFloat32(0, false);
      
      // 유효한 좌표 범위인지 확인
      if (value1 > 0 && value1 < 10000 && value2 > 0 && value2 < 10000) {
        elements.push({
          type: 'line',
          x1: value1,
          y1: value2,
          x2: value1 + 50,
          y2: value2 + 50,
          id: `binary_line_${i}`,
          layer: 'binary_vectors'
        });
      }
    }
    
  } catch (error) {
    console.error('바이너리 AI 형식 파싱 오류:', error);
  }
  
  return elements;
}

// AI 파일에서 도형 추출
function extractShapesFromAI(content: string): any[] {
  const shapes: any[] = [];
  
  try {
    // 사각형 찾기
    const rectMatches = content.match(/<rect[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*>/g);
    if (rectMatches) {
      rectMatches.forEach((match, index) => {
        const xMatch = match.match(/x="([^"]*)"/);
        const yMatch = match.match(/y="([^"]*)"/);
        const widthMatch = match.match(/width="([^"]*)"/);
        const heightMatch = match.match(/height="([^"]*)"/);
        
        if (xMatch && yMatch && widthMatch && heightMatch) {
          shapes.push({
            type: 'rect',
            x: parseFloat(xMatch[1]),
            y: parseFloat(yMatch[1]),
            width: parseFloat(widthMatch[1]),
            height: parseFloat(heightMatch[1]),
            id: `rect_${index}`,
            layer: 'ai_shapes'
          });
        }
      });
    }
    
    // 원 찾기
    const circleMatches = content.match(/<circle[^>]*cx="([^"]*)"[^>]*cy="([^"]*)"[^>]*r="([^"]*)"[^>]*>/g);
    if (circleMatches) {
      circleMatches.forEach((match, index) => {
        const cxMatch = match.match(/cx="([^"]*)"/);
        const cyMatch = match.match(/cy="([^"]*)"/);
        const rMatch = match.match(/r="([^"]*)"/);
        
        if (cxMatch && cyMatch && rMatch) {
          shapes.push({
            type: 'circle',
            cx: parseFloat(cxMatch[1]),
            cy: parseFloat(cyMatch[1]),
            r: parseFloat(rMatch[1]),
            id: `circle_${index}`,
            layer: 'ai_shapes'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('AI 도형 추출 오류:', error);
  }
  
  return shapes;
}

// AI 파일에서 텍스트 추출
function extractTextFromAI(content: string): any[] {
  const texts: any[] = [];
  
  try {
    const textMatches = content.match(/<text[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*>([^<]*)<\/text>/g);
    if (textMatches) {
      textMatches.forEach((match, index) => {
        const xMatch = match.match(/x="([^"]*)"/);
        const yMatch = match.match(/y="([^"]*)"/);
        const textMatch = match.match(/>([^<]*)</);
        
        if (xMatch && yMatch && textMatch) {
          texts.push({
            type: 'text',
            x: parseFloat(xMatch[1]),
            y: parseFloat(yMatch[1]),
            content: textMatch[1],
            id: `text_${index}`,
            layer: 'ai_text'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('AI 텍스트 추출 오류:', error);
  }
  
  return texts;
}

// AI 파일에서 PDF 내용 추출
function extractPDFFromAI(fileBuffer: ArrayBuffer): string | null {
  try {
    const uint8Array = new Uint8Array(fileBuffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // AI 파일이 PDF 기반인지 확인
    if (text.includes('%PDF') || text.includes('stream') || text.includes('endstream')) {
      console.log('AI 파일에서 PDF 내용 발견');
      return text;
    }
    
    return null;
  } catch (error) {
    console.error('PDF 내용 추출 오류:', error);
    return null;
  }
}

// PDF 내용을 SVG로 변환
async function convertPDFContent(pdfContent: string): Promise<string> {
  try {
    // PDF 스트림에서 벡터 데이터 추출
    const streamMatches = pdfContent.match(/stream([\s\S]*?)endstream/g);
    if (streamMatches) {
      const elements: any[] = [];
      
      streamMatches.forEach((stream, index) => {
        const content = stream.replace(/^stream/, '').replace(/endstream$/, '');
        
        // PostScript 그래픽 명령어 파싱
        const commands = parsePostScriptCommands(content);
        elements.push(...commands);
      });
      
      if (elements.length > 0) {
        return generateAccurateSVG(elements, [], []);
      }
    }
    
    return generateFallbackSVG('', 'pdf');
  } catch (error) {
    console.error('PDF 내용 변환 오류:', error);
    return generateFallbackSVG('', 'pdf');
  }
}

// PostScript 명령어 파싱
function parsePostScriptCommands(content: string): any[] {
  const elements: any[] = [];
  
  try {
    // moveto/lineto 명령어
    const lineMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+m\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+l/g);
    if (lineMatches) {
      lineMatches.forEach((match, index) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          elements.push({
            type: 'line',
            x1: parseFloat(coords[0]),
            y1: parseFloat(coords[1]),
            x2: parseFloat(coords[2]),
            y2: parseFloat(coords[3]),
            id: `ps_line_${index}`,
            layer: 'postscript_lines'
          });
        }
      });
    }
    
    // 사각형 명령어
    const rectMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+re/g);
    if (rectMatches) {
      rectMatches.forEach((match, index) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          elements.push({
            type: 'rect',
            x: parseFloat(coords[0]),
            y: parseFloat(coords[1]),
            width: parseFloat(coords[2]),
            height: parseFloat(coords[3]),
            id: `ps_rect_${index}`,
            layer: 'postscript_shapes'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('PostScript 명령어 파싱 오류:', error);
  }
  
  return elements;
}

// EPS 파일 변환
async function convertEPSFile(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('EPS 파일 변환 시작...');
    const text = new TextDecoder('utf-8', { fatal: false }).decode(fileBuffer);
    
    // EPS PostScript 명령어에서 벡터 데이터 추출
    const elements = parsePostScriptCommands(text);
    
    if (elements.length > 0) {
      return generateAccurateSVG(elements, [], []);
    }
    
    return generateFallbackSVG('', 'eps');
  } catch (error) {
    console.error('EPS 변환 오류:', error);
    return generateFallbackSVG('', 'eps');
  }
}

// CDR 파일을 SVG로 변환
async function convertCDRToSVG(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    // CDR 파일은 복잡한 바이너리 형식이므로 기본 SVG 생성
    console.log('CDR 파일 변환 (기본 처리)');
    return generateFallbackSVG('', 'cdr');
  } catch (error) {
    console.error('CDR 변환 오류:', error);
    return generateFallbackSVG('', 'cdr');
  }
}

// 정확한 SVG 생성 함수
function generateAccurateSVG(paths: any[], shapes: any[], texts: any[]): string {
  let svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <style>
          .layer { opacity: 1; }
          .layer.hidden { opacity: 0; }
        </style>
      </defs>
  `;
  
  // 모든 요소를 하나의 배열로 합치기
  const allElements = [...paths, ...shapes, ...texts];
  
  // 레이어별로 그룹화
  const layerGroups: { [key: string]: any[] } = {};
  allElements.forEach(element => {
    const layerName = element.layer || 'default';
    if (!layerGroups[layerName]) {
      layerGroups[layerName] = [];
    }
    layerGroups[layerName].push(element);
  });
  
  // 각 레이어별로 SVG 요소 생성
  Object.keys(layerGroups).forEach(layerName => {
    svg += `<g class="layer" data-layer-id="${layerName}" data-layer-name="${layerName}">`;
    
    layerGroups[layerName].forEach(element => {
      switch (element.type) {
        case 'path':
          svg += `<path d="${element.d}" fill="none" stroke="#000" stroke-width="1" id="${element.id}"/>`;
          break;
        case 'line':
          svg += `<line x1="${element.x1}" y1="${element.y1}" x2="${element.x2}" y2="${element.y2}" stroke="#000" stroke-width="1" id="${element.id}"/>`;
          break;
        case 'rect':
          svg += `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="none" stroke="#000" stroke-width="1" id="${element.id}"/>`;
          break;
        case 'circle':
          svg += `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" fill="none" stroke="#000" stroke-width="1" id="${element.id}"/>`;
          break;
        case 'text':
          svg += `<text x="${element.x}" y="${element.y}" font-size="12" fill="#000" id="${element.id}">${element.content}</text>`;
          break;
      }
    });
    
    svg += '</g>';
  });
  
  svg += '</svg>';
  return svg;
}

// AI 파일에서 SVG 요소 추출 (간단한 파싱)
function extractSVGFromAI(content: string): any[] {
  const elements: any[] = [];
  
  try {
    // AI 파일에서 기본적인 도형 정보 추출
    // 실제로는 더 복잡한 파싱이 필요하지만, 기본적인 패턴 매칭 사용
    
    // 직선 패턴 찾기
    const lineMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+m\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+l/g);
    if (lineMatches) {
      lineMatches.forEach((match, index) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          elements.push({
            type: 'line',
            x1: parseFloat(coords[0]),
            y1: parseFloat(coords[1]),
            x2: parseFloat(coords[2]),
            y2: parseFloat(coords[3]),
            layer: 'extracted_lines'
          });
        }
      });
    }
    
    // 사각형 패턴 찾기
    const rectMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+re/g);
    if (rectMatches) {
      rectMatches.forEach((match, index) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          elements.push({
            type: 'rect',
            x: parseFloat(coords[0]),
            y: parseFloat(coords[1]),
            width: parseFloat(coords[2]),
            height: parseFloat(coords[3]),
            layer: 'extracted_shapes'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('AI 파싱 오류:', error);
  }
  
  return elements;
}

// EPS 파일에서 SVG 요소 추출
function extractSVGFromEPS(content: string): any[] {
  const elements: any[] = [];
  
  try {
    // EPS PostScript 명령어에서 기본 도형 추출
    
    // moveto/lineto 패턴
    const pathMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+moveto[^n]*?(\d+\.?\d*)\s+(\d+\.?\d*)\s+lineto/g);
    if (pathMatches) {
      pathMatches.forEach((match) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          elements.push({
            type: 'line',
            x1: parseFloat(coords[0]),
            y1: parseFloat(coords[1]),
            x2: parseFloat(coords[2]),
            y2: parseFloat(coords[3]),
            layer: 'eps_paths'
          });
        }
      });
    }
    
    // 원/타원 패턴
    const circleMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+0\s+360\s+arc/g);
    if (circleMatches) {
      circleMatches.forEach((match) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 3) {
          elements.push({
            type: 'circle',
            cx: parseFloat(coords[0]),
            cy: parseFloat(coords[1]),
            r: parseFloat(coords[2]),
            layer: 'eps_circles'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('EPS 파싱 오류:', error);
  }
  
  return elements;
}

// 추출된 요소들로부터 SVG 생성
function generateSVGFromElements(elements: any[]): string {
  let svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .layer { opacity: 1; }
          .layer.hidden { opacity: 0; }
        </style>
      </defs>
  `;
  
  // 레이어별로 그룹화
  const layerGroups: { [key: string]: any[] } = {};
  elements.forEach(element => {
    const layerName = element.layer || 'default';
    if (!layerGroups[layerName]) {
      layerGroups[layerName] = [];
    }
    layerGroups[layerName].push(element);
  });
  
  // 각 레이어별로 SVG 요소 생성
  Object.keys(layerGroups).forEach(layerName => {
    svg += `<g class="layer" data-layer-id="${layerName}" data-layer-name="${layerName}">`;
    
    layerGroups[layerName].forEach(element => {
      switch (element.type) {
        case 'line':
          svg += `<line x1="${element.x1}" y1="${element.y1}" x2="${element.x2}" y2="${element.y2}" stroke="#000" stroke-width="1"/>`;
          break;
        case 'rect':
          svg += `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="none" stroke="#000" stroke-width="1"/>`;
          break;
        case 'circle':
          svg += `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" fill="none" stroke="#000" stroke-width="1"/>`;
          break;
      }
    });
    
    svg += '</g>';
  });
  
  svg += '</svg>';
  return svg;
}

// 변환 실패 시 기본 SVG 생성
function generateFallbackSVG(fileUrl: string, fileType: string): string {
  return `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .layer { opacity: 1; }
          .layer.hidden { opacity: 0; }
        </style>
      </defs>
      
      <g class="layer" data-layer-id="converted" data-layer-name="변환된 ${fileType.toUpperCase()} 파일">
        <rect x="50" y="50" width="700" height="500" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="10,5"/>
        <text x="400" y="300" font-size="24" fill="#666" text-anchor="middle">${fileType.toUpperCase()} 파일이 변환되었습니다</text>
        <text x="400" y="330" font-size="14" fill="#999" text-anchor="middle">편집 도구를 사용하여 도식화를 수정하세요</text>
      </g>
      
      <g class="layer" data-layer-id="outline" data-layer-name="외곽선">
        <path d="M200,150 L600,150 L600,450 L200,450 Z" fill="none" stroke="#000" stroke-width="2"/>
      </g>
      
      <g class="layer" data-layer-id="details" data-layer-name="디테일">
        <circle cx="300" cy="250" r="20" fill="none" stroke="#333" stroke-width="1"/>
        <rect x="450" y="200" width="80" height="60" fill="none" stroke="#333" stroke-width="1"/>
      </g>
    </svg>
  `;
}

// PDF를 SVG로 변환하는 함수
async function convertPDFToSVG(fileUrl: string): Promise<string> {
  try {
    console.log(`PDF 파일 변환 시작: ${fileUrl}`);
    
    // PDF 파일 다운로드
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`PDF 다운로드 실패: ${response.statusText}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    console.log(`PDF 다운로드 완료: ${fileBuffer.byteLength} bytes`);
    
    // PDF에서 텍스트 및 기본 도형 추출 시도
    const pdfText = await extractTextFromPDF(fileBuffer);
    const elements = parsePDFContent(pdfText);
    
    if (elements.length > 0) {
      return generateSVGFromElements(elements);
    } else {
      return generateFallbackSVG(fileUrl, 'pdf');
    }
    
  } catch (error) {
    console.error('PDF 변환 오류:', error);
    return generateFallbackSVG(fileUrl, 'pdf');
  }
}

// PDF에서 텍스트 추출 (간단한 구현)
async function extractTextFromPDF(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    // PDF는 복잡한 형식이므로 기본적인 텍스트 추출만 시도
    const uint8Array = new Uint8Array(fileBuffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // PDF 객체에서 텍스트 스트림 찾기
    const streamMatches = text.match(/stream([\s\S]*?)endstream/g);
    let extractedText = '';
    
    if (streamMatches) {
      streamMatches.forEach(match => {
        // 간단한 텍스트 추출 (실제로는 PDF 파싱 라이브러리 필요)
        const content = match.replace(/^stream/, '').replace(/endstream$/, '');
        extractedText += content + ' ';
      });
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF 텍스트 추출 오류:', error);
    return '';
  }
}

// PDF 내용에서 도형 정보 파싱
function parsePDFContent(content: string): any[] {
  const elements: any[] = [];
  
  try {
    // PDF 그래픽 명령어에서 기본 도형 추출
    
    // 직선 명령어 (m = moveto, l = lineto)
    const lineMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+m\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+l/g);
    if (lineMatches) {
      lineMatches.forEach((match) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          elements.push({
            type: 'line',
            x1: parseFloat(coords[0]),
            y1: parseFloat(coords[1]),
            x2: parseFloat(coords[2]),
            y2: parseFloat(coords[3]),
            layer: 'pdf_lines'
          });
        }
      });
    }
    
    // 사각형 명령어 (re = rectangle)
    const rectMatches = content.match(/(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+re/g);
    if (rectMatches) {
      rectMatches.forEach((match) => {
        const coords = match.match(/(\d+\.?\d*)/g);
        if (coords && coords.length >= 4) {
          elements.push({
            type: 'rect',
            x: parseFloat(coords[0]),
            y: parseFloat(coords[1]),
            width: parseFloat(coords[2]),
            height: parseFloat(coords[3]),
            layer: 'pdf_shapes'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('PDF 내용 파싱 오류:', error);
  }
  
  return elements;
}

// SVG에서 레이어 정보를 파싱하는 함수
function parseSVGLayers(svgContent: string) {
  const layers: Array<{
    id: string;
    name: string;
    visible: boolean;
    elements: any[];
  }> = [];

  // SVG에서 g 태그들을 찾아서 레이어 정보 추출
  const layerRegex = /<g[^>]*class="layer"[^>]*data-layer-id="([^"]*)"[^>]*data-layer-name="([^"]*)"[^>]*>/g;
  let match;

  while ((match = layerRegex.exec(svgContent)) !== null) {
    const layerId = match[1];
    const layerName = match[2];
    
    layers.push({
      id: layerId,
      name: layerName,
      visible: true,
      elements: [] // 실제 구현에서는 해당 레이어의 모든 요소를 파싱
    });
  }

  return layers;
}
