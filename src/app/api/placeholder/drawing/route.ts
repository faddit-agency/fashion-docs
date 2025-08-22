import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const width = parseInt(searchParams.get('width') || '800');
    const height = parseInt(searchParams.get('height') || '600');
    
    // 도식화용 SVG placeholder 생성
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="1"/>
          </pattern>
        </defs>
        
        <!-- 배경 -->
        <rect width="100%" height="100%" fill="#fafafa"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        
        <!-- 도식화 프레임 -->
        <rect x="50" y="50" width="${width-100}" height="${height-100}" 
              fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>
        
        <!-- 기본 도식화 요소들 -->
        <g class="layer" data-layer-id="outline" data-layer-name="외곽선">
          <!-- 셔츠 외곽선 예시 -->
          <path d="M 200,100 L 600,100 L 600,500 L 200,500 Z" 
                fill="none" stroke="#000" stroke-width="2"/>
          
          <!-- 소매 -->
          <path d="M 150,150 L 100,200 L 100,400 L 150,450" 
                fill="none" stroke="#000" stroke-width="2"/>
          <path d="M 650,150 L 700,200 L 700,400 L 650,450" 
                fill="none" stroke="#000" stroke-width="2"/>
        </g>
        
        <g class="layer" data-layer-id="details" data-layer-name="디테일">
          <!-- 포켓 -->
          <rect x="300" y="250" width="80" height="100" 
                fill="none" stroke="#333" stroke-width="1"/>
          
          <!-- 단추 -->
          <circle cx="400" cy="180" r="8" fill="none" stroke="#333" stroke-width="1"/>
          <circle cx="400" cy="220" r="8" fill="none" stroke="#333" stroke-width="1"/>
          <circle cx="400" cy="260" r="8" fill="none" stroke="#333" stroke-width="1"/>
        </g>
        
        <g class="layer" data-layer-id="measurements" data-layer-name="치수">
          <!-- 치수선 -->
          <line x1="100" y1="100" x2="100" y2="500" 
                stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>
          <text x="80" y="300" transform="rotate(-90,80,300)" 
                font-size="12" fill="#666">길이: 400</text>
          
          <line x1="200" y1="80" x2="600" y2="80" 
                stroke="#666" stroke-width="1" stroke-dasharray="5,5"/>
          <text x="400" y="60" font-size="12" fill="#666" text-anchor="middle">가슴둘레: 400</text>
        </g>
        
        <g class="layer" data-layer-id="annotations" data-layer-name="주석">
          <!-- 주석 -->
          <text x="400" y="200" font-size="14" fill="#000" text-anchor="middle">메인 패널</text>
          <text x="340" y="300" font-size="12" fill="#666" text-anchor="middle">포켓</text>
          <text x="400" y="150" font-size="12" fill="#666" text-anchor="middle">단추</text>
        </g>
        
        <!-- 제목 -->
        <text x="50%" y="30" font-family="Arial, sans-serif" font-size="16" 
              fill="#333" text-anchor="middle" font-weight="bold">
          도식화 예시
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Drawing placeholder generation error:', error);
    return new NextResponse('Error generating drawing placeholder', { status: 500 });
  }
}
