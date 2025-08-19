import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

// 구매자에게만 제공되는 서명 URL 발급 API
// body: { path: string, bucket?: string, userId: string }
export async function POST(request: NextRequest) {
  try {
    const { path, bucket = 'faddit-files', userId } = await request.json();
    console.log('API 호출 파라미터:', { path, bucket, userId });
    
    if (!path || !userId) {
      console.log('필수 파라미터 누락:', { path, userId });
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    if (!supabase) {
      console.log('Supabase 클라이언트가 null입니다. 데모 URL 반환');
      // 데모 환경에서는 공개 URL로 대체
      return NextResponse.json({ url: `/api/placeholder/400/600?text=File` });
    }

    // 접근 제어: 해당 파일의 product를 구매했는지 검사
    // 파일 경로에 productId가 포함된 규칙을 가정: products/{productId}/...
    const match = path.match(/products\/(\d+)\//);
    const productId = match ? Number(match[1]) : null;
    console.log('파일 경로 분석:', { path, productId });

    // productId가 없는 경우 (예: assets/labels/guide.pdf)
    // 공개 에셋으로 간주하고 별도 접근 제어 없이 허용
    if (!productId) {
      console.log('공개 에셋으로 간주하여 접근 허용:', path);
      
      // Supabase가 설정된 경우 실제 서명 URL 생성
      if (supabase) {
        const { data: signed, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 60);
          
        if (error) {
          console.log('공개 에셋 서명 URL 생성 오류:', error);
          return NextResponse.json({ url: `/api/placeholder/400/600?text=File` });
        }
        
        return NextResponse.json({ url: signed.signedUrl });
      }
      
                 // 데모 환경에서는 placeholder URL 반환
           return NextResponse.json({ url: `/api/placeholder/400/600?text=File` });
    }

    console.log('구매 내역 확인 중:', { userId, productId });
    const { data: purchased, error: purchaseErr } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle();

    if (purchaseErr) {
      console.log('구매 내역 조회 오류:', purchaseErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    if (!purchased) {
      console.log('구매 내역이 없습니다:', { userId, productId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 서명 URL 생성 (60분 유효)
    console.log('서명 URL 생성 중:', { bucket, path });
    const { data: signed, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60);

    if (error) {
      console.log('서명 URL 생성 오류:', error);
      return NextResponse.json({ error: 'Failed to create signed url' }, { status: 500 });
    }
    
    if (!signed) {
      console.log('서명 URL 데이터가 없습니다');
      return NextResponse.json({ error: 'No signed url data' }, { status: 500 });
    }

    console.log('서명 URL 생성 성공');
    return NextResponse.json({ url: signed.signedUrl });
  } catch (error) {
    console.error('API 전체 오류:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


