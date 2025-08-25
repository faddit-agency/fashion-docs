import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// supabaseAdmin이 null인지 확인하는 함수
function getSupabaseClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }
  return supabaseAdmin;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Drive assets API called');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    console.log('API called with params:', { category, userId });

    // 실제 Supabase 쿼리
    try {
      console.log('Attempting to fetch real data from Supabase');
      
      const client = getSupabaseClient();
      
      let query = client
        .from('assets')
        .select('*')
        .neq('category', '작업지시서'); // 작업지시서 카테고리 제외

      // userId가 'anonymous'가 아닌 경우에만 필터링
      if (userId && userId !== 'anonymous') {
        query = query.eq('user_id', userId);
      }

      if (category && category !== "전체") {
        query = query.eq('category', category);
      }

      const { data: assets, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Supabase query successful, found assets:', assets?.length || 0);

      // URL 보정: url이 없으면 공개 URL 생성
      const bucketId = 'faddit-files';
      const withUrls = (assets || []).map((a: any) => {
        if (a.url) return a;
        try {
          const { data: publicUrl } = client.storage.from(bucketId).getPublicUrl(a.path);
          return { ...a, url: publicUrl?.publicUrl || null };
        } catch {
          return a;
        }
      });

      console.log('Assets with URLs:', withUrls.length);
      return NextResponse.json({ assets: withUrls });
      
    } catch (dbErr) {
      console.warn('Supabase query failed, falling back to demo data:', dbErr);
      
      // Supabase 실패 시 데모 데이터 반환
      const demoAssets = [
        { 
          id: "1", 
          name: "패턴 DXF", 
          path: "products/1/patterns/sample.dxf", 
          url: "/api/placeholder/400/600?text=패턴%20DXF&bg=white&color=black",
          category: "패턴", 
          uploadedAt: new Date().toISOString(),
          fileSize: "2.5MB",
          fileType: "dxf"
        },
        { 
          id: "2", 
          name: "도식화 PDF", 
          path: "products/1/specs/drawing.pdf", 
          url: "/api/placeholder/400/600?text=도식화%20PDF&bg=white&color=black",
          category: "도식화", 
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          fileSize: "1.8MB",
          fileType: "pdf"
        },
        { 
          id: "3", 
          name: "라벨 가이드", 
          path: "assets/labels/guide.pdf", 
          url: "/api/placeholder/400/600?text=라벨%20가이드&bg=white&color=black",
          category: "라벨", 
          uploadedAt: new Date(Date.now() - 259200000).toISOString(),
          fileSize: "0.5MB",
          fileType: "pdf"
        },
        { 
          id: "4", 
          name: "원단 스와치", 
          path: "products/2/fabrics/swatch.jpg", 
          url: "/api/placeholder/400/600?text=원단%20스와치&bg=gray&color=white",
          category: "원단", 
          uploadedAt: new Date(Date.now() - 345600000).toISOString(),
          fileSize: "3.2MB",
          fileType: "jpg"
        },
        { 
          id: "5", 
          name: "기술 도면", 
          path: "products/1/technical/drawing.ai", 
          url: "/api/placeholder/400/600?text=기술%20도면&bg=white&color=black",
          category: "기타", 
          uploadedAt: new Date(Date.now() - 432000000).toISOString(),
          fileSize: "5.1MB",
          fileType: "ai"
        },
        { 
          id: "6", 
          name: "셔츠 패턴", 
          path: "products/3/patterns/shirt.dxf", 
          url: "/api/placeholder/400/600?text=셔츠%20패턴&bg=white&color=black",
          category: "패턴", 
          uploadedAt: new Date(Date.now() - 518400000).toISOString(),
          fileSize: "1.9MB",
          fileType: "dxf"
        },
        { 
          id: "7", 
          name: "바지 도식화", 
          path: "products/4/specs/pants_drawing.pdf", 
          url: "/api/placeholder/400/600?text=바지%20도식화&bg=white&color=black",
          category: "도식화", 
          uploadedAt: new Date(Date.now() - 604800000).toISOString(),
          fileSize: "2.3MB",
          fileType: "pdf"
        },
        { 
          id: "8", 
          name: "면 원단", 
          path: "assets/fabrics/cotton_fabric.jpg", 
          url: "/api/placeholder/400/600?text=면%20원단&bg=gray&color=white",
          category: "원단", 
          uploadedAt: new Date(Date.now() - 777600000).toISOString(),
          fileSize: "1.2MB",
          fileType: "jpg"
        },
        { 
          id: "9", 
          name: "드레스 패턴", 
          path: "assets/patterns/dress_pattern.ai", 
          url: "/api/placeholder/400/600?text=드레스%20패턴&bg=white&color=black",
          category: "패턴", 
          uploadedAt: new Date(Date.now() - 864000000).toISOString(),
          fileSize: "3.8MB",
          fileType: "ai"
        },
        { 
          id: "10", 
          name: "스크린 프린트", 
          path: "assets/prints/screen_print.psd", 
          url: "/api/placeholder/400/600?text=스크린%20프린트&bg=white&color=black",
          category: "인쇄", 
          uploadedAt: new Date(Date.now() - 950400000).toISOString(),
          fileSize: "4.1MB",
          fileType: "psd"
        }
      ];

      // 카테고리 필터링
      const filteredAssets = category && category !== "전체" 
        ? demoAssets.filter(asset => asset.category === category)
        : demoAssets;

      console.log('Category filter:', category);
      console.log('Total demo assets:', demoAssets.length);
      console.log('Filtered assets:', filteredAssets.length);
      
      return NextResponse.json({ assets: filteredAssets });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST request received');
    
    // Content-Type 확인
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    let file: File | null = null;
    let category: string = '';
    let userId: string = '';
    
    if (contentType.includes('multipart/form-data')) {
      // FormData 처리 (파일 업로드)
      const formData = await request.formData();
      file = formData.get('file') as File;
      category = formData.get('category') as string;
      userId = formData.get('userId') as string;
    } else if (contentType.includes('application/json')) {
      // JSON 처리 (마이페이지에서 보내는 요청)
      const body = await request.json();
      category = body.category || '';
      userId = body.userId || '';
    }

    console.log('Request data parsed:', { 
      hasFile: !!file, 
      fileName: file ? file.name : 'N/A', 
      fileSize: file ? file.size : 'N/A',
      category, 
      userId 
    });

    if (!category || !userId) {
      console.error('Missing required fields:', { category, userId });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 파일이 있는 경우에만 파일 검증 수행
    if (file) {
      // 파일 크기 제한 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
      }

      // 파일 확장자 검증
      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'ai', 'eps', 'dxf', 'psd', 'docx', 'xlsx'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }

      // 실제 Supabase 업로드 시도
      try {
        const client = getSupabaseClient();
        const bucketId = 'faddit-files';
        
        // 파일 경로 생성
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const filePath = `users/${userId}/${category}/${fileName}`;

        // 파일 업로드
        const { data: uploadData, error: uploadError } = await client.storage
          .from(bucketId)
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // 공개 URL 생성
        const { data: publicUrlData } = client.storage
          .from(bucketId)
          .getPublicUrl(filePath);

        // 파일 확장자 추출
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

        // 데이터베이스에 에셋 정보 저장
        const assetData = {
          user_id: userId,
          name: file.name,
          path: filePath,
          url: publicUrlData?.publicUrl || null,
          category: category,
          file_size: file.size,
          file_type: fileExtension
        };

        const { data: dbData, error: dbError } = await client
          .from('assets')
          .insert(assetData)
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw dbError;
        }

        console.log('File uploaded successfully:', dbData);
        return NextResponse.json({ success: true, asset: dbData });

      } catch (dbErr) {
        console.warn('Supabase upload failed, using demo response:', dbErr);
      }
    }

    // 데모 응답 (Supabase 미설정 또는 실패 시)
    const fileName = file ? file.name : `demo_${Date.now()}`;
    const fileSize = file ? file.size : 0;
    const fileExtension = file ? file.name.split('.').pop()?.toLowerCase() || '' : '';
    
    const demoAsset = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      name: fileName,
      path: `users/${userId}/${category}/${fileName}`,
      url: `/api/placeholder/400/600?text=${encodeURIComponent(fileName)}`,
      category: category,
      fileSize: formatBytes(fileSize),
      fileType: fileExtension,
      uploadedAt: new Date().toISOString()
    };

    console.log('Demo asset created:', demoAsset);
    return NextResponse.json({ success: true, asset: demoAsset });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
