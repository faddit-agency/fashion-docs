import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Drive assets API called');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    console.log('API called with params:', { category, userId });

    // userId가 없어도 데모 데이터는 반환하도록 수정
    if (!userId) {
      console.log('User ID is missing, using default');
    }

    // Supabase가 설정되지 않은 경우 데모 데이터 반환
    if (!supabase) {
      console.log('Supabase not configured, returning demo data');
      const demoAssets = [
        { 
          id: "1", 
          name: "패턴 DXF", 
          path: "products/1/patterns/sample.dxf", 
          category: "패턴", 
          uploadedAt: new Date().toISOString(),
          fileSize: "2.5MB",
          fileType: "dxf"
        },
        { 
          id: "2", 
          name: "도식화 PDF", 
          path: "products/1/specs/techpack.pdf", 
          category: "인쇄", 
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          fileSize: "1.8MB",
          fileType: "pdf"
        },
        { 
          id: "3", 
          name: "라벨 가이드", 
          path: "assets/labels/guide.pdf", 
          category: "라벨", 
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          fileSize: "0.5MB",
          fileType: "pdf"
        },
        { 
          id: "4", 
          name: "원단 스와치", 
          path: "products/2/fabrics/swatch.jpg", 
          category: "원단", 
          uploadedAt: new Date(Date.now() - 259200000).toISOString(),
          fileSize: "3.2MB",
          fileType: "jpg"
        },
        { 
          id: "5", 
          name: "기술 도면", 
          path: "products/1/technical/drawing.ai", 
          category: "기타", 
          uploadedAt: new Date(Date.now() - 345600000).toISOString(),
          fileSize: "5.1MB",
          fileType: "ai"
        },
        { 
          id: "6", 
          name: "셔츠 패턴", 
          path: "products/3/patterns/shirt.dxf", 
          category: "패턴", 
          uploadedAt: new Date(Date.now() - 432000000).toISOString(),
          fileSize: "1.9MB",
          fileType: "dxf"
        },
        { 
          id: "7", 
          name: "바지 도식화", 
          path: "products/4/specs/pants.pdf", 
          category: "인쇄", 
          uploadedAt: new Date(Date.now() - 518400000).toISOString(),
          fileSize: "2.3MB",
          fileType: "pdf"
        },
        { 
          id: "8", 
          name: "면 원단", 
          path: "assets/fabrics/cotton_fabric.jpg", 
          category: "원단", 
          uploadedAt: new Date(Date.now() - 604800000).toISOString(),
          fileSize: "1.2MB",
          fileType: "jpg"
        },
        { 
          id: "9", 
          name: "드레스 패턴", 
          path: "assets/patterns/dress_pattern.ai", 
          category: "패턴", 
          uploadedAt: new Date(Date.now() - 691200000).toISOString(),
          fileSize: "3.8MB",
          fileType: "ai"
        },
        { 
          id: "10", 
          name: "스크린 프린트", 
          path: "assets/prints/screen_print.psd", 
          category: "인쇄", 
          uploadedAt: new Date(Date.now() - 777600000).toISOString(),
          fileSize: "4.1MB",
          fileType: "psd"
        },
        { 
          id: "11", 
          name: "사이즈 차트", 
          path: "assets/labels/size_chart.pdf", 
          category: "라벨", 
          uploadedAt: new Date(Date.now() - 864000000).toISOString(),
          fileSize: "0.8MB",
          fileType: "pdf"
        },
        { 
          id: "12", 
          name: "울 원단", 
          path: "assets/fabrics/wool_fabric.jpg", 
          category: "원단", 
          uploadedAt: new Date(Date.now() - 950400000).toISOString(),
          fileSize: "2.1MB",
          fileType: "jpg"
        },
        { 
          id: "13", 
          name: "자켓 패턴", 
          path: "assets/patterns/jacket_pattern.ai", 
          category: "패턴", 
          uploadedAt: new Date(Date.now() - 1036800000).toISOString(),
          fileSize: "5.2MB",
          fileType: "ai"
        },
        { 
          id: "14", 
          name: "디지털 프린트", 
          path: "assets/prints/digital_print.ai", 
          category: "인쇄", 
          uploadedAt: new Date(Date.now() - 1123200000).toISOString(),
          fileSize: "2.7MB",
          fileType: "ai"
        },
        { 
          id: "15", 
          name: "케어 라벨", 
          path: "assets/labels/care_instructions.pdf", 
          category: "라벨", 
          uploadedAt: new Date(Date.now() - 1209600000).toISOString(),
          fileSize: "0.3MB",
          fileType: "pdf"
        },
        { 
          id: "16", 
          name: "린넨 원단", 
          path: "assets/fabrics/linen_fabric.jpg", 
          category: "원단", 
          uploadedAt: new Date(Date.now() - 1296000000).toISOString(),
          fileSize: "1.5MB",
          fileType: "jpg"
        },
        { 
          id: "17", 
          name: "바지 패턴", 
          path: "assets/patterns/pants_pattern.ai", 
          category: "패턴", 
          uploadedAt: new Date(Date.now() - 1382400000).toISOString(),
          fileSize: "2.9MB",
          fileType: "ai"
        },
        { 
          id: "18", 
          name: "자수 디자인", 
          path: "assets/prints/embroidery_design.emb", 
          category: "인쇄", 
          uploadedAt: new Date(Date.now() - 1468800000).toISOString(),
          fileSize: "1.8MB",
          fileType: "emb"
        },
        { 
          id: "19", 
          name: "색상 팔레트", 
          path: "assets/others/color_palette.pdf", 
          category: "기타", 
          uploadedAt: new Date(Date.now() - 1555200000).toISOString(),
          fileSize: "0.4MB",
          fileType: "pdf"
        },
        { 
          id: "20", 
          name: "참고 문서", 
          path: "assets/others/reference_doc.docx", 
          category: "기타", 
          uploadedAt: new Date(Date.now() - 1641600000).toISOString(),
          fileSize: "0.6MB",
          fileType: "docx"
        }
      ];

      // 카테고리 필터링
      const filteredAssets = category && category !== "전체" 
        ? demoAssets.filter(asset => asset.category === category)
        : demoAssets;

      console.log('Returning demo assets:', filteredAssets.length);
      return NextResponse.json({ assets: filteredAssets });
    }

    // 실제 Supabase 쿼리
    let query = supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId);

    if (category && category !== "전체") {
      query = query.eq('category', category);
    }

    const { data: assets, error } = await query;

    if (error) {
      console.error('Assets fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
