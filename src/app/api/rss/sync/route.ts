import { NextResponse } from 'next/server';
import { syncAllHealthRssFeeds } from '@/lib/rssFetcher';

export async function POST() {
  try {
    const count = await syncAllHealthRssFeeds();
    return NextResponse.json({
      success: true,
      message: `${count} adet yeni sağlık haberi veritabanına başarıyla çekildi.`,
      addedCount: count,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
