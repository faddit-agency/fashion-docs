import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// API 키 형식 확인
const apiKey = process.env.OPENAI_API_KEY;
console.log('API 키 확인:', {
  exists: !!apiKey,
  length: apiKey?.length,
  startsWithSk: apiKey?.startsWith('sk-'),
  startsWithSkSvcacct: apiKey?.startsWith('sk-svcacct-'),
  first20Chars: apiKey?.substring(0, 20)
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('API 호출 시작');
    console.log('환경 변수 확인:', {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length,
      apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10)
    });

    const body = await request.json();
    const { message, worksheetData, fileUrl, filePath } = body;

    // 파일 업로드 시 작업지시서 생성
    if (fileUrl && filePath) {
      console.log('파일 업로드 기반 작업지시서 생성 시작');
      
      // 샘플 작업지시서 데이터 반환
      const sampleWorksheetData = {
        title: "베이직 셔츠",
        brand: "FADDIT",
        item: "셔츠",
        gender: "남성",
        category: "상의",
        apparel: "셔츠",
        season: "2025 S/S",
        additionalInfo: {
          requestDate: "2024-12-15",
          deliveryDate: "2025-01-15",
          productName: "베이직 셔츠",
          sampleNumber: "SAMPLE-001",
          productNumber: "PROD-001",
          manufacturer: "패션팩토리",
          contact1: "김철수",
          contact2: "이영희",
          contact3: "박민수",
          contactInfo: "010-1234-5678"
        },
        technicalDrawing: {
          image: "/api/placeholder/drawing?width=800&height=600",
          annotations: ["포켓 위치", "플리츠 디테일"]
        },
        workNotes: "면 소재 사용, 깔끔한 실루엣으로 제작",
        sizeSpec: {
          sizes: ["S", "M", "L", "XL"],
          measurements: {
            S: { totalLength: 70, shoulderWidth: 45, armhole: 20, chestCircumference: 100 },
            M: { totalLength: 72, shoulderWidth: 47, armhole: 21, chestCircumference: 104 },
            L: { totalLength: 74, shoulderWidth: 49, armhole: 22, chestCircumference: 108 },
            XL: { totalLength: 76, shoulderWidth: 51, armhole: 23, chestCircumference: 112 }
          }
        },
        quantityByColorSize: {
          colors: ["화이트", "블랙", "네이비"],
          sizes: ["S", "M", "L", "XL"],
          quantities: {
            "화이트": { S: 50, M: 100, L: 80, XL: 30 },
            "블랙": { S: 40, M: 90, L: 70, XL: 25 },
            "네이비": { S: 30, M: 80, L: 60, XL: 20 }
          }
        },
        labelPosition: {
          images: ["/api/placeholder/200/150"]
        },
        fabric: {
          mainFabric: "면 100%",
          outerFabric: "면 100%",
          swatches: ["/api/placeholder/100/100"]
        },
        pattern: {
          fileName: "pattern.ai",
          fileUrl: "/api/placeholder/200/200"
        },
        subMaterials: [
          { name: "단추", color: "화이트", specification: "플라스틱", quantity: 6 },
          { name: "실", color: "화이트", specification: "폴리에스터", quantity: 200 }
        ],
        fabricInfo: [
          {
            location: "상의",
            companyItem: "면 원단",
            color: "화이트",
            sizeUnitPrice: "₩5,000/야드",
            composition: "면 100%",
            yield: "3야드"
          }
        ]
      };

      return NextResponse.json({
        success: true,
        data: sampleWorksheetData,
        message: '작업지시서가 성공적으로 생성되었습니다.'
      });
    }

    // 채팅 메시지 처리
    if (!message || !worksheetData) {
      console.log('필수 데이터 누락:', { message: !!message, worksheetData: !!worksheetData });
      return NextResponse.json(
        { success: false, error: '메시지와 워크시트 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('GPT API 호출 준비');

    // 워크시트 데이터를 JSON 문자열로 변환
    const worksheetJson = JSON.stringify(worksheetData, null, 2);

    const systemPrompt = `당신은 패션 제품의 작업지시서를 도와주는 전문가입니다. 
다음 워크시트 데이터를 기반으로 사용자의 요청에 응답하고, 필요시 워크시트를 수정해주세요.

현재 워크시트 데이터:
${worksheetJson}

사용자의 요청에 따라 워크시트를 수정하거나 조언을 제공하세요. 
수정이 필요한 경우 JSON 형태로 수정된 워크시트 데이터를 반환하세요.
단순한 질문이나 조언의 경우 텍스트로 응답하세요.`;

    console.log('OpenAI API 호출 시작');
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      console.log('OpenAI API 응답 받음');

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        console.log('GPT 응답이 비어있음');
        return NextResponse.json(
          { success: false, error: 'GPT 응답을 받지 못했습니다.' },
          { status: 500 }
        );
      }

      console.log('응답 처리 시작');

      // JSON 응답인지 확인 (워크시트 수정)
      try {
        // 응답에서 JSON 블록을 찾기
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const jsonResponse = JSON.parse(jsonMatch[1]);
          if (jsonResponse.title && jsonResponse.brand) {
            console.log('유효한 워크시트 데이터 반환');
            // 유효한 워크시트 데이터로 보이면 반환
            return NextResponse.json({
              success: true,
              data: jsonResponse,
              message: '워크시트가 성공적으로 업데이트되었습니다.'
            });
          }
        }
        
        // 일반 JSON 파싱 시도
        const jsonResponse = JSON.parse(response);
        if (jsonResponse.title && jsonResponse.brand) {
          console.log('유효한 워크시트 데이터 반환');
          // 유효한 워크시트 데이터로 보이면 반환
          return NextResponse.json({
            success: true,
            data: jsonResponse,
            message: '워크시트가 성공적으로 업데이트되었습니다.'
          });
        }
      } catch {
        console.log('JSON 파싱 실패, 일반 텍스트로 처리');
        // JSON이 아니면 일반 텍스트 응답으로 처리
      }

      console.log('일반 텍스트 응답 반환');
      // 일반 텍스트 응답
      return NextResponse.json({
        success: true,
        message: response,
        data: null
      });

    } catch (openaiError: unknown) {
      console.error('OpenAI API 오류:', openaiError);
      
      // 할당량 초과 오류인 경우 모의 응답 반환
      if (openaiError instanceof Error && openaiError.message.includes('429')) {
        console.log('할당량 초과로 인한 모의 응답 반환');
        
        // 사용자 메시지에 따른 간단한 모의 응답
        let mockResponse = '죄송합니다. 현재 OpenAI API 할당량이 초과되어 정상적인 응답을 제공할 수 없습니다. ';
        
        if (message.toLowerCase().includes('색상') || message.toLowerCase().includes('컬러')) {
          mockResponse += '색상 관련 질문이시군요. 일반적으로 패션 제품에서는 기본 색상(검정, 흰색, 네이비)부터 시작하여 트렌드 색상을 추가하는 것을 권장합니다.';
        } else if (message.toLowerCase().includes('사이즈') || message.toLowerCase().includes('크기')) {
          mockResponse += '사이즈 관련 질문이시군요. 일반적으로 S, M, L, XL 사이즈를 기본으로 하며, 필요에 따라 더 세분화된 사이즈를 제공할 수 있습니다.';
        } else if (message.toLowerCase().includes('재질') || message.toLowerCase().includes('소재')) {
          mockResponse += '재질 관련 질문이시군요. 면, 폴리에스터, 레이온 등이 일반적으로 사용되며, 제품의 특성에 따라 적절한 소재를 선택하는 것이 중요합니다.';
        } else {
          mockResponse += '워크시트 관련 질문이시군요. 현재 할당량 초과로 인해 정확한 답변을 제공할 수 없습니다. 나중에 다시 시도해주세요.';
        }
        
        return NextResponse.json({
          success: true,
          message: mockResponse,
          data: null
        });
      }
      
      throw openaiError;
    }

          } catch (error) {
      console.error('GPT API 오류 상세:', error);
      console.error('에러 타입:', typeof error);
    console.error('에러 메시지:', error instanceof Error ? error.message : 'Unknown error');
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
    
    // 실제 오류 메시지를 반환
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { success: false, error: `GPT API 오류: ${errorMessage}` },
      { status: 500 }
    );
  }
} 