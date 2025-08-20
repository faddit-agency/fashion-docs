import { NextRequest, NextResponse } from 'next/server';

// GET /api/files/thumbnail?path=<path>&bucket=<bucket>&w=360&h=240&q=70
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get('path') || '';
    const bucket = searchParams.get('bucket') || 'faddit-files';
    const w = Number(searchParams.get('w') || '360');
    const h = Number(searchParams.get('h') || '240');
    const q = Number(searchParams.get('q') || '70');

    if (!rawPath) {
      return NextResponse.redirect(new URL(`/api/placeholder/${w}/${h}?text=No+Path`, request.url));
    }

    // 동적 로드 (admin 우선)
    let supabase: any = null;
    let supabaseAdmin: any = null;
    try {
      const mod = await import('@/lib/supabase');
      const adminMod = await import('@/lib/supabase-admin');
      supabase = (mod as any).supabase || null;
      supabaseAdmin = (adminMod as any).supabaseAdmin || null;
    } catch {}
    const client: any = supabaseAdmin || supabase;
    if (!client) {
      // Supabase 미설정 시 플레이스홀더로 폴백
      return NextResponse.redirect(new URL(`/api/placeholder/${w}/${h}?text=Preview`, request.url));
    }

    // 5분 유효한 변환 포함 서명 URL 생성 (가능하면 transform 옵션 사용)
    const expiresIn = 60 * 5;
    let finalUrl: string | null = null;
    try {
      const { data: signedWithTransform } = await client.storage
        .from(bucket)
        .createSignedUrl(rawPath, expiresIn, {
          transform: { width: w, height: h, resize: 'contain', quality: q }
        });
      if (signedWithTransform?.signedUrl) {
        finalUrl = signedWithTransform.signedUrl as string;
      }
    } catch {}

    if (!finalUrl) {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(rawPath, expiresIn, { download: false });
      if (error || !data?.signedUrl) {
        // 마지막 폴백: 공개 버킷이라면 public render URL 시도
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          const encodedPath = rawPath.split('/').map(encodeURIComponent).join('/');
          finalUrl = `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${encodedPath}?width=${w}&height=${h}&quality=${q}&resize=contain`;
        } else {
          return NextResponse.redirect(new URL(`/api/placeholder/${w}/${h}?text=No+URL`, request.url));
        }
      }
      const signed = new URL(data.signedUrl);
      const origin = `${signed.protocol}//${signed.host}`;
      const pathParts = signed.pathname.split('/');
      const signIndex = pathParts.findIndex((p) => p === 'sign');
      if (signIndex === -1) {
        return NextResponse.redirect(new URL(`/api/placeholder/${w}/${h}?text=Bad+URL`, request.url));
      }
      const bucketName = pathParts[signIndex + 1] || bucket;
      const objectPath = pathParts.slice(signIndex + 2).join('/');
      const token = signed.searchParams.get('token') || '';
      const transformed = new URL(`${origin}/storage/v1/render/image/sign/${bucketName}/${objectPath}`);
      if (token) transformed.searchParams.set('token', token);
      transformed.searchParams.set('width', String(w));
      transformed.searchParams.set('height', String(h));
      transformed.searchParams.set('quality', String(q));
      transformed.searchParams.set('resize', 'contain');
      finalUrl = finalUrl || transformed.toString();
    }

    // 프록시로 이미지를 받아 직접 반환 (CORS/리다이렉트 이슈 방지)
    const upstream = await fetch(finalUrl, { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.redirect(new URL(`/api/placeholder/${w}/${h}?text=No+Image`, request.url));
    }
    const imageBuffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const resp = new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      }
    });
    return resp;
  } catch (e) {
    return NextResponse.redirect(new URL(`/api/placeholder/360/240?text=Error`, request.url));
  }
}


