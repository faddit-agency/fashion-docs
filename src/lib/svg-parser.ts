// @ts-ignore: svg-parser 모듈 타입 정의 없음
import { parse } from 'svg-parser';

export interface SVGLayer {
  id: string;
  name: string;
  visible: boolean;
  elements: SVGElement[];
}

export interface SVGElement {
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

export function parseSVGToLayers(svgContent: string): SVGLayer[] {
  try {
    const parsed = parse(svgContent);
    const layers: SVGLayer[] = [];
    
    // SVG에서 g 태그들을 찾아서 레이어로 변환
    function extractLayers(node: any, parentLayer?: SVGLayer) {
      if (node.tagName === 'g') {
        const layerId = node.properties?.['data-layer-id'] || `layer_${Date.now()}`;
        const layerName = node.properties?.['data-layer-name'] || '새 레이어';
        
        const layer: SVGLayer = {
          id: layerId,
          name: layerName,
          visible: true,
          elements: []
        };
        
        // 자식 요소들을 파싱
        if (node.children) {
          node.children.forEach((child: any) => {
            const element = parseSVGElement(child, layerId);
            if (element) {
              layer.elements.push(element);
            }
          });
        }
        
        layers.push(layer);
      } else if (node.children) {
        node.children.forEach((child: any) => extractLayers(child, parentLayer));
      }
    }
    
    extractLayers(parsed);
    
    // 레이어가 없으면 기본 레이어 생성
    if (layers.length === 0) {
      layers.push({
        id: 'default',
        name: '기본 레이어',
        visible: true,
        elements: []
      });
    }
    
    return layers;
  } catch (error) {
    console.error('SVG 파싱 오류:', error);
    return [{
      id: 'default',
      name: '기본 레이어',
      visible: true,
      elements: []
    }];
  }
}

function parseSVGElement(node: any, layerId: string): SVGElement | null {
  if (!node.tagName) return null;
  
  const properties = node.properties || {};
  const elementId = properties.id || `element_${Date.now()}`;
  
  switch (node.tagName) {
    case 'path':
      return {
        id: elementId,
        type: 'path',
        x: 0,
        y: 0,
        color: properties.stroke || '#000000',
        strokeWidth: parseInt(properties['stroke-width']) || 1,
        pathData: properties.d || '',
        layerId
      };
      
    case 'line':
      return {
        id: elementId,
        type: 'line',
        x: parseFloat(properties.x1) || 0,
        y: parseFloat(properties.y1) || 0,
        endX: parseFloat(properties.x2) || 0,
        endY: parseFloat(properties.y2) || 0,
        color: properties.stroke || '#000000',
        strokeWidth: parseInt(properties['stroke-width']) || 1,
        layerId
      };
      
    case 'text':
      return {
        id: elementId,
        type: 'text',
        x: parseFloat(properties.x) || 0,
        y: parseFloat(properties.y) || 0,
        content: node.children?.[0]?.value || '',
        color: properties.fill || '#000000',
        strokeWidth: 1,
        fontSize: parseInt(properties['font-size']) || 16,
        layerId
      };
      
    case 'rect':
      return {
        id: elementId,
        type: 'rectangle',
        x: parseFloat(properties.x) || 0,
        y: parseFloat(properties.y) || 0,
        width: parseFloat(properties.width) || 0,
        height: parseFloat(properties.height) || 0,
        color: properties.stroke || '#000000',
        strokeWidth: parseInt(properties['stroke-width']) || 1,
        layerId
      };
      
    case 'circle':
      const cx = parseFloat(properties.cx) || 0;
      const cy = parseFloat(properties.cy) || 0;
      const radius = parseFloat(properties.r) || 0;
      return {
        id: elementId,
        type: 'circle',
        x: cx - radius,
        y: cy - radius,
        width: radius * 2,
        height: radius * 2,
        color: properties.stroke || '#000000',
        strokeWidth: parseInt(properties['stroke-width']) || 1,
        layerId
      };
      
    case 'image':
      return {
        id: elementId,
        type: 'image',
        x: parseFloat(properties.x) || 0,
        y: parseFloat(properties.y) || 0,
        width: parseFloat(properties.width) || 100,
        height: parseFloat(properties.height) || 100,
        color: '#000000',
        strokeWidth: 1,
        imageUrl: properties.href || '',
        layerId
      };
      
    default:
      return null;
  }
}

export function generateSVGFromLayers(layers: SVGLayer[], selectedElementId?: string): string {
  const visibleLayers = layers.filter(layer => layer.visible);
  
  // SVG 크기를 동적으로 계산
  let minX = 0, minY = 0, maxX = 800, maxY = 600;
  
  visibleLayers.forEach(layer => {
    layer.elements.forEach(element => {
      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, element.x + (element.width || 0));
      maxY = Math.max(maxY, element.y + (element.height || 0));
    });
  });
  
