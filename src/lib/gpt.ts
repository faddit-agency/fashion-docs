import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WorksheetAnalysis {
  category: string;
  sizeSpec: Record<string, any>;
  materials: {
    fabric: string;
    weight: string;
    color: string;
  };
  instructions: string[];
  labels: {
    size: string;
    care: string;
    brand: string;
  };
}

export class GPTService {
  // 이미지 분석을 통한 의류 카테고리 분류
  static async analyzeClothingCategory(imageBase64: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "이 이미지는 의류의 도식화나 패턴입니다. 다음 중 하나로 분류해주세요: 상의, 하의, 원피스, 아우터. 답변은 분류 결과만 간단히 해주세요."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 10
      });

      return response.choices[0].message.content?.trim() || "상의";
    } catch (error) {
      console.error("이미지 분석 오류:", error);
      return "상의"; // 기본값
    }
  }

  // 작업지시서 생성
  static async generateWorksheet(
    category: string,
    sizeRange: string,
    additionalInfo?: string
  ): Promise<WorksheetAnalysis> {
    try {
      const prompt = `
다음 정보를 바탕으로 의류 작업지시서를 생성해주세요:

의류 카테고리: ${category}
사이즈 범위: ${sizeRange}
추가 정보: ${additionalInfo || "없음"}

다음 JSON 형식으로 응답해주세요:
{
  "category": "의류 카테고리",
  "sizeSpec": {
    "S": {"chest": 96, "length": 68, "shoulder": 44, "sleeve": 22},
    "M": {"chest": 100, "length": 70, "shoulder": 46, "sleeve": 23},
    "L": {"chest": 104, "length": 72, "shoulder": 48, "sleeve": 24},
    "XL": {"chest": 108, "length": 74, "shoulder": 50, "sleeve": 25}
  },
  "materials": {
    "fabric": "원단 정보",
    "weight": "중량 정보",
    "color": "색상 정보"
  },
  "instructions": [
    "작업 시 주의사항 1",
    "작업 시 주의사항 2",
    "작업 시 주의사항 3"
  ],
  "labels": {
    "size": "사이즈 라벨 위치",
    "care": "케어 라벨 위치",
    "brand": "브랜드 라벨 위치"
  }
}

실제 의류 제작에 사용할 수 있는 정확하고 실용적인 정보로 작성해주세요.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "당신은 의류 제작 전문가입니다. 정확하고 실용적인 작업지시서를 작성해주세요."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("GPT 응답이 비어있습니다.");
      }

      // JSON 파싱
      const worksheetData = JSON.parse(content);
      return worksheetData as WorksheetAnalysis;
    } catch (error) {
      console.error("작업지시서 생성 오류:", error);
      // 기본 템플릿 반환
      return {
        category: category,
        sizeSpec: {
          S: { chest: 96, length: 68, shoulder: 44, sleeve: 22 },
          M: { chest: 100, length: 70, shoulder: 46, sleeve: 23 },
          L: { chest: 104, length: 72, shoulder: 48, sleeve: 24 },
          XL: { chest: 108, length: 74, shoulder: 50, sleeve: 25 }
        },
        materials: {
          fabric: "면 100%",
          weight: "180g",
          color: "화이트, 네이비, 그레이"
        },
        instructions: [
          "소매는 이중바느질로 처리",
          "목 부분은 리브 처리",
          "하단은 이중바느질 후 스티치"
        ],
        labels: {
          size: "왼쪽 소매 안쪽",
          care: "뒷면 하단",
          brand: "뒷면 상단"
        }
      };
    }
  }

  // 이미지에서 의류 정보 추출
  static async extractClothingInfo(imageBase64: string): Promise<{
    category: string;
    description: string;
    features: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "이 의류 도식화/패턴 이미지를 분석해서 다음 정보를 JSON 형식으로 제공해주세요: 1) 의류 카테고리 (상의/하의/원피스/아우터), 2) 간단한 설명, 3) 주요 특징들 (배열)"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("GPT 응답이 비어있습니다.");
      }

      // JSON 파싱 시도
      try {
        return JSON.parse(content);
      } catch {
        // JSON 파싱 실패 시 기본값 반환
        return {
          category: "상의",
          description: "의류 도식화/패턴",
          features: ["기본 디자인", "실용적 패턴"]
        };
      }
    } catch (error) {
      console.error("이미지 정보 추출 오류:", error);
      return {
        category: "상의",
        description: "의류 도식화/패턴",
        features: ["기본 디자인", "실용적 패턴"]
      };
    }
  }
} 