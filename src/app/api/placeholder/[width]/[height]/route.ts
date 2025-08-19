import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ width: string; height: string }> }
) {
  try {
    const resolvedParams = await params;
    const width = parseInt(resolvedParams.width) || 400;
    const height = parseInt(resolvedParams.height) || 300;
    
    // SVG placeholder 생성
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" dy=".3em">
          ${width}x${height} Placeholder
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
    console.error('Placeholder generation error:', error);
    return new NextResponse('Error generating placeholder', { status: 500 });
  }
}