  const svgWidth = Math.max(800, maxX - minX + 100);
  const svgHeight = Math.max(600, maxY - minY + 100);
  
  let svg = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="${minX - 50} ${minY - 50} ${svgWidth} ${svgHeight}">
      <defs>
        <style>
          .layer { opacity: 1; }
          .layer.hidden { opacity: 0; }
          .element { 
            cursor: pointer; 
          }
          .element.selected { 
            stroke: #3b82f6 !important; 
            stroke-width: 3px !important;
            stroke-dasharray: 5,5;
            filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5));
          }
          .element:hover { 
            stroke: #60a5fa !important; 
            stroke-width: 2px !important;
            cursor: move;
          }
          .element.selected:hover {
            cursor: move;
          }
        </style>
      </defs>
  `;

  visibleLayers.forEach(layer => {
    svg += `<g class="layer" data-layer-id="${layer.id}" data-layer-name="${layer.name}">`;
    
    layer.elements.forEach(element => {
      const isSelected = selectedElementId === element.id;
      const elementClass = `element${isSelected ? ' selected' : ''}`;
      
      switch (element.type) {
        case 'line':
        case 'arrow':
          svg += `<line x1="${element.x}" y1="${element.y}" x2="${element.endX}" y2="${element.endY}" stroke="${element.color}" stroke-width="${element.strokeWidth}" class="${elementClass}" data-element-id="${element.id}"/>`;
          if (element.type === 'arrow') {
            // 화살표 머리 추가
            const angle = Math.atan2(element.endY! - element.y, element.endX! - element.x);
            const arrowLength = 10;
            svg += `<line x1="${element.endX}" y1="${element.endY}" x2="${element.endX! - arrowLength * Math.cos(angle - Math.PI / 6)}" y2="${element.endY! - arrowLength * Math.sin(angle - Math.PI / 6)}" stroke="${element.color}" stroke-width="${element.strokeWidth}" class="${elementClass}" data-element-id="${element.id}"/>`;
            svg += `<line x1="${element.endX}" y1="${element.endY}" x2="${element.endX! - arrowLength * Math.cos(angle + Math.PI / 6)}" y2="${element.endY! - arrowLength * Math.sin(angle + Math.PI / 6)}" stroke="${element.color}" stroke-width="${element.strokeWidth}" class="${elementClass}" data-element-id="${element.id}"/>`;
          }
          break;
        case 'text':
          svg += `<text x="${element.x}" y="${element.y}" font-size="${element.fontSize || 16}" fill="${element.color}" class="${elementClass}" data-element-id="${element.id}">${element.content || ''}</text>`;
          break;
        case 'rectangle':
          svg += `<rect x="${element.x}" y="${element.y}" width="${element.width || 0}" height="${element.height || 0}" fill="none" stroke="${element.color}" stroke-width="${element.strokeWidth}" class="${elementClass}" data-element-id="${element.id}"/>`;
          break;
        case 'circle':
          const radius = Math.min(Math.abs(element.width || 0), Math.abs(element.height || 0)) / 2;
          svg += `<circle cx="${element.x + (element.width || 0) / 2}" cy="${element.y + (element.height || 0) / 2}" r="${radius}" fill="none" stroke="${element.color}" stroke-width="${element.strokeWidth}" class="${elementClass}" data-element-id="${element.id}"/>`;
          break;
        case 'path':
          if (element.pathData) {
            svg += `<path d="${element.pathData}" fill="none" stroke="${element.color}" stroke-width="${element.strokeWidth}" class="${elementClass}" data-element-id="${element.id}"/>`;
          }
          break;
        case 'image':
          if (element.imageUrl) {
            svg += `<image x="${element.x}" y="${element.y}" width="${element.width || 100}" height="${element.height || 100}" href="${element.imageUrl}" class="${elementClass}" data-element-id="${element.id}"/>`;
          }
          break;
      }
    });
    
    svg += '</g>';
  });

  svg += '</svg>';
  return svg;
}
