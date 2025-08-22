"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const AdvancedDrawingEditor = dynamic(
  () => import("@/components/ui/advanced-drawing-editor").then(m => m.AdvancedDrawingEditor),
  { ssr: false }
);
const BrandLoader = dynamic(
  () => import("@/components/ui/brand-loader").then(m => m.BrandLoader),
  { ssr: false }
);
import { PDFDownload } from "@/components/ui/pdf-download";
import { Toggle } from "@/components/ui/toggle";
import { Save } from "lucide-react";

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
    image: string;
    frontImage?: string;
    backImage?: string;
    annotations: string[];
    layers?: any[];
    svgContent?: string;
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

export default function WorksheetDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showDrawingEditor, setShowDrawingEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [sizeSpecType, setSizeSpecType] = useState<'cm/단면' | 'cm/총장' | 'inch/단면' | 'inch/총장'>('cm/단면');
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isChatLoading] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);

  const worksheetId = params.id as string;

  useEffect(() => {
    if (worksheetId) {
      loadWorksheet();
    }
  }, [worksheetId]);

  const loadWorksheet = async () => {
    try {
      setLoading(true);
      
      // 실제 API 호출
      const response = await fetch(`/api/worksheet/${worksheetId}`);
      if (!response.ok) {
        // 데모 데이터로 대체
        setWorksheetData({
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
        });
        return;
      }

      const data = await response.json();
      setWorksheetData(data.worksheet);
    } catch (error) {
      console.error('Error loading worksheet:', error);
      setError('작업지시서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEdit = (field: string, value: string | number) => {
    if (!worksheetData) return;

    const fieldParts = field.split('.');
    setWorksheetData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      if (fieldParts.length === 1) {
        (newData as any)[fieldParts[0]] = value;
      } else if (fieldParts.length === 2) {
        (newData as any)[fieldParts[0]][fieldParts[1]] = value;
      } else if (fieldParts.length === 3) {
        (newData as any)[fieldParts[0]][fieldParts[1]][fieldParts[2]] = value;
      }
      return newData;
    });
  };

  // 사이즈 관리 함수들 (생성 화면과 동일)
  const addSize = () => {
    if (!worksheetData) return;
    const newSize = `S${worksheetData.sizeSpec.sizes.length + 1}`;
    setWorksheetData(prev => ({
      ...prev!,
      sizeSpec: {
        ...prev!.sizeSpec,
        sizes: [...prev!.sizeSpec.sizes, newSize],
        measurements: {
          ...prev!.sizeSpec.measurements,
          [newSize]: { totalLength: 0, shoulderWidth: 0, armhole: 0, chestCircumference: 0 }
        }
      },
      quantityByColorSize: {
        ...prev!.quantityByColorSize,
        sizes: [...prev!.quantityByColorSize.sizes, newSize],
        quantities: Object.fromEntries(
          prev!.quantityByColorSize.colors.map(color => [
            color,
            { ...prev!.quantityByColorSize.quantities[color], [newSize]: 0 }
          ])
        )
      }
    }));
  };

  const removeSize = (sizeToRemove: string) => {
    if (!worksheetData || worksheetData.sizeSpec.sizes.length <= 1) return;
    setWorksheetData(prev => {
      const newMeasurements = { ...prev!.sizeSpec.measurements } as any;
      delete newMeasurements[sizeToRemove];
      const newQuantities = Object.fromEntries(
        prev!.quantityByColorSize.colors.map(color => {
          const colorQuantities = { ...prev!.quantityByColorSize.quantities[color] } as any;
          delete colorQuantities[sizeToRemove];
          return [color, colorQuantities];
        })
      ) as any;
      return {
        ...prev!,
        sizeSpec: {
          ...prev!.sizeSpec,
          sizes: prev!.sizeSpec.sizes.filter(s => s !== sizeToRemove),
          measurements: newMeasurements
        },
        quantityByColorSize: {
          ...prev!.quantityByColorSize,
          sizes: prev!.quantityByColorSize.sizes.filter(s => s !== sizeToRemove),
          quantities: newQuantities
        }
      } as any;
    });
  };

  // 색상 관리 함수들
  const addColor = () => {
    if (!worksheetData) return;
    const newColor = `색상${worksheetData.quantityByColorSize.colors.length + 1}`;
    setWorksheetData(prev => ({
      ...prev!,
      quantityByColorSize: {
        ...prev!.quantityByColorSize,
        colors: [...prev!.quantityByColorSize.colors, newColor],
        quantities: {
          ...prev!.quantityByColorSize.quantities,
          [newColor]: Object.fromEntries(prev!.quantityByColorSize.sizes.map(size => [size, 0])) as any
        }
      }
    }));
  };

  const removeColor = (colorToRemove: string) => {
    if (!worksheetData || worksheetData.quantityByColorSize.colors.length <= 1) return;
    setWorksheetData(prev => {
      const newQuantities = { ...prev!.quantityByColorSize.quantities } as any;
      delete newQuantities[colorToRemove];
      return {
        ...prev!,
        quantityByColorSize: {
          ...prev!.quantityByColorSize,
          colors: prev!.quantityByColorSize.colors.filter(c => c !== colorToRemove),
          quantities: newQuantities
        }
      } as any;
    });
  };

  // 부자재 관리
  const addSubMaterial = () => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      subMaterials: [...prev!.subMaterials, { name: '', color: '', specification: '', quantity: 0 }]
    }));
  };

  const removeSubMaterial = (index: number) => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      subMaterials: prev!.subMaterials.filter((_, i) => i !== index)
    }));
  };

  const updateSubMaterial = (index: number, field: string, value: string | number) => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      subMaterials: prev!.subMaterials.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    }));
  };

  // 원단 정보 관리
  const addFabricInfo = () => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      fabricInfo: [...prev!.fabricInfo, { location: '', companyItem: '', color: '', sizeUnitPrice: '', composition: '', yield: '' }]
    }));
  };

  const removeFabricInfo = (index: number) => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      fabricInfo: prev!.fabricInfo.filter((_, i) => i !== index)
    }));
  };

  const updateFabricInfo = (index: number, field: string, value: string) => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      fabricInfo: prev!.fabricInfo.map((info, i) => (i === index ? { ...info, [field]: value } : info))
    }));
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

  const handleDrawingSave = (layers: any[], svgContent: string) => {
    if (worksheetData) {
      setWorksheetData(prev => ({
        ...prev!,
        technicalDrawing: {
          ...prev!.technicalDrawing,
          layers,
          svgContent
        }
      }));
    }
    setShowDrawingEditor(false);
  };

  const handleSave = async () => {
    if (!worksheetData || !user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/worksheet/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worksheetData,
          userId: user.id,
          worksheetId: Number(worksheetId),
          forceCreate: false
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage(data.message);
        setLastSavedAt(new Date().toISOString());
        // 드라이브에도 작업지시서 항목 추가 (동일 로직)
        try {
          const assetName = `${worksheetData.title || '작업지시서'}.json`;
          const assetPath = `worksheets/${String(data.id || Date.now())}.json`;
          await fetch('/api/drive/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, name: assetName, path: assetPath, url: '', category: '작업지시서' })
          }).catch(() => {});
          // 로컬 데모 드라이브 반영
          try {
            const driveKey = 'demo_drive_assets';
            const prevDriveJson = typeof window !== 'undefined' ? window.localStorage.getItem(driveKey) : null;
            const prevDrive = prevDriveJson ? JSON.parse(prevDriveJson) : [];
            const newAsset = { id: `local-${Date.now()}`, user_id: user.id, name: assetName, path: assetPath, url: '', category: '작업지시서', uploadedAt: new Date().toISOString() };
            const mergedDrive = [newAsset, ...prevDrive.filter((a: any) => a.path !== newAsset.path)];
            if (typeof window !== 'undefined') window.localStorage.setItem(driveKey, JSON.stringify(mergedDrive));
          } catch {}
        } catch {}
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen section-gray">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">로그인이 필요합니다</h1>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/sign-in">로그인하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <BrandLoader />
    );
  }

  if (error || !worksheetData) {
    return (
      <div className="min-h-screen section-gray">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">작업지시서를 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/worksheet">새 작업지시서 만들기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 고정 헤더: 전체 상단에 가로로 꽉 차게 */}
        <div className="flex-shrink-0">
          <div className="w-full border-b border-border bg-background">
            <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-4 flex-1">
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
              <div>
                {isEditMode ? (
                  <input
                    type="text"
                    value={worksheetData.title}
                    onChange={(e) => handleDirectEdit('title', e.target.value)}
                    className="text-2xl font-bold text-foreground bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-2 py-1"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground">{worksheetData.title}</h1>
                )}
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-2">
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
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
              <PDFDownload
                elementRef={worksheetRef}
                filename={`worksheet_${worksheetData.title.replace(/\s+/g, '_')}.pdf`}
                type="element"
                variant="primary"
                size="md"
              />
            </div>
          </div>
        </div>
        </div>

        {/* 저장 메시지 알림 */}
        {saveMessage && (
          <div className="absolute top-4 right-4 z-50">
            <div className={`px-4 py-2 rounded-lg shadow-lg ${
              saveMessage.includes('실패') || saveMessage.includes('오류') 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}>
              {saveMessage}
            </div>
          </div>
        )}

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

                  {/* 추가 정보 (생성 화면과 동일) */}
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
          <div className={`${showChat ? 'w-2/3' : 'w-full'} overflow-y-auto h-full`}>
            <div ref={worksheetRef} className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
                
                {/* 도식화 */}
                <div className="card h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">도식화</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDrawingEditor(true)}
                    >
                      편집 모드
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="bg-muted rounded-lg p-4 flex items-center justify-center relative">
                      <img
                        src={worksheetData.technicalDrawing.frontImage}
                        alt="앞면 도면"
                        className="w-full h-full object-cover rounded"
                      />
                      {worksheetData.technicalDrawing.frontElements && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          {worksheetData.technicalDrawing.frontElements.length}개 요소
                        </div>
                      )}
                    </div>
                    <div className="bg-muted rounded-lg p-4 flex items-center justify-center relative">
                      <img
                        src={worksheetData.technicalDrawing.backImage}
                        alt="뒷면 도면"
                        className="w-full h-full object-cover rounded"
                      />
                      {worksheetData.technicalDrawing.backElements && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          {worksheetData.technicalDrawing.backElements.length}개 요소
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    {worksheetData.technicalDrawing.annotations.map((annotation, index) => (
                      <p key={index} className="text-xs text-muted-foreground">{annotation}</p>
                    ))}
                  </div>
                </div>

                {/* 작업 시 주의사항 */}
                <div className="card h-full flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground">작업 시 주의사항</h3>
                  </div>
                  <textarea 
                    value={worksheetData.workNotes}
                    onChange={(e) => handleDirectEdit('workNotes', e.target.value)}
                    className="input w-full flex-1 resize-none text-sm"
                    readOnly={!isEditMode}
                  />
                </div>

                {/* Size Spec */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-foreground">Size Spec</h3>
                      <select 
                        value={sizeSpecType}
                        onChange={(e) => setSizeSpecType(e.target.value as any)}
                        className="input text-sm"
                        disabled={!isEditMode}
                      >
                        <option value="cm/단면">cm/단면</option>
                        <option value="cm/총장">cm/총장</option>
                        <option value="inch/단면">inch/단면</option>
                        <option value="inch/총장">inch/총장</option>
                      </select>
                    </div>
                    {isEditMode && (
                      <Button variant="outline" size="sm" onClick={addSize}>사이즈 추가</Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground">사이즈</th>
                          {worksheetData.sizeSpec.sizes.map(size => (
                            <th key={size} className="text-center py-2 text-muted-foreground">
                              <div className="flex items-center justify-center space-x-1">
                                <span>{size}</span>
                                {isEditMode && worksheetData.sizeSpec.sizes.length > 1 && (
                                  <button onClick={() => removeSize(size)} className="text-red-500 hover:text-red-700 text-xs">×</button>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-2 text-foreground">총장</td>
                          {worksheetData.sizeSpec.sizes.map(size => (
                            <td key={size} className="text-center py-2 text-foreground">
                              {isEditMode ? (
                                <input type="number" value={worksheetData.sizeSpec.measurements[size]?.totalLength || 0} onChange={(e) => handleDirectEdit(`sizeSpec.measurements.${size}.totalLength`, Number(e.target.value))} className="input w-24 text-center text-sm" />
                              ) : (
                                worksheetData.sizeSpec.measurements[size]?.totalLength || '-'
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 text-foreground">어깨</td>
                          {worksheetData.sizeSpec.sizes.map(size => (
                            <td key={size} className="text-center py-2 text-foreground">
                              {isEditMode ? (
                                <input type="number" value={worksheetData.sizeSpec.measurements[size]?.shoulderWidth || 0} onChange={(e) => handleDirectEdit(`sizeSpec.measurements.${size}.shoulderWidth`, Number(e.target.value))} className="input w-24 text-center text-sm" />
                              ) : (
                                worksheetData.sizeSpec.measurements[size]?.shoulderWidth || '-'
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 text-foreground">암홀</td>
                          {worksheetData.sizeSpec.sizes.map(size => (
                            <td key={size} className="text-center py-2 text-foreground">
                              {isEditMode ? (
                                <input type="number" value={worksheetData.sizeSpec.measurements[size]?.armhole || 0} onChange={(e) => handleDirectEdit(`sizeSpec.measurements.${size}.armhole`, Number(e.target.value))} className="input w-24 text-center text-sm" />
                              ) : (
                                worksheetData.sizeSpec.measurements[size]?.armhole || '-'
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 text-foreground">가슴둘레</td>
                          {worksheetData.sizeSpec.sizes.map(size => (
                            <td key={size} className="text-center py-2 text-foreground">
                              {isEditMode ? (
                                <input type="number" value={worksheetData.sizeSpec.measurements[size]?.chestCircumference || 0} onChange={(e) => handleDirectEdit(`sizeSpec.measurements.${size}.chestCircumference`, Number(e.target.value))} className="input w-24 text-center text-sm" />
                              ) : (
                                worksheetData.sizeSpec.measurements[size]?.chestCircumference || '-'
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 수량별 색상/사이즈 */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">수량별 색상/사이즈</h3>
                    {isEditMode && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={addColor}>색상 추가</Button>
                      </div>
                    )}
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
                          {isEditMode && <th className="text-center py-2 text-muted-foreground">삭제</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {worksheetData.quantityByColorSize.colors.map(color => (
                          <tr key={color} className="border-b border-border">
                            <td className="py-2 text-foreground">
                              {isEditMode ? (
                                <input type="text" value={color} onChange={(e) => {
                                  const newColors = worksheetData.quantityByColorSize.colors.map(c => c === color ? e.target.value : c);
                                  const newQuantities: any = { ...worksheetData.quantityByColorSize.quantities };
                                  newQuantities[e.target.value] = newQuantities[color];
                                  delete newQuantities[color];
                                  setWorksheetData(prev => ({
                                    ...prev!,
                                    quantityByColorSize: { ...prev!.quantityByColorSize, colors: newColors, quantities: newQuantities }
                                  }));
                                }} className="input w-28 text-sm" />
                              ) : color}
                            </td>
                            {worksheetData.quantityByColorSize.sizes.map(size => (
                              <td key={size} className="text-center py-2 text-foreground">
                                {isEditMode ? (
                                  <input type="number" value={worksheetData.quantityByColorSize.quantities[color]?.[size] || 0} onChange={(e) => {
                                    setWorksheetData(prev => ({
                                      ...prev!,
                                      quantityByColorSize: {
                                        ...prev!.quantityByColorSize,
                                        quantities: {
                                          ...prev!.quantityByColorSize.quantities,
                                          [color]: { ...prev!.quantityByColorSize.quantities[color], [size]: Number(e.target.value) }
                                        }
                                      }
                                    }));
                                  }} className="input w-24 text-center text-sm" />
                                ) : (
                                  worksheetData.quantityByColorSize.quantities[color]?.[size] || 0
                                )}
                              </td>
                            ))}
                            <td className="text-center py-2 font-medium text-foreground">{calculateTotalByColor(color)}</td>
                            {isEditMode && (
                              <td className="text-center py-2">
                                {worksheetData.quantityByColorSize.colors.length > 1 && (
                                  <button onClick={() => removeColor(color)} className="text-red-500 hover:text-red-700 text-xs">×</button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                        <tr className="border-t border-border bg-muted">
                          <td className="py-2 font-medium text-foreground">합계</td>
                          {worksheetData.quantityByColorSize.sizes.map(size => (
                            <td key={size} className="text-center py-2 font-medium text-foreground">{calculateTotalBySize(size)}</td>
                          ))}
                          <td className="text-center py-2 font-bold text-foreground">{calculateGrandTotal()}</td>
                          {isEditMode && <td></td>}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 부자재 */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">부자재</h3>
                    {isEditMode && (
                      <Button variant="outline" size="sm" onClick={addSubMaterial}>부자재 추가</Button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground">품명</th>
                          <th className="text-left py-2 text-muted-foreground">색상</th>
                          <th className="text-left py-2 text-muted-foreground">규격</th>
                          <th className="text-right py-2 text-muted-foreground">수량</th>
                          {isEditMode && <th className="text-center py-2 text-muted-foreground">삭제</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {worksheetData.subMaterials.map((material, index) => (
                          <tr key={index} className="border-b border-border">
                            <td className="py-2 text-foreground">
                              {isEditMode ? (
                                <input type="text" value={material.name} onChange={(e) => updateSubMaterial(index, 'name', e.target.value)} className="input w-full text-sm" />
                              ) : material.name}
                            </td>
                            <td className="py-2 text-foreground">
                              {isEditMode ? (
                                <input type="text" value={material.color} onChange={(e) => updateSubMaterial(index, 'color', e.target.value)} className="input w-full text-sm" />
                              ) : material.color}
                            </td>
                            <td className="py-2 text-foreground">
                              {isEditMode ? (
                                <input type="text" value={material.specification} onChange={(e) => updateSubMaterial(index, 'specification', e.target.value)} className="input w-full text-sm" />
                              ) : material.specification}
                            </td>
                            <td className="text-right py-2 text-foreground">
                              {isEditMode ? (
                                <input type="number" value={material.quantity} onChange={(e) => updateSubMaterial(index, 'quantity', Number(e.target.value))} className="input w-20 text-right text-sm" />
                              ) : material.quantity}
                            </td>
                            {isEditMode && (
                              <td className="text-center py-2">
                                <button onClick={() => removeSubMaterial(index)} className="text-red-500 hover:text-red-700 text-xs">×</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 원단 정보 */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">원단 정보</h3>
                    {isEditMode && (
                      <Button variant="outline" size="sm" onClick={addFabricInfo}>원단 추가</Button>
                    )}
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
                          {isEditMode && <th className="text-center py-2 text-muted-foreground">삭제</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {worksheetData.fabricInfo.map((info, index) => (
                          <tr key={index} className="border-b border-border">
                            <td className="py-2 text-foreground">{isEditMode ? (<input type="text" value={info.location} onChange={(e) => updateFabricInfo(index, 'location', e.target.value)} className="input w-full text-sm" />) : info.location}</td>
                            <td className="py-2 text-foreground">{isEditMode ? (<input type="text" value={info.companyItem} onChange={(e) => updateFabricInfo(index, 'companyItem', e.target.value)} className="input w-full text-sm" />) : info.companyItem}</td>
                            <td className="py-2 text-foreground">{isEditMode ? (<input type="text" value={info.color} onChange={(e) => updateFabricInfo(index, 'color', e.target.value)} className="input w-full text-sm" />) : info.color}</td>
                            <td className="py-2 text-foreground">{isEditMode ? (<input type="text" value={info.sizeUnitPrice} onChange={(e) => updateFabricInfo(index, 'sizeUnitPrice', e.target.value)} className="input w-full text-sm" />) : info.sizeUnitPrice}</td>
                            <td className="py-2 text-foreground">{isEditMode ? (<input type="text" value={info.composition} onChange={(e) => updateFabricInfo(index, 'composition', e.target.value)} className="input w-full text-sm" />) : info.composition}</td>
                            <td className="py-2 text-foreground">{isEditMode ? (<input type="text" value={info.yield} onChange={(e) => updateFabricInfo(index, 'yield', e.target.value)} className="input w-full text-sm" />) : info.yield}</td>
                            {isEditMode && (
                              <td className="text-center py-2">
                                <button onClick={() => removeFabricInfo(index)} className="text-red-500 hover:text-red-700 text-xs">×</button>
                              </td>
                            )}
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
                <form onSubmit={(e) => e.preventDefault()} className="flex space-x-2">
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

        {/* 도식화 편집기 */}
        {showDrawingEditor && worksheetData && (
          <AdvancedDrawingEditor
            svgUrl={worksheetData.technicalDrawing.frontImage}
            layers={worksheetData.technicalDrawing.layers}
            onSave={handleDrawingSave}
            onClose={() => setShowDrawingEditor(false)}
            isEditMode={true}
          />
        )}
      </div>
    </div>
  );
}
