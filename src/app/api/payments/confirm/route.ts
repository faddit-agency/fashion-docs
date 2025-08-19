import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 결제 성공 후 결제키를 검증하고 구매 레코드 생성/업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount, userId, items } = body as {
      paymentKey: string;
      orderId: string;
      amount: number;
      userId: string;
      items: Array<{ productId: number; quantity: number; price: number }>;
    };

    if (!paymentKey || !orderId || !amount || !userId) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    // 실제 환경에서는 토스페이먼츠 결제 승인 API 호출 필요
    // 여기서는 데모 목적: paymentKey 형식만 체크
    if (typeof paymentKey !== 'string' || paymentKey.length < 8) {
      return NextResponse.json({ error: 'Invalid paymentKey' }, { status: 400 });
    }

    if (!supabase) {
      // 데모 환경: 구매 성공 더미 응답
      return NextResponse.json({ success: true, purchases: [], clearedCart: true });
    }

    // purchases 테이블에 아이템별 레코드 생성
    const purchaseRows = items.map((it) => ({
      user_id: userId,
      product_id: it.productId,
      amount: it.price * it.quantity,
      status: 'completed' as const,
      payment_key: paymentKey,
    }));

    const { data: created, error: createErr } = await supabase
      .from('purchases')
      .insert(purchaseRows)
      .select('*');

    if (createErr) {
      return NextResponse.json({ error: 'Failed to record purchases' }, { status: 500 });
    }

    // 장바구니 비우기
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    return NextResponse.json({ success: true, purchases: created, clearedCart: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


