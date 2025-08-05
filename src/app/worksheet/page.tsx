"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { PDFDownload } from "@/components/ui/pdf-download";
import { Toggle } from "@/components/ui/toggle";
import { Download, FileText, Edit, MessageSquare, Eye, EyeOff } from "lucide-react";

interface WorksheetData {
  id?: string;
  title: string;
  brand: string;
  item: string;
  gender: string;
  category: string;
  apparel: string;
  season: string;
  additionalInfo: {
    requestDate: string;
    deliveryDate: string;
    productName: string;
    sampleNumber: string;
    productNumber: string;
    manufacturer: string;
    contact1: string;
    contact2: string;
    contact3: string;
    contactInfo: string;
  };
  technicalDrawing: {
    frontImage: string;
    backImage: string;
    annotations: string[];
  };
  workNotes: string;
  sizeSpec: {
    sizes: string[];
    measurements: {
      [key: string]: {
        totalLength: number;
        shoulderWidth: number;
        armhole: number;
        chestCircumference: number;
      };
    };
  };
  quantityByColorSize: {
    colors: string[];
    sizes: string[];
    quantities: {
      [color: string]: {
        [size: string]: number;
      };
    };
  };
  labelPosition: {
    images: string[];
  };
  fabric: {
    mainFabric: string;
    outerFabric: string;
    swatches: string[];
  };
  pattern: {
    fileName: string;
    fileUrl: string;
  };
  subMaterials: {
    name: string;
    color: string;
    specification: string;
    quantity: number;
  }[];
  fabricInfo: {
    location: string;
    companyItem: string;
    color: string;
    sizeUnitPrice: string;
    composition: string;
    yield: string;
  }[];
}

