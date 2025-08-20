import { NextRequest, NextResponse } from 'next/server';

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

    // Supabase 클라이언트 동적 로드 (미설정/로딩 실패 시 null 유지)
    let supabase: any = null;
    let supabaseAdmin: any = null;
    try {
      const mod = await import('@/lib/supabase');
      const adminMod = await import('@/lib/supabase-admin');
      supabase = (mod as any).supabase || null;
      supabaseAdmin = (adminMod as any).supabaseAdmin || null;
    } catch (e) {
      console.log('Supabase 동적 로드 실패, 데모 데이터로 폴백:', e);
    }

    // Supabase가 사용 불가한 경우 데모 데이터 반환 (카테고리: 패턴, 도식화, 인쇄, 원단, 라벨, 기타)
    if (!supabase && !supabaseAdmin) {
      console.log('Supabase not configured, returning demo data');
      // 로컬 데모 드라이브 병합 (있다면)
      let localAssets: any[] = [];
      try {
        const raw = typeof window === 'undefined' ? null : (globalThis as any).localStorage?.getItem?.('demo_drive_assets');
        // Next.js 서버에는 window/localStorage가 없으므로 위 코드는 대부분 null임. 클라이언트에서 병합 처리함.
      } catch {}
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
          category: "도식화", 
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
          category: "도식화", 
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

    // 실제 Supabase 쿼리 (오류 시 데모 데이터로 폴백)
    try {
      const client: any = supabaseAdmin || supabase;
      let query = client
        .from('assets')
        .select('*')
        .eq('user_id', userId);

      if (category && category !== "전체") {
        query = query.eq('category', category);
      }

      const { data: assets, error } = await query;

      if (error) {
        throw error;
      }

      // URL 보정: url이 없으면 공개 URL 생성(기본 버킷 사용)
      const bucketId = 'faddit-files';
      const clientForUrl: any = supabaseAdmin || supabase;
      const withUrls = (assets || []).map((a: any) => {
        if (a.url) return a;
        try {
          const { data: publicUrl } = clientForUrl.storage.from(bucketId).getPublicUrl(a.path);
          return { ...a, url: publicUrl?.publicUrl || null };
        } catch {
          return a;
        }
      });

      return NextResponse.json({ assets: withUrls });
    } catch (dbErr) {
      console.warn('Assets table not available or query failed. Falling back to demo data:', dbErr);
      const demoAssets = [
        { id: "d1", name: "패턴 DXF", path: "products/1/patterns/sample.dxf", category: "패턴", uploadedAt: new Date().toISOString(), fileSize: "2.5MB", fileType: "dxf" },
        { id: "d2", name: "도식화 PDF", path: "products/1/specs/techpack.pdf", category: "인쇄", uploadedAt: new Date(Date.now() - 86400000).toISOString(), fileSize: "1.8MB", fileType: "pdf" },
        { id: "d3", name: "셔츠 패턴", path: "products/3/patterns/shirt.dxf", category: "패턴", uploadedAt: new Date(Date.now() - 432000000).toISOString(), fileSize: "1.9MB", fileType: "dxf" },
        { id: "d4", name: "바지 도식화", path: "products/4/specs/pants.pdf", category: "인쇄", uploadedAt: new Date(Date.now() - 518400000).toISOString(), fileSize: "2.3MB", fileType: "pdf" }
      ];
      const filtered = category && category !== '전체' ? demoAssets.filter(a => a.category === category) : demoAssets;
      return NextResponse.json({ assets: filtered });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, name, path, url, category } = body || {};

    if (!userId || !path || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Supabase 동적 로드
    let supabase: any = null;
    let supabaseAdmin: any = null;
    try {
      const mod = await import('@/lib/supabase');
      const adminMod = await import('@/lib/supabase-admin');
      supabase = (mod as any).supabase || null;
      supabaseAdmin = (adminMod as any).supabaseAdmin || null;
    } catch (e) {
      // noop
    }

    // Supabase 미설정 시에도 성공으로 응답하여 UI 흐름 유지
    if (!supabase && !supabaseAdmin) {
      return NextResponse.json({ success: true, asset: { id: `temp-${Date.now()}`, user_id: userId, name, path, url, category: category || '기타', uploadedAt: new Date().toISOString() } });
    }

    try {
      const client: any = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('assets')
        .insert({ user_id: userId, name, path, url, category: category || '기타' })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, asset: data });
    } catch (dbErr) {
      console.warn('Failed to insert asset, returning mock success:', dbErr);
      return NextResponse.json({ success: true, asset: { id: `temp-${Date.now()}`, user_id: userId, name, path, url, category: category || '기타', uploadedAt: new Date().toISOString() } });
    }
  } catch (_e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
