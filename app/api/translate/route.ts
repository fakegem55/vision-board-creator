import { NextRequest, NextResponse } from 'next/server';

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const langpair = request.nextUrl.searchParams.get('langpair') ?? 'ko|en';
  if (!q) return NextResponse.json({ text: '' }, { status: 400 });

  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(langpair)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 서버 캐시 24시간
    if (!res.ok) return NextResponse.json({ text: q });

    const data = (await res.json()) as { responseData: { translatedText: string } };
    return NextResponse.json({ text: data.responseData?.translatedText ?? q });
  } catch {
    return NextResponse.json({ text: q });
  }
}
