"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./button";
import { FileUpload } from "./file-upload";
import { InlineTextEditor } from "./inline-text-editor";
import { parseSVGToLayers, generateSVGFromLayers } from "@/lib/svg-parser";
import { 
  Pen, 
  Type, 
  Image as ImageIcon, 
  Undo, 
  Redo, 
  Save, 
  X, 
  Move,
  Square,
  Circle,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Trash2,
  Plus,
  Download,
  Upload
} from "lucide-react";

interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  elements: DrawingElement[];
}

interface DrawingElement {
  id: string;
  type: 'path' | 'line' | 'text' | 'image' | 'rectangle' | 'circle' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color: string;
  strokeWidth: number;
  fontSize?: number;
  imageUrl?: string;
  endX?: number;
  endY?: number;
  pathData?: string;
  transform?: string;
  layerId: string;
}

interface AdvancedDrawingEditorProps {
  svgUrl?: string;
  layers?: DrawingLayer[];
  onSave: (layers: DrawingLayer[], svgContent: string) => void;
  onClose: () => void;
  isEditMode?: boolean;
}

export function AdvancedDrawingEditor({ 
  svgUrl, 
  layers: initialLayers = [], 
  onSave, 
  onClose,
  isEditMode = false
}: AdvancedDrawingEditorProps) {
  const [layers, setLayers] = useState<DrawingLayer[]>(initialLayers);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'pen' | 'text' | 'image' | 'rectangle' | 'circle' | 'arrow'>('select');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [history, setHistory] = useState<DrawingLayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<{x: number, y: number} | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const startPointRef = useRef<{x: number, y: number} | null>(null);
  const lastPanPointRef = useRef<{x: number, y: number} | null>(null);

  // 초기 레이어가 없으면 기본 레이어 생성
  useEffect(() => {
    if (layers.length === 0) {
      const defaultLayers: DrawingLayer[] = [
        {
          id: 'background',
          name: '배경',
          visible: true,
          locked: false,
          elements: []
        },
        {
          id: 'outline',
          name: '외곽선',
          visible: true,
          locked: false,
          elements: []
        },
        {
          id: 'details',
          name: '디테일',
          visible: true,
          locked: false,
          elements: []
        },
        {
          id: 'annotations',
          name: '주석',
          visible: true,
          locked: false,
          elements: []
        }
      ];
      setLayers(defaultLayers);
      setActiveLayer('outline');
    } else {
      setActiveLayer(layers[0]?.id || null);
    }
  }, []);

  // svgUrl이 있으면 자동으로 처리
  useEffect(() => {
    if (svgUrl && !isConverting) {
      console.log('도식화 편집기에서 svgUrl 감지:', svgUrl);
      
      // URL에서 파일명 추출
      const fileName = svgUrl.split('/').pop() || 'drawing';
      const fileType = fileName.split('.').pop()?.toLowerCase() || '';
      
      console.log('파일 정보:', { fileName, fileType });
      
      // PNG 파일인 경우 바로 표시
      if (fileType === 'png') {
        console.log('PNG 파일 감지, 바로 표시:', svgUrl);
        
        // URL에서 실제 파일 이름 추출 (확장자 제거)
        const actualFileName = fileName.replace(/\.[^/.]+$/, "");
        
        // PNG 파일을 레이어로 생성
        const pngLayer: DrawingLayer = {
          id: 'converted-png',
          name: actualFileName,
          visible: true,
          locked: false,
          elements: [
            {
              id: 'png-image',
              type: 'image',
              x: 0,
              y: 0,
              width: 800,
              height: 600,
              color: '#000000',
              strokeWidth: 1,
              layerId: 'converted-png',
              imageUrl: svgUrl
            }
          ]
        };
        
        setLayers([pngLayer]);
        setActiveLayer('converted-png');
        addToHistory([pngLayer]);
        
        // 이미지 직접 표시
        if (svgRef.current) {
          svgRef.current.innerHTML = '';
          const img = document.createElement('img');
          img.src = svgUrl;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.alt = '변환된 이미지';
          img.onerror = () => {
            console.error('PNG 이미지 로드 실패:', svgUrl);
            alert('이미지를 불러올 수 없습니다. 파일을 다시 업로드해주세요.');
          };
          img.onload = () => {
            console.log('PNG 이미지 로드 성공:', svgUrl);
          };
          svgRef.current.appendChild(img);
        }
      }
    }
  }, [svgUrl, isConverting]);

  // 줌 및 팬 기능
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5);
    setZoom(newZoom);
  }, [zoom]);

  const handlePanMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // 마우스 가운데 버튼 또는 Ctrl+클릭
      e.preventDefault();
      setIsPanning(true);
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePanMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && lastPanPointRef.current) {
      const deltaX = e.clientX - lastPanPointRef.current.x;
      const deltaY = e.clientY - lastPanPointRef.current.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanning]);

  const handlePanMouseUp = useCallback(() => {
    setIsPanning(false);
    lastPanPointRef.current = null;
  }, []);

  // 요소 선택 및 드래그 핸들러
  const handleElementClick = useCallback((e: Event) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const elementId = target.getAttribute('data-element-id');
    console.log('요소 클릭:', elementId);
    if (elementId) {
      setSelectedElement(elementId);
    }
  }, []);

  const handleElementMouseDown = useCallback((e: Event) => {
    const mouseEvent = e as MouseEvent;
    if (mouseEvent.button === 0 && !mouseEvent.ctrlKey) { // 왼쪽 클릭만, Ctrl 키 없이
      e.stopPropagation();
      const target = e.target as HTMLElement;
      const elementId = target.getAttribute('data-element-id');
      console.log('요소 마우스 다운:', elementId);
      if (elementId) {
        setSelectedElement(elementId);
        setIsDraggingElement(true);
        setDragStartPoint({ x: mouseEvent.clientX, y: mouseEvent.clientY });
        console.log('드래그 시작:', { x: mouseEvent.clientX, y: mouseEvent.clientY });
      }
    }
  }, []);

  const handleElementDrag = useCallback((e: MouseEvent) => {
    if (isDraggingElement && dragStartPoint && selectedElement) {
      const deltaX = (e.clientX - dragStartPoint.x) / zoom;
      const deltaY = (e.clientY - dragStartPoint.y) / zoom;
      
      // 드래그 중에는 콘솔 로그 최소화
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        setLayers(prevLayers => 
          prevLayers.map(layer => ({
            ...layer,
            elements: layer.elements.map(element => {
              if (element.id === selectedElement) {
                return {
                  ...element,
                  x: element.x + deltaX,
                  y: element.y + deltaY
                };
              }
              return element;
            })
          }))
        );
        
        setDragStartPoint({ x: e.clientX, y: e.clientY });
      }
    }
  }, [isDraggingElement, dragStartPoint, selectedElement, zoom]);

  const handleElementDragEnd = useCallback(() => {
    setIsDraggingElement(false);
    setDragStartPoint(null);
  }, []);

  // 히스토리 관리
  const addToHistory = useCallback((newLayers: DrawingLayer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLayers);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // 실행 취소
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  // 다시 실행
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  // AI 파일 업로드 및 SVG 변환
  const handleAIFileUpload = async (url: string, path: string) => {
    console.log('AI 파일 업로드 시작:', { url, path });
    
    // URL이 유효한지 확인
    if (!url || url === 'undefined') {
      console.error('파일 URL이 유효하지 않습니다:', url);
      alert('파일 URL이 유효하지 않습니다. 파일을 다시 업로드해주세요.');
      return;
    }
    
    // Placeholder URL인 경우 직접 파일 업로드 방식 사용
    if (url.includes('/api/placeholder/')) {
      console.log('Placeholder URL 감지, 직접 파일 업로드 방식으로 변경');
      await handleDirectFileUpload();
      return;
    }
    try {
      setIsConverting(true);
      console.log('AI 파일 업로드 시작:', { url, path });
      
      const fileName = path.split('/').pop() || 'drawing';
      const fileType = fileName.split('.').pop()?.toLowerCase() || '';
      
      console.log('파일 정보:', { fileName, fileType });
      
      // 지원하는 파일 형식 확인
      const supportedTypes = ['ai', 'eps', 'cdr', 'pdf', 'png']; // png 추가
      if (!supportedTypes.includes(fileType)) {
        throw new Error(`지원하지 않는 파일 형식입니다: ${fileType}`);
      }
      
      // PNG 파일인 경우 이미 변환된 파일이므로 바로 표시
      if (fileType === 'png') {
        console.log('PNG 파일 감지, 바로 표시:', url);
        
        // 실제 파일 이름 추출 (확장자 제거)
        const actualFileName = fileName.replace(/\.[^/.]+$/, "");
        
        // PNG 파일을 레이어로 생성
        const pngLayer: DrawingLayer = {
          id: 'converted-png',
          name: actualFileName,
          visible: true,
          locked: false,
          elements: [
            {
              id: 'png-image',
              type: 'image',
              x: 0,
              y: 0,
              width: 800,
              height: 600,
              color: '#000000',
              strokeWidth: 1,
              layerId: 'converted-png',
              imageUrl: url
            }
          ]
        };
        
        setLayers([pngLayer]);
        setActiveLayer('converted-png');
        addToHistory([pngLayer]);
        
        // 이미지 직접 표시
        if (svgRef.current) {
          svgRef.current.innerHTML = '';
          const img = document.createElement('img');
          img.src = url;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.alt = '변환된 이미지';
          img.onerror = () => {
            console.error('PNG 이미지 로드 실패:', url);
            alert('이미지를 불러올 수 없습니다. 파일을 다시 업로드해주세요.');
          };
          img.onload = () => {
            console.log('PNG 이미지 로드 성공:', url);
          };
          svgRef.current.appendChild(img);
        }
        
        alert('PNG 파일이 성공적으로 로드되었습니다!');
        return;
      }
      
      // 파일 데이터를 직접 가져오기
      let fileData = null;
      try {
        console.log('파일 데이터 직접 가져오기 시도...');
        console.log('파일 URL:', url);
        
        // Placeholder URL인지 확인
        if (url.includes('/api/placeholder/')) {
          console.log('경고: Placeholder URL이 감지되었습니다. 실제 파일이 업로드되지 않았습니다.');
          console.log('Supabase Storage 설정을 확인하거나 파일을 다시 업로드해주세요.');
          throw new Error('Placeholder URL - 실제 파일이 업로드되지 않음');
        }
        
        const fileResponse = await fetch(url);
        console.log('파일 응답 상태:', fileResponse.status, fileResponse.statusText);
        
        if (fileResponse.ok) {
          const arrayBuffer = await fileResponse.arrayBuffer();
          console.log('파일 다운로드 완료, 원본 크기:', arrayBuffer.byteLength, 'bytes');
          
          // 파일 크기 확인
          if (arrayBuffer.byteLength < 1000) {
            console.log('경고: 파일 크기가 너무 작습니다. 실제 AI 파일인지 확인 필요');
            console.log('파일 내용 샘플:', new TextDecoder().decode(arrayBuffer.slice(0, 200)));
            throw new Error('파일 크기가 너무 작습니다. 실제 AI 파일인지 확인하세요.');
          }
          
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          fileData = `data:application/octet-stream;base64,${base64}`;
          console.log('파일 데이터 변환 완료, Base64 크기:', fileData.length, 'characters');
        } else {
          console.log('파일 다운로드 실패:', fileResponse.status, fileResponse.statusText);
          throw new Error(`파일 다운로드 실패: ${fileResponse.statusText}`);
        }
      } catch (error) {
        console.log('파일 데이터 직접 가져오기 실패:', error);
        alert('파일 업로드에 실패했습니다. Supabase Storage 설정을 확인하거나 파일을 다시 업로드해주세요.');
        setIsConverting(false);
        return;
      }
      
      const requestBody: any = {
        fileName: fileName,
        fileType: fileType
      };
      
      if (fileData) {
        requestBody.fileData = fileData;
        console.log('파일 데이터 직접 전송 모드');
      } else {
        requestBody.fileUrl = url;
        console.log('파일 URL 전송 모드');
      }
      
      const response = await fetch('/api/drawing/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '파일 변환에 실패했습니다.');
      }

      const data = await response.json();
      console.log('변환 결과:', data);
      
              if (data.success) {
          // 변환된 SVG를 레이어로 파싱
          let convertedLayers: DrawingLayer[] = [];
          
          if (data.layers && data.layers.length > 0) {
            convertedLayers = parseSVGToLayersFromData(data.svgUrl, data.layers);
          } else if (data.svgContent) {
            // SVG 내용에서 직접 레이어 파싱
            const parsedLayers = parseSVGToLayers(data.svgContent);
            convertedLayers = parsedLayers.map(layer => ({
              ...layer,
              locked: false
            }));
          }
          
          if (convertedLayers.length === 0) {
            // 기본 레이어 생성
            convertedLayers = [
              {
                id: 'converted',
                name: `변환된 ${fileType.toUpperCase()} 파일`,
                visible: true,
                locked: false,
                elements: []
              }
            ];
          }
        
        setLayers(convertedLayers);
        setSvgContent(data.svgContent || '');
        setActiveLayer(convertedLayers[0]?.id || null);
        addToHistory(convertedLayers);
        
        // 디버깅을 위한 로그 추가
        console.log('변환 완료 정보:', {
          fileType,
          hasSvgUrl: !!data.svgUrl,
          hasSvgContent: !!data.svgContent,
          layersCount: convertedLayers.length
        });
        
        // SVG 파일인 경우 렌더링
        if (svgRef.current && data.svgContent) {
          console.log('SVG 내용으로 렌더링:', data.svgContent.substring(0, 100) + '...');
          svgRef.current.innerHTML = data.svgContent;
        } else {
          console.log('SVG 내용이 없어서 렌더링하지 않음');
        }
        
        console.log('변환 완료:', { 
          layersCount: convertedLayers.length, 
          activeLayer: convertedLayers[0]?.id 
        });
        
        alert(`${fileType.toUpperCase()} 파일이 성공적으로 변환되었습니다!\n레이어 ${convertedLayers.length}개가 생성되었습니다.`);
      }
    } catch (error) {
      console.error('파일 변환 오류:', error);
      alert(`파일 변환에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsConverting(false);
    }
  };

  // 직접 파일 업로드 처리
  const handleDirectFileUpload = async () => {
    try {
      setIsConverting(true);
      
      // 파일 입력 요소 생성
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ai,.eps,.cdr,.pdf';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          setIsConverting(false);
          return;
        }
        
        console.log('직접 파일 업로드 시작:', file.name, file.size, 'bytes');
        
        // 파일 크기 확인
        if (file.size < 1000) {
          alert('파일 크기가 너무 작습니다. 실제 AI 파일인지 확인하세요.');
          setIsConverting(false);
          return;
        }
        
        // 파일을 Base64로 변환
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64 = e.target?.result as string;
            const fileType = file.name.split('.').pop()?.toLowerCase() || '';
            
            console.log('파일 변환 요청 전송...');
            
            const response = await fetch('/api/drawing/convert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileData: base64,
                fileName: file.name,
                fileType: fileType
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || '파일 변환에 실패했습니다.');
            }

            const data = await response.json();
            console.log('변환 결과:', data);
            
            if (data.success) {
              // 변환된 SVG를 레이어로 파싱
              let convertedLayers: DrawingLayer[] = [];
              
              if (data.layers && data.layers.length > 0) {
                convertedLayers = parseSVGToLayersFromData(data.svgUrl, data.layers);
              } else if (data.svgContent) {
                const parsedLayers = parseSVGToLayers(data.svgContent);
                convertedLayers = parsedLayers.map(layer => ({
                  ...layer,
                  locked: false
                }));
              }
              
              if (convertedLayers.length === 0) {
                convertedLayers = [
                  {
                    id: 'converted',
                    name: `변환된 ${fileType.toUpperCase()} 파일`,
                    visible: true,
                    locked: false,
                    elements: []
                  }
                ];
              }
              
              setLayers(convertedLayers);
              setSvgContent(data.svgContent || '');
              setActiveLayer(convertedLayers[0]?.id || null);
              addToHistory(convertedLayers);
              
              if (svgRef.current && data.svgContent) {
                svgRef.current.innerHTML = data.svgContent;
              }
              
              console.log('변환 완료:', { 
                layersCount: convertedLayers.length, 
                activeLayer: convertedLayers[0]?.id 
              });
              
              alert(`${fileType.toUpperCase()} 파일이 성공적으로 변환되었습니다!\n레이어 ${convertedLayers.length}개가 생성되었습니다.`);
            }
          } catch (error) {
            console.error('파일 변환 오류:', error);
            alert(`파일 변환에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
          } finally {
            setIsConverting(false);
          }
        };
        
        reader.readAsDataURL(file);
      };
      
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
      
    } catch (error) {
      console.error('직접 파일 업로드 오류:', error);
      setIsConverting(false);
    }
  };

  // SVG를 레이어로 파싱 (외부 함수 사용)
  const parseSVGToLayersFromData = (svgUrl: string, layerData: any[]): DrawingLayer[] => {
    return layerData.map(layer => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: false,
      elements: layer.elements || []
    }));
  };

  // 레이어 토글
  const toggleLayerVisibility = (layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    setLayers(updatedLayers);
    addToHistory(updatedLayers);
  };

  // 레이어 잠금 토글
  const toggleLayerLock = (layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    );
    setLayers(updatedLayers);
    addToHistory(updatedLayers);
  };

  // 새 레이어 추가
  const addNewLayer = () => {
    const newLayer: DrawingLayer = {
      id: `layer_${Date.now()}`,
      name: `새 레이어 ${layers.length + 1}`,
      visible: true,
      locked: false,
      elements: []
    };
    const updatedLayers = [...layers, newLayer];
    setLayers(updatedLayers);
    setActiveLayer(newLayer.id);
    addToHistory(updatedLayers);
  };

  // 레이어 삭제
  const deleteLayer = (layerId: string) => {
    if (layers.length <= 1) {
      alert('최소 하나의 레이어는 유지해야 합니다.');
      return;
    }
    
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    setLayers(updatedLayers);
    
    if (activeLayer === layerId) {
      setActiveLayer(updatedLayers[0]?.id || null);
    }
    
    addToHistory(updatedLayers);
  };

  // 캔버스 좌표 변환
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // 새 요소 생성
  const createElement = (type: DrawingElement['type'], x: number, y: number): DrawingElement | null => {
    if (!activeLayer) return null;
    
    return {
      id: Date.now().toString(),
      type,
      x,
      y,
      color,
      strokeWidth,
      fontSize,
      content: type === 'text' ? '텍스트를 입력하세요' : undefined,
      layerId: activeLayer
    };
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    startPointRef.current = coords;

    const currentLayer = layers.find(layer => layer.id === activeLayer);
    if (!currentLayer || currentLayer.locked) return;

    if (tool === 'select') {
      // 요소 선택 로직
      const allElements = layers.flatMap(layer => layer.elements);
      const clickedElement = allElements.find(element => {
        if (element.type === 'line' || element.type === 'arrow') {
          const distance = Math.abs(
            (coords.y - element.y) * (element.endX! - element.x) - 
            (coords.x - element.x) * (element.endY! - element.y)
          ) / Math.sqrt((element.endX! - element.x) ** 2 + (element.endY! - element.y) ** 2);
          return distance < 5;
        } else {
          return coords.x >= element.x && coords.x <= element.x + (element.width || 0) &&
                 coords.y >= element.y && coords.y <= element.y + (element.height || 0);
        }
      });
      setSelectedElement(clickedElement?.id || null);
    } else if (tool === 'pen' || tool === 'arrow') {
      setIsDrawing(true);
      const elementType: DrawingElement['type'] = tool === 'pen' ? 'line' : 'arrow';
      const newElement = createElement(elementType, coords.x, coords.y);
      if (newElement) {
        newElement.endX = coords.x;
        newElement.endY = coords.y;
        
        const updatedLayers = layers.map(layer =>
          layer.id === activeLayer
            ? { ...layer, elements: [...layer.elements, newElement] }
            : layer
        );
        setLayers(updatedLayers);
        addToHistory(updatedLayers);
      }
    } else if (tool === 'text') {
      const newElement = createElement('text', coords.x, coords.y);
      if (newElement) {
        const updatedLayers = layers.map(layer =>
          layer.id === activeLayer
            ? { ...layer, elements: [...layer.elements, newElement] }
            : layer
        );
        setLayers(updatedLayers);
        addToHistory(updatedLayers);
        setSelectedElement(newElement.id);
        setEditingText(newElement.id);
      }
    } else if (tool === 'rectangle' || tool === 'circle') {
      const newElement = createElement(tool, coords.x, coords.y);
      if (newElement) {
        newElement.width = 0;
        newElement.height = 0;
        
        const updatedLayers = layers.map(layer =>
          layer.id === activeLayer
            ? { ...layer, elements: [...layer.elements, newElement] }
            : layer
        );
        setLayers(updatedLayers);
        addToHistory(updatedLayers);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPointRef.current || !activeLayer) return;

    const coords = getCanvasCoordinates(e);
    const currentLayer = layers.find(layer => layer.id === activeLayer);
    if (!currentLayer) return;

    const currentElements = currentLayer.elements;
    const currentElement = currentElements[currentElements.length - 1];

    if (tool === 'pen' || tool === 'arrow') {
      currentElement.endX = coords.x;
      currentElement.endY = coords.y;
      
      const updatedLayers = layers.map(layer =>
        layer.id === activeLayer
          ? { ...layer, elements: [...currentElements] }
          : layer
      );
      setLayers(updatedLayers);
    } else if (tool === 'rectangle' || tool === 'circle') {
      currentElement.width = coords.x - startPointRef.current.x;
      currentElement.height = coords.y - startPointRef.current.y;
      
      const updatedLayers = layers.map(layer =>
        layer.id === activeLayer
          ? { ...layer, elements: [...currentElements] }
          : layer
      );
      setLayers(updatedLayers);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    startPointRef.current = null;
  };

  // 요소 삭제
  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    const updatedLayers = layers.map(layer => ({
      ...layer,
      elements: layer.elements.filter(element => element.id !== selectedElement)
    }));
    
    setLayers(updatedLayers);
    addToHistory(updatedLayers);
    setSelectedElement(null);
  };

  // 텍스트 편집
  const handleTextEdit = (id: string, content: string) => {
    const updatedLayers = layers.map(layer => ({
      ...layer,
      elements: layer.elements.map(element =>
        element.id === id ? { ...element, content } : element
      )
    }));
    
    setLayers(updatedLayers);
    addToHistory(updatedLayers);
    setEditingText(null);
  };

  // SVG 생성
  const generateSVG = useCallback(() => {
    return generateSVGFromLayers(layers, selectedElement || undefined);
  }, [layers, selectedElement]);

  // SVG 뷰어 업데이트
  useEffect(() => {
    if (svgRef.current && !isDraggingElement) {
      if (layers.length > 0) {
        const svgContent = generateSVG();
        svgRef.current.innerHTML = svgContent;
        
        // 요소 클릭 이벤트 추가
        const elements = svgRef.current.querySelectorAll('[data-element-id]');
        elements.forEach(element => {
          element.addEventListener('click', handleElementClick);
          element.addEventListener('mousedown', handleElementMouseDown);
        });
        
        return () => {
          elements.forEach(element => {
            element.removeEventListener('click', handleElementClick);
            element.removeEventListener('mousedown', handleElementMouseDown);
          });
        };
      } else if (svgContent) {
        svgRef.current.innerHTML = svgContent;
      }
    }
  }, [layers, generateSVG, svgContent, selectedElement, isDraggingElement]);

  // 저장
  const handleSave = () => {
    const finalSvg = generateSVG();
    onSave(layers, finalSvg);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">도식화 편집기</h2>
            {isConverting && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">파일 변환 중...</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2 items-center">
            {/* 줌 컨트롤 */}
            <div className="flex items-center space-x-1 border rounded px-2 py-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setZoom(Math.max(zoom - 0.1, 0.1))}
                className="h-6 w-6 p-0"
              >
                -
              </Button>
              <span className="text-xs min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setZoom(Math.min(zoom + 0.1, 5))}
                className="h-6 w-6 p-0"
              >
                +
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
                className="h-6 px-2 text-xs"
              >
                초기화
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 레이어 패널 */}
          <div className="w-64 border-r p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">레이어</h3>
              <Button variant="outline" size="sm" onClick={addNewLayer}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {layers.map(layer => (
                <div
                  key={layer.id}
                  className={`p-2 rounded border cursor-pointer ${
                    activeLayer === layer.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <span className="text-sm font-medium">{layer.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerLock(layer.id);
                        }}
                        className={`text-gray-600 hover:text-gray-800 ${
                          layer.locked ? 'text-red-600' : ''
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                      {layers.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(layer.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {layer.elements.length}개 요소
                  </div>
                </div>
              ))}
            </div>

            {/* 도구 패널 */}
            <div>
              <h3 className="font-medium mb-2">도구</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tool === 'select' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('select')}
                >
                  <Move className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'pen' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('pen')}
                >
                  <Pen className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'text' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('text')}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'rectangle' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('rectangle')}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'circle' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('circle')}
                >
                  <Circle className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'arrow' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTool('arrow')}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 속성 패널 */}
            <div>
              <h3 className="font-medium mb-2">속성</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">색상</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-8 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">선 굵기</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{strokeWidth}px</span>
                </div>
                {tool === 'text' && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">글자 크기</label>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{fontSize}px</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI 파일 업로드 */}
            <div className="pb-4">
              <h3 className="font-medium mb-2">AI 파일 업로드</h3>
              <FileUpload
                onUploadComplete={handleAIFileUpload}
                onUploadError={(error) => {
                  console.error('파일 업로드 오류:', error);
                  alert('파일 업로드에 실패했습니다.');
                }}
                accept=".ai,.eps,.cdr,.pdf"
                maxSize={50 * 1024 * 1024}
                bucket="faddit-files"
                path="uploads"
              />
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                AI, EPS, CDR, PDF 파일을<br />
                PNG로 변환
              </p>
              {isConverting && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600">파일을 변환하고 있습니다...</span>
                  </div>
                </div>
              )}
            </div>

            {selectedElement && (
              <div>
                <h3 className="font-medium mb-2">선택된 요소</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedElement}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </div>
            )}
          </div>

          {/* 캔버스 영역 */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="relative border rounded-lg overflow-hidden bg-white h-full">
              {/* SVG 뷰어 */}
              <div
                ref={svgRef}
                className="w-full h-full relative overflow-auto cursor-grab"
                style={{ 
                  backgroundImage: 'radial-gradient(circle, #f0f0f0 1px, transparent 1px)', 
                  backgroundSize: '20px 20px',
                  transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center center'
                }}
                onWheel={handleWheel}
                onMouseDown={(e) => {
                  // 빈 공간 클릭 시 선택 해제
                  if (e.target === e.currentTarget) {
                    setSelectedElement(null);
                  }
                  handlePanMouseDown(e);
                }}
                onMouseMove={(e) => {
                  if (isDraggingElement) {
                    handleElementDrag(e.nativeEvent);
                  } else {
                    handlePanMouseMove(e);
                  }
                }}
                onMouseUp={(e) => {
                  if (isDraggingElement) {
                    handleElementDragEnd();
                  } else {
                    handlePanMouseUp();
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDraggingElement) {
                    handleElementDragEnd();
                  } else {
                    handlePanMouseUp();
                  }
                }}
              >
                {svgUrl && (
                  <img
                    src={svgUrl}
                    alt="도식화 배경"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ opacity: 0.3 }}
                  />
                )}
              </div>
              
              {/* 캔버스 오버레이 (편집용) */}
              <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="absolute inset-0 cursor-crosshair"
                style={{ pointerEvents: tool === 'select' ? 'none' : 'auto' }}
              />
              
              {/* 텍스트 편집 오버레이 */}
              {editingText && (
                <div className="absolute inset-0 pointer-events-none">
                  {layers.flatMap(layer => layer.elements)
                    .filter(element => element.type === 'text' && element.id === editingText)
                    .map(element => (
                      <div
                        key={element.id}
                        style={{
                          position: 'absolute',
                          left: element.x,
                          top: element.y - (element.fontSize || 16),
                          pointerEvents: 'auto'
                        }}
                      >
                        <InlineTextEditor
                          value={element.content || ''}
                          onChange={(content) => handleTextEdit(element.id, content)}
                          onBlur={() => setEditingText(null)}
                          className="bg-white border border-blue-500 rounded px-2 py-1 text-sm"
                          placeholder="텍스트를 입력하세요"
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t flex justify-between flex-shrink-0">
          <div className="text-sm text-gray-600">
            {layers.reduce((total, layer) => total + layer.elements.length, 0)}개 요소
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
