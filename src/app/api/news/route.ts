import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { syncAllHealthRssFeeds } from '@/lib/rssFetcher';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const { db } = await connectToDatabase();
    const collection = db.collection('haberler');

    let query: any = {};

    if (category && category !== 'hepsi') {
      query.category = { $regex: category, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    let news = await collection.find(query).sort({ pubDate: -1 }).limit(30).toArray();

    // If database is empty, automatically trigger initial RSS sync
    if (news.length === 0) {
      await syncAllHealthRssFeeds();
      news = await collection.find(query).sort({ pubDate: -1 }).limit(30).toArray();
    }

    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
