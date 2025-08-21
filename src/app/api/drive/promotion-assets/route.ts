import { NextRequest, NextResponse } from 'next/server';
import { generatePromotionAssets } from '@/lib/sample-data';

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();

    // 프로모션 상품인지 확인 (ID 999는 프로모션 상품)
    if (productId === 999) {
      // 프로모션 패키지의 42개 아이템 생성
      const promotionAssets = generatePromotionAssets();
      
      // 로컬 스토리지에 저장 (실제로는 데이터베이스에 저장)
      const existingAssets = JSON.parse(localStorage.getItem('demo_drive_assets') || '[]');
      const updatedAssets = [...existingAssets, ...promotionAssets];
      localStorage.setItem('demo_drive_assets', JSON.stringify(updatedAssets));

      return NextResponse.json({
        success: true,
        message: '프로모션 패키지가 드라이브에 추가되었습니다.',
        assetsCount: promotionAssets.length,
        assets: promotionAssets
      });
    }

    return NextResponse.json({
      success: false,
      message: '프로모션 상품이 아닙니다.'
    });

  } catch (error) {
    console.error('프로모션 에셋 추가 오류:', error);
    return NextResponse.json(
      { success: false, message: '프로모션 에셋 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}
