import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { worksheetData, userId } = await request.json();
    
    console.log('Save worksheet request:', { userId, title: worksheetData?.title });
    
    if (!worksheetData || !userId) {
      console.error('Missing required data:', { worksheetData: !!worksheetData, userId: !!userId });
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Supabase가 설정되지 않은 경우 데모 저장
    if (!supabase && !supabaseAdmin) {
      console.log('Demo mode: Worksheet saved locally');
      return NextResponse.json({ 
        success: true, 
        id: Date.now().toString(),
        message: '데모 모드에서 저장되었습니다.' 
      });
    }

    // Supabase 테이블이 존재하지 않을 수 있으므로 데모 모드로 처리
    try {
      const db = supabaseAdmin || supabase!;
      // 기존 작업지시서가 있는지 확인
      const { data: existingWorksheet } = await db
        .from('worksheets')
        .select('id')
        .eq('user_id', userId)
        .eq('title', worksheetData.title)
        .maybeSingle();

      // 선택 권한(RLS) 부재 등으로 select가 막혀도 저장은 시도
      // checkError가 있어도 계속 진행하여 insert/update를 시도한다.

      let result;
      
      if (existingWorksheet) {
        // 기존 작업지시서 업데이트
        const { data, error } = await db
          .from('worksheets')
          .update({
            // 보조 컬럼들도 함께 업데이트하여 마이페이지에서 바로 사용 가능하도록
            title: worksheetData.title,
            category: worksheetData.category,
            size_range: Array.isArray(worksheetData?.sizeSpec?.sizes)
              ? `${worksheetData.sizeSpec.sizes[0]}~${worksheetData.sizeSpec.sizes[worksheetData.sizeSpec.sizes.length - 1]}`
              : worksheetData.size_range,
            content: worksheetData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWorksheet.id)
          .select()
          .single();

        if (error) {
          console.error('Worksheet update error:', error);
          return NextResponse.json({ error: 'Failed to update worksheet', details: error }, { status: 500 });
        }

        result = data;
      } else {
        // 새 작업지시서 생성
        const { data, error } = await db
          .from('worksheets')
          .insert({
            user_id: userId,
            title: worksheetData.title,
            category: worksheetData.category,
            size_range: Array.isArray(worksheetData?.sizeSpec?.sizes)
              ? `${worksheetData.sizeSpec.sizes[0]}~${worksheetData.sizeSpec.sizes[worksheetData.sizeSpec.sizes.length - 1]}`
              : worksheetData.size_range,
            content: worksheetData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Worksheet creation error:', error);
          return NextResponse.json({ error: 'Failed to create worksheet', details: error }, { status: 500 });
        }

        result = data;
      }

      return NextResponse.json({ 
        success: true, 
        id: result.id,
        message: existingWorksheet ? '작업지시서가 업데이트되었습니다.' : '작업지시서가 저장되었습니다.'
      });

    } catch (dbError) {
      console.log('Database operation failed, using demo mode:', dbError);
      return NextResponse.json({ 
        success: true, 
        id: Date.now().toString(),
        message: '데모 모드에서 저장되었습니다.' 
      });
    }

  } catch (error) {
    console.error('Save worksheet error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
