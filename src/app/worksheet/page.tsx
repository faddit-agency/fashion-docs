"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/layout/header";
import dynamic from "next/dynamic";
const BrandLoader = dynamic(() => import("@/components/ui/brand-loader").then(m => m.BrandLoader), { ssr: false });
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { PDFDownload } from "@/components/ui/pdf-download";
import { Toggle } from "@/components/ui/toggle";
import { DriveSelector } from "@/components/ui/drive-selector";
import { AdvancedDrawingEditor } from "@/components/ui/advanced-drawing-editor";
import { FileText, X, FolderOpen, Camera } from "lucide-react";
import Link from "next/link";
import { generateWorksheetThumbnail, saveWorksheetThumbnail } from "@/components/ui/worksheet-thumbnail";

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
    frontElements?: any[];
    backElements?: any[];
    annotations: string[];
    layers?: any[];
    svgContent?: string;
  };
  workNotes: string;
  sizeSpec: {
    sizes: string[];
    measurements: {
      [key: string]: {
        [category: string]: number;
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
  const [sizeSpecType, setSizeSpecType] = useState<'cm/단면' | 'cm/총장' | 'inch/단면' | 'inch/총장'>('cm/단면');
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showDriveSelector, setShowDriveSelector] = useState(false);
  const [showDrawingEditor, setShowDrawingEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const worksheetRef = useRef<HTMLDivElement>(null);

  // 썸네일 캡처 함수
  const captureThumbnail = async (worksheetId: string) => {
    if (!worksheetRef.current) return null;
    
    setIsCapturing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(worksheetRef.current, {
        width: 2000,
        height: 1600,
        scale: 0.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        logging: false,
        ignoreElements: (element) => {
          // 편집 모드 버튼이나 불필요한 요소 제외
          return element.classList.contains('edit-mode-button') || 
                 element.classList.contains('capture-exclude');
        }
      });
      
      // 이미지 품질을 낮춰서 파일 크기 줄이기
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      // 캡처된 이미지 확인
      console.log('캡처된 썸네일 정보:', {
        worksheetId,
        thumbnailLength: thumbnailUrl.length,
        thumbnailType: thumbnailUrl.substring(0, 30),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      });
      
      // 썸네일 저장
      saveWorksheetThumbnail(worksheetId, thumbnailUrl);
      
      console.log('작업지시서 썸네일 캡처 완료:', worksheetId);
      return thumbnailUrl;
    } catch (error) {
      console.error('썸네일 캡처 오류:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  // 수동 썸네일 캡처 함수
  const handleManualCapture = async () => {
    if (!worksheetData) return;
    
    // 실제 worksheet ID 사용 (없으면 현재 시간 기반 ID)
    const worksheetId = worksheetData.id || `temp_${Date.now()}`;
    console.log('썸네일 캡처 시작 - worksheetId:', worksheetId);
    
    const thumbnailUrl = await captureThumbnail(worksheetId);
    
    if (thumbnailUrl) {
      alert('썸네일이 성공적으로 캡처되었습니다!');
      // 마이페이지로 이동하여 결과 확인
      setTimeout(() => {
        window.open('/mypage', '_blank');
      }, 1000);
    } else {
      alert('썸네일 캡처에 실패했습니다.');
    }
  };

  // const _sampleWorksheetData: WorksheetData = {
  //   title: "베이직 셔츠",
  //   brand: "FADDIT",
  //   item: "셔츠",
  //   gender: "남성",
  //   category: "상의",
  //   apparel: "셔츠",
  //   season: "2025 S/S",
      //   additionalInfo: {
  //     requestDate: "2024-12-15",
  //     deliveryDate: "2025-01-15",
  //     productName: "베이직 셔츠",
  //     sampleNumber: "SAMPLE-001",
  //     productNumber: "PROD-001",
  //     manufacturer: "패션팩토리",
  //     contact1: "김철수",
  //     contact2: "이영희",
  //     contact3: "박민수",
  //     contactInfo: "010-1234-5678"
  //   },
      //   technicalDrawing: {
  //     frontImage: "/api/placeholder/400/300",
  //     backImage: "/api/placeholder/400/300",
  //     annotations: ["앞면: 포켓 위치", "뒷면: 플리츠 디테일"]
  //   },
      //   workNotes: "면 소재 사용, 깔끔한 실루엣으로 제작",
  //   sizeSpec: {
  //     sizes: ["S", "M", "L", "XL"],
  //     measurements: {
  //       S: { totalLength: 70, shoulderWidth: 45, armhole: 20, chestCircumference: 100 },
  //       M: { totalLength: 72, shoulderWidth: 47, armhole: 21, chestCircumference: 104 },
  //       L: { totalLength: 74, shoulderWidth: 49, armhole: 22, chestCircumference: 108 },
  //       XL: { totalLength: 76, shoulderWidth: 51, armhole: 23, chestCircumference: 112 }
  //     }
  //   },
      //   quantityByColorSize: {
  //     colors: ["화이트", "블랙", "네이비"],
  //     sizes: ["S", "M", "L", "XL"],
  //     quantities: {
  //       "화이트": { S: 50, M: 100, L: 80, XL: 30 },
  //       "블랙": { S: 40, M: 90, L: 70, XL: 25 },
  //       "네이비": { S: 30, M: 80, L: 60, XL: 20 }
  //     }
  //   },
      //   labelPosition: {
  //     images: ["/api/placeholder/200/150"]
  //   },
  //   fabric: {
  //     mainFabric: "면 100%",
  //     outerFabric: "면 100%",
  //     swatches: ["/api/placeholder/100/100"]
  //   },
  //   pattern: {
  //     fileName: "pattern.ai",
  //     fileUrl: "/api/placeholder/200/200"
  //   },
  //   subMaterials: [
  //     { name: "단추", color: "화이트", specification: "플라스틱", quantity: 6 },
  //     { name: "실", color: "화이트", specification: "폴리에스터", quantity: 200 }
  //   ],
  //   fabricInfo: [
  //     {
  //       location: "상의",
  //       companyItem: "면 원단",
  //       color: "화이트",
  //       sizeUnitPrice: "₩5,000/야드",
  //       composition: "면 100%",
  //       yield: "3야드"
  //     }
  //   ]
  // };

  const handleFileUploadComplete = (url: string, path: string) => {
    setUploadedFile({ url, path });
    setError(null);
  };

  const handleFileUploadError = (errorMessage: string) => {
    setError(errorMessage);
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

  const handleDriveSelect = (asset: any) => {
    console.log('Selected asset from drive:', asset);
    console.log('Current worksheetData:', worksheetData);
    console.log('Current uploadedFile:', uploadedFile);
    
    // 작업지시서가 생성된 후에는 카테고리별로 적용
    if (worksheetData) {
      console.log('Worksheet already exists, applying category-specific logic');
      if (asset.category === '패턴') {
        console.log('Applying pattern asset');
        setWorksheetData(prev => ({
          ...prev!,
          pattern: {
            fileName: asset.name,
            fileUrl: asset.path
          }
        }));
      } else if (asset.category === '원단') {
        console.log('Applying fabric asset');
        setWorksheetData(prev => ({
          ...prev!,
          fabric: {
            ...prev!.fabric,
            swatches: [...prev!.fabric.swatches, asset.path]
          }
        }));
      } else if (asset.category === '도식화') {
        console.log('Applying drawing asset');
        setWorksheetData(prev => ({
          ...prev!,
          technicalDrawing: {
            ...prev!.technicalDrawing,
            image: asset.path
          }
        }));
      } else {
        console.log('Applying general asset to technical drawing');
        setWorksheetData(prev => ({
          ...prev!,
          technicalDrawing: {
            ...prev!.technicalDrawing,
            image: asset.path
          }
        }));
      }
    } else {
      // 작업지시서 생성 전에는 파일 업로드로 처리
      console.log('No worksheet exists, setting uploaded file for generation');
      
      // asset.url이 있으면 사용하고, 없으면 placeholder URL 생성
      let fileUrl = asset.url;
      if (!fileUrl) {
        // 파일 확장자에 따라 다른 placeholder 사용
        const extension = asset.path.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') {
          fileUrl = `/api/placeholder/400/600?text=${encodeURIComponent(asset.name)}&bg=white&color=black`;
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
          fileUrl = `/api/placeholder/400/600?text=${encodeURIComponent(asset.name)}&bg=gray&color=white`;
        } else {
          fileUrl = `/api/placeholder/400/600?text=${encodeURIComponent(asset.name)}`;
        }
      }
      
      setUploadedFile({ 
        url: fileUrl, 
        path: asset.path 
      });
      setError(null);
      console.log('Set uploadedFile:', { url: fileUrl, path: asset.path });
    }
    
    setShowDriveSelector(false);
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

  // 사이즈 관리 함수들
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
          [newSize]: { 
            총장: 0, 
            어깨: 0, 
            암홀: 0, 
            가슴둘레: 0,
            ...Object.fromEntries(
              Object.keys(prev!.sizeSpec.measurements[prev!.sizeSpec.sizes[0]] || {}).map(category => [category, 0])
            )
          }
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

  // 카테고리 관리 함수들
  const addCategory = () => {
    if (!worksheetData) return;
    const existingCategories = Object.keys(worksheetData.sizeSpec.measurements[worksheetData.sizeSpec.sizes[0]] || {});
    const newCategory = `카테고리${existingCategories.length + 1}`;
    
    setWorksheetData(prev => ({
      ...prev!,
      sizeSpec: {
        ...prev!.sizeSpec,
        measurements: Object.fromEntries(
          prev!.sizeSpec.sizes.map(size => [
            size,
            {
              ...prev!.sizeSpec.measurements[size],
              [newCategory]: 0
            }
          ])
        )
      }
    }));
  };

  const removeCategory = (categoryToRemove: string) => {
    if (!worksheetData) return;
    
    setWorksheetData(prev => {
      const newMeasurements = Object.fromEntries(
        prev!.sizeSpec.sizes.map(size => {
          const sizeMeasurements = { ...prev!.sizeSpec.measurements[size] };
          delete sizeMeasurements[categoryToRemove as keyof typeof sizeMeasurements];
          return [size, sizeMeasurements];
        })
      );
      
      return {
        ...prev!,
        sizeSpec: {
          ...prev!.sizeSpec,
          measurements: newMeasurements
        }
      };
    });
  };

  const removeSize = (sizeToRemove: string) => {
    if (!worksheetData || worksheetData.sizeSpec.sizes.length <= 1) return;
    
    setWorksheetData(prev => {
      const newMeasurements = { ...prev!.sizeSpec.measurements };
      delete newMeasurements[sizeToRemove];
      
      const newQuantities = Object.fromEntries(
        prev!.quantityByColorSize.colors.map(color => {
          const colorQuantities = { ...prev!.quantityByColorSize.quantities[color] };
          delete colorQuantities[sizeToRemove];
          return [color, colorQuantities];
        })
      );
      
      return {
        ...prev!,
        sizeSpec: {
          ...prev!.sizeSpec,
          sizes: prev!.sizeSpec.sizes.filter(size => size !== sizeToRemove),
          measurements: newMeasurements
        },
        quantityByColorSize: {
          ...prev!.quantityByColorSize,
          sizes: prev!.quantityByColorSize.sizes.filter(size => size !== sizeToRemove),
          quantities: newQuantities
        }
      };
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
          [newColor]: Object.fromEntries(
            prev!.quantityByColorSize.sizes.map(size => [size, 0])
          )
        }
      }
    }));
  };

  const removeColor = (colorToRemove: string) => {
    if (!worksheetData || worksheetData.quantityByColorSize.colors.length <= 1) return;
    
    setWorksheetData(prev => {
      const newQuantities = { ...prev!.quantityByColorSize.quantities };
      delete newQuantities[colorToRemove];
      
      return {
        ...prev!,
        quantityByColorSize: {
          ...prev!.quantityByColorSize,
          colors: prev!.quantityByColorSize.colors.filter(color => color !== colorToRemove),
          quantities: newQuantities
        }
      };
    });
  };

  // 부자재 관리 함수들
  const addSubMaterial = () => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      subMaterials: [
        ...prev!.subMaterials,
        { name: '', color: '', specification: '', quantity: 0 }
      ]
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
      subMaterials: prev!.subMaterials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  // 원단 정보 관리 함수들
  const addFabricInfo = () => {
    if (!worksheetData) return;
    setWorksheetData(prev => ({
      ...prev!,
      fabricInfo: [
        ...prev!.fabricInfo,
        {
          location: '',
          companyItem: '',
          color: '',
          sizeUnitPrice: '',
          composition: '',
          yield: ''
        }
      ]
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
      fabricInfo: prev!.fabricInfo.map((info, i) => 
        i === index ? { ...info, [field]: value } : info
      )
    }));
  };

  // 저장 기능
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
          forceCreate: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage(data.message);
        setLastSavedAt(new Date().toISOString());
        
        // 화면 캡처하여 썸네일 생성
        try {
          if (worksheetRef.current) {
            const worksheetId = data.id || Date.now();
            console.log('저장 후 썸네일 캡처 시작 - worksheetId:', worksheetId);
            
            const thumbnailUrl = await captureThumbnail(worksheetId.toString());
            
            // 데모 모드 반영: 로컬 스토리지에 추가 저장하여 마이페이지 탭에 노출
            try {
              const localKey = 'demo_worksheets';
              const prevJson = typeof window !== 'undefined' ? window.localStorage.getItem(localKey) : null;
              const prev = prevJson ? JSON.parse(prevJson) : [];
              const sizeRange = Array.isArray(worksheetData?.sizeSpec?.sizes)
                ? `${worksheetData.sizeSpec.sizes[0]}~${worksheetData.sizeSpec.sizes[worksheetData.sizeSpec.sizes.length - 1]}`
                : 'S~XL';
              const newItem = {
                id: Number(worksheetId),
                user_id: user.id,
                title: worksheetData.title || '작업지시서',
                category: worksheetData.category || '기타',
                size_range: sizeRange,
                content: worksheetData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              const merged = [newItem, ...prev.filter((w: any) => w.id !== newItem.id)];
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(localKey, JSON.stringify(merged));
              }
              
              // 썸네일이 캡처되지 않았으면 기본 썸네일 생성
              if (!thumbnailUrl) {
                try {
                  const defaultThumbnailUrl = await generateWorksheetThumbnail(
                    newItem.id.toString(),
                    newItem.title,
                    newItem.category
                  );
                  saveWorksheetThumbnail(newItem.id.toString(), defaultThumbnailUrl);
                } catch (thumbnailError) {
                  console.error('기본 썸네일 생성 오류:', thumbnailError);
                }
              }
            } catch {}
          }
        } catch (captureError) {
          console.error('화면 캡처 오류:', captureError);
        }
        
        // 3초 후 메시지 숨기기
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

  // 새로 만들기 템플릿 진입 처리
  useEffect(() => {
    try {
      if (!worksheetData && typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('worksheet_new_template');
        if (raw) {
          const parsed = JSON.parse(raw);
          // 일회성 사용 후 제거
          window.localStorage.removeItem('worksheet_new_template');
          setWorksheetData(parsed);
        }
      }
    } catch {}
  }, [worksheetData]);

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
                  
                  {/* 파일 업로드 섹션 */}
                  <div className="mb-6">
                    <FileUpload
                      onUploadComplete={handleFileUploadComplete}
                      onUploadError={handleFileUploadError}
                      accept=".ai,.eps,.pdf,.jpg,.png"
                      maxSize={10 * 1024 * 1024} // 10MB
                    />
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>• PDF, PNG, JPG: 최대 5MB</p>
                      <p>• AI 파일: 최대 2MB (PNG로 변환됨)</p>
                      <p>• EPS 파일: 최대 5MB</p>
                    </div>
                  </div>

                  {/* 구분선 */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">또는</span>
                    </div>
                  </div>

                  {/* 드라이브에서 선택 */}
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowDriveSelector(true)}
                      className="w-full"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      드라이브에서 파일 선택
                    </Button>
                    <p className="mt-2 text-sm text-muted-foreground">
                      기존에 업로드된 도식화, 패턴, 기술 도면 등을 선택하세요
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {uploadedFile && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">선택된 파일</h3>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {uploadedFile.path.split('/').pop() || '파일'}
                        </p>
                        <p className="text-sm text-muted-foreground">{uploadedFile.path}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {!isGenerating ? (
                  <Button
                    onClick={async () => {
                      const start = Date.now();
                      setIsGenerating(true);
                      await handleGenerateWorksheet();
                      const elapsed = Date.now() - start;
                      const remain = 2000 - elapsed; // 최소 2초 보장
                      if (remain > 0) await new Promise(r => setTimeout(r, remain));
                      setIsGenerating(false);
                    }}
                    disabled={!uploadedFile}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      작업지시서 생성하기
                    </>
                  </Button>
                ) : (
                  <BrandLoader />
                )}
              </div>
            </div>
          </div>
        ) : (
          // 작업지시서 화면
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 고정 헤더 */}
            <div className="border-b border-border bg-white shadow-sm flex-shrink-0">
              <div className="flex justify-between items-center p-6">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            showDetails ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              showDetails ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-gray-700">세부정보</span>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-gray-200"></div>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={worksheetData.title}
                      onChange={(e) => handleDirectEdit('title', e.target.value)}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors"
                      placeholder="작업지시서 제목을 입력하세요"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{worksheetData.title}</h1>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  {lastSavedAt && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>마지막 저장: {new Date(lastSavedAt).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditMode(!isEditMode)}
                                                className="edit-mode-button border-gray-300 hover:bg-gray-25"
                      size="sm"
                    >
                      {isEditMode ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          보기 모드
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          수정
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowChat(!showChat)}
                                                className="capture-exclude ai-chat-button border-gray-300 hover:bg-gray-25"
                      size="sm"
                    >
                      {showChat ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          채팅 닫기
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          AI 채팅
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      size="sm"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          저장
                        </>
                      )}
                    </Button>
                    <PDFDownload
                      elementRef={worksheetRef as React.RefObject<HTMLElement>}
                      filename={`worksheet_${worksheetData.title.replace(/\s+/g, '_')}.pdf`}
                      type="element"
                      variant="outline"
                      size="sm"
                                                className="capture-exclude border-gray-300 hover:bg-gray-25"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 저장 메시지 알림 */}
            {saveMessage && (
              <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
                <div className={`px-6 py-4 rounded-xl shadow-xl border-l-4 flex items-center space-x-3 ${
                  saveMessage.includes('실패') || saveMessage.includes('오류') 
                    ? 'bg-red-50 text-red-800 border-red-500' 
                    : 'bg-green-50 text-green-800 border-green-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    saveMessage.includes('실패') || saveMessage.includes('오류') 
                      ? 'bg-red-100' 
                      : 'bg-green-100'
                  }`}>
                    {saveMessage.includes('실패') || saveMessage.includes('오류') ? (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{saveMessage}</p>
                    <p className="text-sm opacity-75">
                      {saveMessage.includes('실패') || saveMessage.includes('오류') 
                        ? '다시 시도해주세요' 
                        : '성공적으로 저장되었습니다'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 flex overflow-hidden" ref={worksheetRef}>
              {/* 기본정보 섹션 */}
              {showDetails && (
                <div className="w-80 border-r border-gray-200 bg-gray-25 overflow-y-auto flex-shrink-0">
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
                    </div>
                    
                    <div className="space-y-5">
                      {/* 기본 정보 그룹 */}
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          제품 정보
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">브랜드</label>
                                                         <input 
                               type="text" 
                               value={worksheetData.brand}
                               onChange={(e) => handleDirectEdit('brand', e.target.value)}
                               className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                 isEditMode 
                                   ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                   : 'border-gray-200 bg-gray-25 text-gray-600'
                               }`}
                               readOnly={!isEditMode}
                               placeholder="브랜드명을 입력하세요"
                             />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">아이템</label>
                                                         <input 
                               type="text" 
                               value={worksheetData.item}
                               onChange={(e) => handleDirectEdit('item', e.target.value)}
                               className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                 isEditMode 
                                   ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                   : 'border-gray-200 bg-gray-25 text-gray-600'
                               }`}
                               readOnly={!isEditMode}
                               placeholder="아이템명을 입력하세요"
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">성별</label>
                                                             <select 
                                 value={worksheetData.gender}
                                 onChange={(e) => handleDirectEdit('gender', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 disabled={!isEditMode}
                               >
                                <option value="남성">남성</option>
                                <option value="여성">여성</option>
                                <option value="공용">공용</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                                                             <select 
                                 value={worksheetData.category}
                                 onChange={(e) => handleDirectEdit('category', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 disabled={!isEditMode}
                               >
                                <option value="상의">상의</option>
                                <option value="하의">하의</option>
                                <option value="아우터">아우터</option>
                                <option value="신발">신발</option>
                                <option value="가방">가방</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">의류</label>
                                                             <select 
                                 value={worksheetData.apparel}
                                 onChange={(e) => handleDirectEdit('apparel', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
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
                              <label className="block text-xs font-medium text-gray-600 mb-1">시즌</label>
                                                             <select 
                                 value={worksheetData.season}
                                 onChange={(e) => handleDirectEdit('season', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 disabled={!isEditMode}
                               >
                                <option value="2025 S/S">2025 S/S</option>
                                <option value="2025 F/W">2025 F/W</option>
                                <option value="2024 S/S">2024 S/S</option>
                                <option value="2024 F/W">2024 F/W</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 추가 정보 그룹 */}
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          추가 정보
                        </h3>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">의뢰일</label>
                                                             <input 
                                 type="date" 
                                 value={worksheetData.additionalInfo.requestDate}
                                 onChange={(e) => handleDirectEdit('additionalInfo.requestDate', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 readOnly={!isEditMode}
                               />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">납기일</label>
                                                             <input 
                                 type="date" 
                                 value={worksheetData.additionalInfo.deliveryDate}
                                 onChange={(e) => handleDirectEdit('additionalInfo.deliveryDate', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 readOnly={!isEditMode}
                               />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">제품명</label>
                                                         <input 
                               type="text" 
                               value={worksheetData.additionalInfo.productName}
                               onChange={(e) => handleDirectEdit('additionalInfo.productName', e.target.value)}
                               className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                 isEditMode 
                                   ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                   : 'border-gray-200 bg-gray-25 text-gray-600'
                               }`}
                               readOnly={!isEditMode}
                               placeholder="제품명을 입력하세요"
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">샘플번호</label>
                                                             <input 
                                 type="text" 
                                 value={worksheetData.additionalInfo.sampleNumber}
                                 onChange={(e) => handleDirectEdit('additionalInfo.sampleNumber', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 readOnly={!isEditMode}
                                 placeholder="샘플번호"
                               />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">제품번호</label>
                                                             <input 
                                 type="text" 
                                 value={worksheetData.additionalInfo.productNumber}
                                 onChange={(e) => handleDirectEdit('additionalInfo.productNumber', e.target.value)}
                                 className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 readOnly={!isEditMode}
                                 placeholder="제품번호"
                               />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">제조사</label>
                                                         <input 
                               type="text" 
                               value={worksheetData.additionalInfo.manufacturer}
                               onChange={(e) => handleDirectEdit('additionalInfo.manufacturer', e.target.value)}
                               className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                 isEditMode 
                                   ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                   : 'border-gray-200 bg-gray-25 text-gray-600'
                               }`}
                               readOnly={!isEditMode}
                               placeholder="제조사명을 입력하세요"
                             />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">담당자 1</label>
                                                             <input 
                                 type="text" 
                                 value={worksheetData.additionalInfo.contact1}
                                 onChange={(e) => handleDirectEdit('additionalInfo.contact1', e.target.value)}
                                 className={`w-full px-2 py-2 text-xs border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 readOnly={!isEditMode}
                                 placeholder="담당자"
                               />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">담당자 2</label>
                                                             <input 
                                 type="text" 
                                 value={worksheetData.additionalInfo.contact2}
                                 onChange={(e) => handleDirectEdit('additionalInfo.contact2', e.target.value)}
                                 className={`w-full px-2 py-2 text-xs border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 readOnly={!isEditMode}
                                 placeholder="담당자"
                               />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">담당자 3</label>
                                                             <input 
                                 type="text" 
                                 value={worksheetData.additionalInfo.contact3}
                                 onChange={(e) => handleDirectEdit('additionalInfo.contact3', e.target.value)}
                                 className={`w-full px-2 py-2 text-xs border rounded-md transition-colors ${
                                   isEditMode 
                                     ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                     : 'border-gray-200 bg-gray-25 text-gray-600'
                                 }`}
                                 readOnly={!isEditMode}
                                 placeholder="담당자"
                               />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                                                         <input 
                               type="text" 
                               value={worksheetData.additionalInfo.contactInfo}
                               onChange={(e) => handleDirectEdit('additionalInfo.contactInfo', e.target.value)}
                               className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                                 isEditMode 
                                   ? 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                   : 'border-gray-200 bg-gray-25 text-gray-600'
                               }`}
                               readOnly={!isEditMode}
                               placeholder="연락처를 입력하세요"
                             />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 워크시트 콘텐츠 */}
              <div className={`${showChat ? 'w-2/3' : 'w-full'} overflow-y-auto h-full bg-gray-25`}>
                <div ref={worksheetRef} className="h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
                    
                    {/* 도식화 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden" style={{ minHeight: '600px' }}>
                      <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">도식화</h3>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowDrawingEditor(true)}
                          className="border-gray-300 hover:bg-gray-25 text-gray-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          편집 모드
                        </Button>
                      </div>
                      <div className="flex-1 p-6">
                        <div className="bg-gray-25 rounded-lg p-4 flex items-center justify-center relative h-full min-h-[500px]">
                          <img
                            src={uploadedFile?.url || worksheetData.technicalDrawing.image}
                            alt="도식화"
                            className="w-full h-full object-contain rounded-lg shadow-sm"
                          />
                          {worksheetData.technicalDrawing.layers && (
                            <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-sm">
                              {worksheetData.technicalDrawing.layers.reduce((total, layer) => total + layer.elements.length, 0)}개 요소
                            </div>
                          )}
                        </div>
                      </div>
                      {worksheetData.technicalDrawing.annotations.length > 0 && (
                        <div className="px-6 pb-6">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              주의사항
                            </h4>
                            <div className="space-y-1">
                              {worksheetData.technicalDrawing.annotations.map((annotation, index) => (
                                <p key={index} className="text-xs text-blue-800 leading-relaxed">{annotation}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 작업 시 주의사항 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
                      <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">작업 시 주의사항</h3>
                        </div>
                      </div>
                      <div className="flex-1 p-6">
                        <textarea 
                          value={worksheetData.workNotes}
                          onChange={(e) => handleDirectEdit('workNotes', e.target.value)}
                          className={`w-full h-full resize-none text-sm border rounded-lg p-4 transition-colors ${
                            isEditMode 
                              ? 'border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500' 
                              : 'border-gray-200 bg-gray-25 text-gray-600'
                          }`}
                          readOnly={!isEditMode}
                          placeholder="작업 시 주의해야 할 사항들을 입력하세요..."
                        />
                      </div>
                    </div>

                    {/* Size Spec */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-gray-900">Size Spec</h3>
                          </div>
                          <select 
                            value={sizeSpecType}
                            onChange={(e) => setSizeSpecType(e.target.value as any)}
                            className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                              isEditMode 
                                ? 'border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                                : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}
                            disabled={!isEditMode}
                          >
                            <option value="cm/단면">cm/단면</option>
                            <option value="cm/총장">cm/총장</option>
                            <option value="inch/단면">inch/단면</option>
                            <option value="inch/총장">inch/총장</option>
                          </select>
                        </div>
                        {isEditMode && (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={addCategory}
                              className="border-purple-300 hover:bg-purple-50 text-purple-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              카테고리 추가
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={addSize}
                              className="border-purple-300 hover:bg-purple-50 text-purple-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              사이즈 추가
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">사이즈</th>
                                {worksheetData.sizeSpec.sizes.map(size => (
                                  <th key={size} className="text-center py-3 px-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center justify-center space-x-1">
                                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">{size}</span>
                                      {isEditMode && worksheetData.sizeSpec.sizes.length > 1 && (
                                        <button
                                          onClick={() => removeSize(size)}
                                          className="text-red-500 hover:text-red-700 text-xs ml-1"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {Object.keys(worksheetData.sizeSpec.measurements[worksheetData.sizeSpec.sizes[0]] || {}).map(category => (
                                <tr key={category} className="hover:bg-gray-25">
                                  <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                    <div className="flex items-center justify-between">
                                      <span>{category}</span>
                                      {isEditMode && Object.keys(worksheetData.sizeSpec.measurements[worksheetData.sizeSpec.sizes[0]] || {}).length > 1 && (
                                        <button
                                          onClick={() => removeCategory(category)}
                                          className="text-red-500 hover:text-red-700 text-xs ml-2"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  {worksheetData.sizeSpec.sizes.map(size => (
                                    <td key={size} className="text-center py-3 px-2">
                                      {isEditMode ? (
                                        <input
                                          type="number"
                                          value={worksheetData.sizeSpec.measurements[size]?.[category as keyof typeof worksheetData.sizeSpec.measurements[typeof size]] || 0}
                                          onChange={(e) => handleDirectEdit(`sizeSpec.measurements.${size}.${category}`, Number(e.target.value))}
                                          className="w-20 text-center text-sm border border-gray-300 rounded-md px-2 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        />
                                      ) : (
                                        <span className="text-sm text-gray-900 font-medium">
                                          {worksheetData.sizeSpec.measurements[size]?.[category as keyof typeof worksheetData.sizeSpec.measurements[typeof size]] || '-'}
                                        </span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* 수량별 색상/사이즈 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">수량별 색상/사이즈</h3>
                        </div>
                        {isEditMode && (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={addColor}
                              className="border-green-300 hover:bg-green-50 text-green-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              색상 추가
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={addSize}
                              className="border-green-300 hover:bg-green-50 text-green-700"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              사이즈 추가
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">색상</th>
                                {worksheetData.quantityByColorSize.sizes.map(size => (
                                  <th key={size} className="text-center py-3 px-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{size}</span>
                                  </th>
                                ))}
                                <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">합계</th>
                                {isEditMode && (
                                  <th className="text-center py-3 px-2 text-xs font-medium text-gray-600 uppercase tracking-wider">삭제</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {worksheetData.quantityByColorSize.colors.map(color => (
                                <tr key={color} className="hover:bg-gray-25">
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={color}
                                        onChange={(e) => {
                                          const newColors = worksheetData.quantityByColorSize.colors.map(c => 
                                            c === color ? e.target.value : c
                                          );
                                          const newQuantities = { ...worksheetData.quantityByColorSize.quantities };
                                          newQuantities[e.target.value] = newQuantities[color];
                                          delete newQuantities[color];
                                          
                                          setWorksheetData(prev => ({
                                            ...prev!,
                                            quantityByColorSize: {
                                              ...prev!.quantityByColorSize,
                                              colors: newColors,
                                              quantities: newQuantities
                                            }
                                          }));
                                        }}
                                        className="w-28 text-sm border border-gray-300 rounded-md px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">{color}</span>
                                    )}
                                  </td>
                                  {worksheetData.quantityByColorSize.sizes.map(size => (
                                    <td key={size} className="text-center py-3 px-2">
                                      {isEditMode ? (
                                        <input
                                          type="number"
                                          value={worksheetData.quantityByColorSize.quantities[color]?.[size] || 0}
                                          onChange={(e) => {
                                            setWorksheetData(prev => ({
                                              ...prev!,
                                              quantityByColorSize: {
                                                ...prev!.quantityByColorSize,
                                                quantities: {
                                                  ...prev!.quantityByColorSize.quantities,
                                                  [color]: {
                                                    ...prev!.quantityByColorSize.quantities[color],
                                                    [size]: Number(e.target.value)
                                                  }
                                                }
                                              }
                                            }));
                                          }}
                                          className="w-20 text-center text-sm border border-gray-300 rounded-md px-2 py-1 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        />
                                      ) : (
                                        <span className="text-sm text-gray-900 font-medium">
                                          {worksheetData.quantityByColorSize.quantities[color]?.[size] || 0}
                                        </span>
                                      )}
                                    </td>
                                  ))}
                                  <td className="text-center py-3 px-4">
                                    <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                      {calculateTotalByColor(color)}
                                    </span>
                                  </td>
                                  {isEditMode && (
                                    <td className="text-center py-3 px-2">
                                      {worksheetData.quantityByColorSize.colors.length > 1 && (
                                        <button
                                          onClick={() => removeColor(color)}
                                          className="text-red-500 hover:text-red-700 text-xs"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              ))}
                              <tr className="bg-gray-25 border-t-2 border-gray-200">
                                <td className="py-3 px-4 text-sm font-bold text-gray-900">합계</td>
                                {worksheetData.quantityByColorSize.sizes.map(size => (
                                  <td key={size} className="text-center py-3 px-2">
                                    <span className="text-sm font-bold text-gray-900 bg-gray-200 px-3 py-1 rounded-full">
                                      {calculateTotalBySize(size)}
                                    </span>
                                  </td>
                                ))}
                                <td className="text-center py-3 px-4">
                                  <span className="text-sm font-bold text-white bg-green-600 px-4 py-2 rounded-full">
                                    {calculateGrandTotal()}
                                  </span>
                                </td>
                                {isEditMode && <td></td>}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* 원단 정보 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">원단 정보</h3>
                        </div>
                        {isEditMode && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addFabricInfo}
                            className="border-indigo-300 hover:bg-indigo-50 text-indigo-700"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            원단 추가
                          </Button>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">위치</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">업체/품명</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">색상</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">사이즈/단가</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">혼용률</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">요척</th>
                                {isEditMode && (
                                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">삭제</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {worksheetData.fabricInfo.map((info, index) => (
                                <tr key={index} className="hover:bg-gray-25">
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={info.location}
                                        onChange={(e) => updateFabricInfo(index, 'location', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">{info.location}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={info.companyItem}
                                        onChange={(e) => updateFabricInfo(index, 'companyItem', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">{info.companyItem}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={info.color}
                                        onChange={(e) => updateFabricInfo(index, 'color', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">{info.color}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={info.sizeUnitPrice}
                                        onChange={(e) => updateFabricInfo(index, 'sizeUnitPrice', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">{info.sizeUnitPrice}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={info.composition}
                                        onChange={(e) => updateFabricInfo(index, 'composition', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">{info.composition}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={info.yield}
                                        onChange={(e) => updateFabricInfo(index, 'yield', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">{info.yield}</span>
                                    )}
                                  </td>
                                  {isEditMode && (
                                    <td className="text-center py-3 px-4">
                                      <button
                                        onClick={() => removeFabricInfo(index)}
                                        className="text-red-500 hover:text-red-700 text-xs"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* 부자재 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-900">부자재</h3>
                        </div>
                        {isEditMode && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addSubMaterial}
                            className="border-red-300 hover:bg-red-50 text-red-700"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            부자재 추가
                          </Button>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">품명</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">색상</th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">규격</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">수량</th>
                                {isEditMode && (
                                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wider">삭제</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {worksheetData.subMaterials.map((material, index) => (
                                <tr key={index} className="hover:bg-gray-25">
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={material.name}
                                        onChange={(e) => updateSubMaterial(index, 'name', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">{material.name}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={material.color}
                                        onChange={(e) => updateSubMaterial(index, 'color', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">{material.color}</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="text"
                                        value={material.specification}
                                        onChange={(e) => updateSubMaterial(index, 'specification', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-900">{material.specification}</span>
                                    )}
                                  </td>
                                  <td className="text-right py-3 px-4">
                                    {isEditMode ? (
                                      <input
                                        type="number"
                                        value={material.quantity}
                                        onChange={(e) => updateSubMaterial(index, 'quantity', Number(e.target.value))}
                                        className="w-20 text-right text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">{material.quantity}</span>
                                    )}
                                  </td>
                                  {isEditMode && (
                                    <td className="text-center py-3 px-4">
                                      <button
                                        onClick={() => removeSubMaterial(index)}
                                        className="text-red-500 hover:text-red-700 text-xs"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
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
              </div>

              {/* ChatGPT UI */}
              {showChat && (
                <div className="w-1/3 border-l border-gray-200 bg-white flex flex-col shadow-lg">
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">AI 어시스턴트</h3>
                        <p className="text-sm text-gray-600">워크시트 내용을 AI와 함께 수정해보세요</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-25">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">AI와 대화를 시작하세요</h4>
                        <p className="text-sm text-gray-600">워크시트에 대해 질문하거나 수정 요청을 해주세요</p>
                      </div>
                    )}
                    
                    {chatHistory.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          <div className="text-sm leading-relaxed">{message.content}</div>
                        </div>
                      </div>
                    ))}
                    
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-sm text-gray-600">AI가 응답하고 있습니다...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-gray-200 bg-white">
                    <form onSubmit={handleChatSubmit} className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="워크시트에 대해 질문하거나 수정 요청을 해주세요..."
                          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                          disabled={isChatLoading}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!chatMessage.trim() || isChatLoading}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 드라이브 선택 모달 */}
        <DriveSelector
          isOpen={showDriveSelector}
          onClose={() => setShowDriveSelector(false)}
          onSelect={handleDriveSelect}
          title="작업지시서용 파일 선택"
        />

        {/* 도식화 편집기 */}
        {showDrawingEditor && (
          <AdvancedDrawingEditor
            svgUrl={uploadedFile?.url || worksheetData?.technicalDrawing.image}
            layers={worksheetData?.technicalDrawing.layers}
            onSave={handleDrawingSave}
            onClose={() => setShowDrawingEditor(false)}
            isEditMode={true}
          />
        )}


      </div>
    </div>
  );
} 