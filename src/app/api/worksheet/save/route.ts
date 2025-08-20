import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { worksheetData, userId, forceCreate, worksheetId } = await request.json();
    
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
      let result;
      if (forceCreate && !worksheetId) {
        // 무조건 새 작업지시서 생성
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
        return NextResponse.json({ success: true, id: result.id, message: '작업지시서가 저장되었습니다.' });
      } else {
        // 기존 로직: 동일 제목 존재 시 업데이트, 없으면 생성
        let existingWorksheet: any = null;
        if (worksheetId) {
          const { data } = await db
            .from('worksheets')
            .select('id')
            .eq('id', worksheetId)
            .eq('user_id', userId)
            .maybeSingle();
          existingWorksheet = data;
        } else {
          const { data } = await db
            .from('worksheets')
            .select('id')
            .eq('user_id', userId)
            .eq('title', worksheetData.title)
            .maybeSingle();
          existingWorksheet = data;
        }

        if (existingWorksheet) {
          const { data, error } = await db
            .from('worksheets')
            .update({
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
          return NextResponse.json({ success: true, id: result.id, message: '작업지시서가 업데이트되었습니다.' });
        } else {
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
          return NextResponse.json({ success: true, id: result.id, message: '작업지시서가 저장되었습니다.' });
        }
      }

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
