import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const db = supabaseAdmin || supabase;

    if (!db) {
      // Demo fallback
      return NextResponse.json({
        worksheet: {
          id,
          title: '베이직 셔츠',
          category: '상의',
          size_range: 'S~XL',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          content: {},
        },
      });
    }

    const { data, error } = await db
      .from('worksheets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
    }

    // content에 상세 데이터가 있다면 병합하여 반환
    const merged = { ...data.content, ...data };

    return NextResponse.json({ worksheet: merged });
  } catch (_e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}





