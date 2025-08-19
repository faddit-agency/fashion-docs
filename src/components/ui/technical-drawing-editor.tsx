"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./button";
import { FileUpload } from "./file-upload";
import { InlineTextEditor } from "./inline-text-editor";
import { 
  Pen, 
  Type, 
  Image as ImageIcon, 
  Undo, 
  Redo, 
  Save, 
  X, 
  Download,
  Move,
  Square,
  Circle,
  ArrowRight
} from "lucide-react";

interface DrawingElement {
  id: string;
  type: 'line' | 'text' | 'image' | 'rectangle' | 'circle' | 'arrow';
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
}

interface TechnicalDrawingEditorProps {
  frontImage: string;
  backImage: string;
  onSave: (frontElements: DrawingElement[], backElements: DrawingElement[]) => void;
  onClose: () => void;
}

export function TechnicalDrawingEditor({ 
  frontImage, 
  backImage, 
  onSave, 
  onClose 
}: TechnicalDrawingEditorProps) {
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [tool, setTool] = useState<'select' | 'pen' | 'text' | 'image' | 'rectangle' | 'circle' | 'arrow'>('select');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [isDrawing, setIsDrawing] = useState(false);
  const [frontElements, setFrontElements] = useState<DrawingElement[]>([]);
  const [backElements, setBackElements] = useState<DrawingElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [history, setHistory] = useState<{front: DrawingElement[], back: DrawingElement[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const startPointRef = useRef<{x: number, y: number} | null>(null);

  const currentElements = activeTab === 'front' ? frontElements : backElements;
  const setCurrentElements = activeTab === 'front' ? setFrontElements : setBackElements;

  // 히스토리 관리
  const addToHistory = useCallback((newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      front: activeTab === 'front' ? newElements : frontElements,
      back: activeTab === 'back' ? newElements : backElements
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, activeTab, frontElements, backElements]);

  // 실행 취소
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setFrontElements(state.front);
      setBackElements(state.back);
      setHistoryIndex(newIndex);
    }
  };

  // 다시 실행
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setFrontElements(state.front);
      setBackElements(state.back);
      setHistoryIndex(newIndex);
    }
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
  const createElement = (type: DrawingElement['type'], x: number, y: number): DrawingElement => {
    return {
      id: Date.now().toString(),
      type,
      x,
      y,
      color,
      strokeWidth,
      fontSize,
      content: type === 'text' ? '텍스트를 입력하세요' : undefined
    };
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    startPointRef.current = coords;

    if (tool === 'select') {
      // 요소 선택 로직
      const clickedElement = currentElements.find(element => {
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
      const newElement = createElement(tool, coords.x, coords.y);
      newElement.endX = coords.x;
      newElement.endY = coords.y;
      setCurrentElements(prev => [...prev, newElement]);
      addToHistory([...currentElements, newElement]);
         } else if (tool === 'text') {
       const newElement = createElement('text', coords.x, coords.y);
       setCurrentElements(prev => [...prev, newElement]);
       addToHistory([...currentElements, newElement]);
       setSelectedElement(newElement.id);
       setEditingText(newElement.id);
     } else if (tool === 'rectangle' || tool === 'circle') {
      const newElement = createElement(tool, coords.x, coords.y);
      newElement.width = 0;
      newElement.height = 0;
      setCurrentElements(prev => [...prev, newElement]);
      addToHistory([...currentElements, newElement]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPointRef.current) return;

    const coords = getCanvasCoordinates(e);
    const currentElement = currentElements[currentElements.length - 1];

    if (tool === 'pen' || tool === 'arrow') {
      currentElement.endX = coords.x;
      currentElement.endY = coords.y;
      setCurrentElements([...currentElements]);
    } else if (tool === 'rectangle' || tool === 'circle') {
      currentElement.width = coords.x - startPointRef.current.x;
      currentElement.height = coords.y - startPointRef.current.y;
      setCurrentElements([...currentElements]);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    startPointRef.current = null;
  };

  // 이미지 업로드 처리
  const handleImageUpload = (url: string, path: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: 'image',
      x: rect.width / 2 - 50,
      y: rect.height / 2 - 50,
      width: 100,
      height: 100,
      color: '#000000',
      strokeWidth: 1,
      imageUrl: url
    };

    setCurrentElements(prev => [...prev, newElement]);
    addToHistory([...currentElements, newElement]);
  };

  // 텍스트 편집
  const handleTextEdit = (id: string, content: string) => {
    const updatedElements = currentElements.map(element =>
      element.id === id ? { ...element, content } : element
    );
    setCurrentElements(updatedElements);
    addToHistory(updatedElements);
    setEditingText(null);
  };

  // 요소 삭제
  const deleteSelectedElement = () => {
    if (selectedElement) {
      const updatedElements = currentElements.filter(element => element.id !== selectedElement);
      setCurrentElements(updatedElements);
      addToHistory(updatedElements);
      setSelectedElement(null);
    }
  };

  // 캔버스 렌더링
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 이미지 그리기 (이미지가 로드된 경우에만)
    if (imageRef.current && imageLoaded && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      try {
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.warn('이미지 그리기 실패:', error);
      }
    }

    // 요소들 그리기
    currentElements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.font = `${element.fontSize || 16}px Arial`;

      // 선택된 요소 하이라이트
      if (element.id === selectedElement) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = element.strokeWidth + 2;
      }

      switch (element.type) {
        case 'line':
        case 'arrow':
          ctx.beginPath();
          ctx.moveTo(element.x, element.y);
          ctx.lineTo(element.endX!, element.endY!);
          ctx.stroke();
          
          if (element.type === 'arrow') {
            // 화살표 머리 그리기
            const angle = Math.atan2(element.endY! - element.y, element.endX! - element.x);
            const arrowLength = 10;
            ctx.beginPath();
            ctx.moveTo(element.endX!, element.endY!);
            ctx.lineTo(
              element.endX! - arrowLength * Math.cos(angle - Math.PI / 6),
              element.endY! - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(element.endX!, element.endY!);
            ctx.lineTo(
              element.endX! - arrowLength * Math.cos(angle + Math.PI / 6),
              element.endY! - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;

        case 'text':
          if (element.content) {
            ctx.fillText(element.content, element.x, element.y);
          }
          break;

        case 'rectangle':
          ctx.strokeRect(element.x, element.y, element.width || 0, element.height || 0);
          break;

        case 'circle':
          const radius = Math.min(Math.abs(element.width || 0), Math.abs(element.height || 0)) / 2;
          ctx.beginPath();
          ctx.arc(element.x + (element.width || 0) / 2, element.y + (element.height || 0) / 2, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;

        case 'image':
          if (element.imageUrl) {
            const img = new Image();
            img.onload = () => {
              try {
                ctx.drawImage(img, element.x, element.y, element.width || 100, element.height || 100);
              } catch (error) {
                console.warn('요소 이미지 그리기 실패:', error);
              }
            };
            img.onerror = () => {
              console.warn('요소 이미지 로드 실패:', element.imageUrl);
              // 이미지 로드 실패 시 placeholder 그리기
              ctx.fillStyle = '#f0f0f0';
              ctx.fillRect(element.x, element.y, element.width || 100, element.height || 100);
              ctx.strokeStyle = '#ccc';
              ctx.strokeRect(element.x, element.y, element.width || 100, element.height || 100);
              ctx.fillStyle = '#999';
              ctx.fillText('이미지 로드 실패', element.x + 10, element.y + 50);
            };
            img.src = element.imageUrl;
          }
          break;
      }
    });
  }, [currentElements, selectedElement]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // 이미지 로드
  useEffect(() => {
    setImageLoaded(false);
    if (imageRef.current) {
      const handleImageLoad = () => {
        setImageLoaded(true);
        renderCanvas();
      };
      
      const handleImageError = () => {
        console.warn('이미지 로드 실패:', activeTab === 'front' ? frontImage : backImage);
        setImageLoaded(false);
        renderCanvas();
      };
      
      imageRef.current.onload = handleImageLoad;
      imageRef.current.onerror = handleImageError;
      
      // 이미지 URL이 유효한지 확인
      const imageUrl = activeTab === 'front' ? frontImage : backImage;
      if (imageUrl && imageUrl !== '/api/placeholder/400/300') {
        imageRef.current.src = imageUrl;
      } else {
        // placeholder 이미지 사용
        imageRef.current.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRyb3dpbmcgUGxhY2Vob2xkZXI8L3RleHQ+PC9zdmc+';
        setImageLoaded(true);
      }
    }
  }, [activeTab, frontImage, backImage, renderCanvas]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">도식화 편집</h2>
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'front' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('front')}
              >
                앞면
              </Button>
              <Button
                variant={activeTab === 'back' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('back')}
              >
                뒷면
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
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

        <div className="flex-1 flex">
          {/* 도구 패널 */}
          <div className="w-64 border-r p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">도구</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('select')}
                >
                  <Move className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'pen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('pen')}
                >
                  <Pen className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('text')}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('image')}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'rectangle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('rectangle')}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('circle')}
                >
                  <Circle className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'arrow' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('arrow')}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">색상</h3>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>

            <div>
              <h3 className="font-medium mb-2">선 굵기</h3>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-600">{strokeWidth}px</span>
            </div>

            {tool === 'text' && (
              <div>
                <h3 className="font-medium mb-2">글자 크기</h3>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">{fontSize}px</span>
              </div>
            )}

            {tool === 'image' && (
              <div>
                <h3 className="font-medium mb-2">이미지 업로드</h3>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  onUploadError={() => {}}
                  accept=".jpg,.jpeg,.png,.gif"
                  maxSize={5 * 1024 * 1024}
                />
              </div>
            )}

            {selectedElement && (
              <div>
                <h3 className="font-medium mb-2">선택된 요소</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedElement}
                  className="w-full"
                >
                  삭제
                </Button>
              </div>
            )}
          </div>

          {/* 캔버스 */}
          <div className="flex-1 p-4">
            <div className="relative border rounded-lg overflow-hidden">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">이미지 로딩 중...</p>
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`cursor-crosshair ${!imageLoaded ? 'opacity-50' : ''}`}
              />
              <img
                ref={imageRef}
                src={activeTab === 'front' ? frontImage : backImage}
                alt="도식화"
                className="hidden"
              />
              
              {/* 텍스트 편집 오버레이 */}
              {editingText && (
                <div className="absolute inset-0 pointer-events-none">
                  {currentElements
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
        <div className="p-4 border-t flex justify-between">
          <div className="text-sm text-gray-600">
            {currentElements.length}개 요소
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={() => onSave(frontElements, backElements)}
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