export default function WorksheetPage() {
  const { user } = useUser();
  const [uploadedFile, setUploadedFile] = useState<{ url: string; path: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);

  const sampleWorksheetData: WorksheetData = {
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
      frontImage: "/api/placeholder/400/300",
      backImage: "/api/placeholder/400/300",
      annotations: ["앞면: 포켓 위치", "뒷면: 플리츠 디테일"]
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

  const handleFileUploadComplete = (url: string, path: string) => {
    setUploadedFile({ url, path });
    setError(null);
  };

  const handleFileUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleGenerateWorksheet = async () => {
    if (!uploadedFile) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/gpt/worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: uploadedFile.url,
          filePath: uploadedFile.path
        }),
      });

      if (!response.ok) {
        throw new Error('작업지시서 생성에 실패했습니다.');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setWorksheetData(data.data);
      } else {
        throw new Error(data.error || '작업지시서 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error generating worksheet:', error);
      setError('작업지시서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    const userMessage = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gpt/worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          worksheetData: worksheetData
        }),
      });

      if (!response.ok) {
        throw new Error('AI 응답 생성에 실패했습니다.');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDirectEdit = (field: string, value: string) => {
    if (!worksheetData) return;

    const fieldParts = field.split('.');
    setWorksheetData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      if (fieldParts.length === 1) {
        (newData as any)[fieldParts[0]] = value;
      } else if (fieldParts.length === 2) {
        (newData as any)[fieldParts[0]][fieldParts[1]] = value;
      }
      return newData;
    });
  };

  const calculateTotalByColor = (color: string) => {
    if (!worksheetData) return 0;
    return worksheetData.quantityByColorSize.sizes.reduce((total, size) => {
      return total + (worksheetData.quantityByColorSize.quantities[color]?.[size] || 0);
    }, 0);
  };

  const calculateTotalBySize = (size: string) => {
    if (!worksheetData) return 0;
    return worksheetData.quantityByColorSize.colors.reduce((total, color) => {
      return total + (worksheetData.quantityByColorSize.quantities[color]?.[size] || 0);
    }, 0);
  };

  const calculateGrandTotal = () => {
    if (!worksheetData) return 0;
    return worksheetData.quantityByColorSize.colors.reduce((total, color) => {
      return total + calculateTotalByColor(color);
    }, 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen section-gray">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">로그인이 필요합니다</h1>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href="/sign-in">로그인하기</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {!worksheetData ? (
          // 파일 업로드 화면
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">작업지시서 생성</h1>
                <p className="text-muted-foreground">도식화 파일을 업로드하면 AI가 자동으로 작업지시서를 생성합니다</p>
              </div>

              <div className="card">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">도식화 파일 업로드</h2>
                  <FileUpload
                    onUploadComplete={handleFileUploadComplete}
                    onUploadError={handleFileUploadError}
                    accept=".ai,.eps,.pdf,.jpg,.png"
                    maxSize={10 * 1024 * 1024} // 10MB
                  />
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {uploadedFile && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">업로드된 파일</h3>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">파일이 성공적으로 업로드되었습니다</p>
                        <p className="text-sm text-muted-foreground">{uploadedFile.path}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerateWorksheet}
                  disabled={!uploadedFile || isGenerating}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      작업지시서 생성 중...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      작업지시서 생성하기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // 작업지시서 화면
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 고정 헤더 */}
            <div className="border-b border-border bg-background flex-shrink-0">
              <div className="flex justify-between items-center p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-muted-foreground">세부정보</span>
                    <div className="flex items-center space-x-2">
                      <Toggle
                        checked={showDetails}
                        onCheckedChange={setShowDetails}
                        size="sm"
                        variant="success"
                      />
                      <span className="text-xs text-muted-foreground">
                        {showDetails ? "보임" : "숨김"}
                      </span>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">{worksheetData.title}</h1>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {isEditMode ? "보기 모드" : "수정"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowChat(!showChat)}
                  >
                    {showChat ? "채팅 닫기" : "AI 채팅"}
                  </Button>
                  <PDFDownload
                    elementRef={worksheetRef as React.RefObject<HTMLElement>}
                    filename={`worksheet_${worksheetData.title.replace(/\s+/g, '_')}.pdf`}
                    type="element"
                    variant="primary"
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 기본정보 섹션 */}
              {showDetails && (
                <div className="w-80 border-r border-border bg-muted overflow-y-auto flex-shrink-0">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">기본 정보</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">브랜드</label>
                        <input 
                          type="text" 
                          value={worksheetData.brand}
                          onChange={(e) => handleDirectEdit('brand', e.target.value)}
                          className="input w-full"
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">아이템</label>
                        <input 
                          type="text" 
                          value={worksheetData.item}
                          onChange={(e) => handleDirectEdit('item', e.target.value)}
                          className="input w-full"
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">성별</label>
                        <select 
                          value={worksheetData.gender}
                          onChange={(e) => handleDirectEdit('gender', e.target.value)}
                          className="input w-full"
                          disabled={!isEditMode}
                        >
                          <option value="남성">남성</option>
                          <option value="여성">여성</option>
                          <option value="공용">공용</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">카테고리</label>
                        <select 
                          value={worksheetData.category}
                          onChange={(e) => handleDirectEdit('category', e.target.value)}
                          className="input w-full"
                          disabled={!isEditMode}
                        >
                          <option value="상의">상의</option>
                          <option value="하의">하의</option>
                          <option value="아우터">아우터</option>
                          <option value="신발">신발</option>
                          <option value="가방">가방</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">의류</label>
                        <select 
                          value={worksheetData.apparel}
                          onChange={(e) => handleDirectEdit('apparel', e.target.value)}
                          className="input w-full"
                          disabled={!isEditMode}
                        >
                          <option value="셔츠">셔츠</option>
                          <option value="티셔츠">티셔츠</option>
                          <option value="니트">니트</option>
                          <option value="자켓">자켓</option>
                          <option value="코트">코트</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">시즌</label>
                        <select 
                          value={worksheetData.season}
                          onChange={(e) => handleDirectEdit('season', e.target.value)}
                          className="input w-full"
                          disabled={!isEditMode}
                        >
                          <option value="2025 S/S">2025 S/S</option>
                          <option value="2025 F/W">2025 F/W</option>
                          <option value="2024 S/S">2024 S/S</option>
                          <option value="2024 F/W">2024 F/W</option>
                        </select>
                      </div>

                      {/* 추가 정보 */}
                      <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">추가 정보</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#의뢰일</label>
                            <input 
                              type="date" 
                              value={worksheetData.additionalInfo.requestDate}
                              onChange={(e) => handleDirectEdit('additionalInfo.requestDate', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#납기일</label>
                            <input 
                              type="date" 
                              value={worksheetData.additionalInfo.deliveryDate}
                              onChange={(e) => handleDirectEdit('additionalInfo.deliveryDate', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#제품명</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.productName}
                              onChange={(e) => handleDirectEdit('additionalInfo.productName', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#샘플번호</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.sampleNumber}
                              onChange={(e) => handleDirectEdit('additionalInfo.sampleNumber', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#제품번호</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.productNumber}
                              onChange={(e) => handleDirectEdit('additionalInfo.productNumber', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#제조사</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.manufacturer}
                              onChange={(e) => handleDirectEdit('additionalInfo.manufacturer', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#담당자 1</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.contact1}
                              onChange={(e) => handleDirectEdit('additionalInfo.contact1', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#담당자 2</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.contact2}
                              onChange={(e) => handleDirectEdit('additionalInfo.contact2', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">#담당자 3</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.contact3}
                              onChange={(e) => handleDirectEdit('additionalInfo.contact3', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">연락처</label>
                            <input 
                              type="text" 
                              value={worksheetData.additionalInfo.contactInfo}
                              onChange={(e) => handleDirectEdit('additionalInfo.contactInfo', e.target.value)}
                              className="input w-full text-sm"
                              readOnly={!isEditMode}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 워크시트 콘텐츠 */}
              <div className={`${showChat ? 'w-2/3' : 'w-full'} overflow-y-auto`}>
                <div ref={worksheetRef}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    
                    {/* 도식화 */}
                    <div className="card">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">도식화</h3>
                        <Button variant="outline" size="sm">Edit Mode</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted rounded-lg p-4 h-48 flex items-center justify-center">
                          <img
                            src={worksheetData.technicalDrawing.frontImage}
                            alt="앞면 도면"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="bg-muted rounded-lg p-4 h-48 flex items-center justify-center">
                          <img
                            src={worksheetData.technicalDrawing.backImage}
                            alt="뒷면 도면"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      </div>
                      <div className="mt-4 space-y-1">
                        {worksheetData.technicalDrawing.annotations.map((annotation, index) => (
                          <p key={index} className="text-xs text-muted-foreground">{annotation}</p>
                        ))}
                      </div>
                    </div>

                    {/* 작업 시 주의사항 */}
                    <div className="card">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">작업 시 주의사항</h3>
                      </div>
                      <textarea 
                        value={worksheetData.workNotes}
                        onChange={(e) => handleDirectEdit('workNotes', e.target.value)}
                        className="input w-full h-48 resize-none text-sm"
                        readOnly={!isEditMode}
                      />
                    </div>

                    {/* Size Spec cm/단면 */}
                    <div className="card">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Size Spec cm/단면</h3>
                        <Button variant="outline" size="sm">수정</Button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 text-muted-foreground">사이즈</th>
                              {worksheetData.sizeSpec.sizes.map(size => (
                                <th key={size} className="text-center py-2 text-muted-foreground">{size}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border">
                              <td className="py-2 text-foreground">총장</td>
                              {worksheetData.sizeSpec.sizes.map(size => (
                                <td key={size} className="text-center py-2 text-foreground">
                                  {worksheetData.sizeSpec.measurements[size]?.totalLength || '-'}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-border">
                              <td className="py-2 text-foreground">어깨</td>
                              {worksheetData.sizeSpec.sizes.map(size => (
                                <td key={size} className="text-center py-2 text-foreground">
                                  {worksheetData.sizeSpec.measurements[size]?.shoulderWidth || '-'}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-border">
                              <td className="py-2 text-foreground">암홀</td>
                              {worksheetData.sizeSpec.sizes.map(size => (
                                <td key={size} className="text-center py-2 text-foreground">
                                  {worksheetData.sizeSpec.measurements[size]?.armhole || '-'}
                                </td>
                              ))}
                            </tr>
                            <tr className="border-b border-border">
                              <td className="py-2 text-foreground">가슴둘레</td>
                              {worksheetData.sizeSpec.sizes.map(size => (
                                <td key={size} className="text-center py-2 text-foreground">
                                  {worksheetData.sizeSpec.measurements[size]?.chestCircumference || '-'}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 수량별 색상/사이즈 */}
                    <div className="card">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">수량별 색상/사이즈</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 text-muted-foreground">색상</th>
                              {worksheetData.quantityByColorSize.sizes.map(size => (
                                <th key={size} className="text-center py-2 text-muted-foreground">{size}</th>
                              ))}
                              <th className="text-center py-2 text-muted-foreground">합계</th>
                            </tr>
                          </thead>
                          <tbody>
                            {worksheetData.quantityByColorSize.colors.map(color => (
                              <tr key={color} className="border-b border-border">
                                <td className="py-2 text-foreground">{color}</td>
                                {worksheetData.quantityByColorSize.sizes.map(size => (
                                  <td key={size} className="text-center py-2 text-foreground">
                                    {worksheetData.quantityByColorSize.quantities[color]?.[size] || 0}
                                  </td>
                                ))}
                                <td className="text-center py-2 font-medium text-foreground">
                                  {calculateTotalByColor(color)}
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t border-border bg-muted">
                              <td className="py-2 font-medium text-foreground">합계</td>
                              {worksheetData.quantityByColorSize.sizes.map(size => (
                                <td key={size} className="text-center py-2 font-medium text-foreground">
                                  {calculateTotalBySize(size)}
                                </td>
                              ))}
                              <td className="text-center py-2 font-bold text-foreground">
                                {calculateGrandTotal()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 부자재 */}
                    <div className="card">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">부자재</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 text-muted-foreground">품명</th>
                              <th className="text-left py-2 text-muted-foreground">색상</th>
                              <th className="text-left py-2 text-muted-foreground">규격</th>
                              <th className="text-right py-2 text-muted-foreground">수량</th>
                            </tr>
                          </thead>
                          <tbody>
                            {worksheetData.subMaterials.map((material, index) => (
                              <tr key={index} className="border-b border-border">
                                <td className="py-2 text-foreground">{material.name}</td>
                                <td className="py-2 text-foreground">{material.color}</td>
                                <td className="py-2 text-foreground">{material.specification}</td>
                                <td className="text-right py-2 text-foreground">{material.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 원단 정보 */}
                    <div className="card">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">원단 정보</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 text-muted-foreground">위치</th>
                              <th className="text-left py-2 text-muted-foreground">업체/품명</th>
                              <th className="text-left py-2 text-muted-foreground">색상</th>
                              <th className="text-left py-2 text-muted-foreground">사이즈/단가</th>
                              <th className="text-left py-2 text-muted-foreground">혼용률</th>
                              <th className="text-left py-2 text-muted-foreground">요척</th>
                            </tr>
                          </thead>
                          <tbody>
                            {worksheetData.fabricInfo.map((info, index) => (
                              <tr key={index} className="border-b border-border">
                                <td className="py-2 text-foreground">{info.location}</td>
                                <td className="py-2 text-foreground">{info.companyItem}</td>
                                <td className="py-2 text-foreground">{info.color}</td>
                                <td className="py-2 text-foreground">{info.sizeUnitPrice}</td>
                                <td className="py-2 text-foreground">{info.composition}</td>
                                <td className="py-2 text-foreground">{info.yield}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* ChatGPT UI */}
              {showChat && (
                <div className="w-1/3 border-l border-border bg-muted flex flex-col">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">AI 채팅</h3>
                    <p className="text-sm text-muted-foreground mt-1">워크시트 내용을 AI와 함께 수정해보세요</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-primary text-white' 
                            : 'bg-card text-foreground border border-border'
                        }`}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-card text-foreground border border-border px-4 py-2 rounded-lg">
                          AI가 응답하고 있습니다...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-border">
                    <form onSubmit={handleChatSubmit} className="flex space-x-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="워크시트에 대해 질문하거나 수정 요청을 해주세요..."
                        className="flex-1 input text-sm"
                        disabled={isChatLoading}
                      />
                      <Button 
                        type="submit" 
                        disabled={!chatMessage.trim() || isChatLoading}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        전송
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 