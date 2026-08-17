import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parametresi zorunludur.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('haberler');

    let newsItem = null;

    // 1. Try finding by MongoDB ObjectId if valid
    if (ObjectId.isValid(id)) {
      try {
        newsItem = await collection.findOne({ _id: new ObjectId(id) });
      } catch {
        newsItem = null;
      }
    }

    // 2. Fallback search by string _id, id, link or guid
    if (!newsItem) {
      newsItem = await collection.findOne({
        $or: [
          { _id: id as any },
          { id: id },
          { link: id },
          { link: decodeURIComponent(id) },
          { guid: id }
        ]
      });
    }

    // 3. Fallback search by title
    if (!newsItem && id.length > 3) {
      try {
        const decodedTitle = decodeURIComponent(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newsItem = await collection.findOne({
          title: { $regex: decodedTitle, $options: 'i' }
        });
      } catch {
        newsItem = null;
      }
    }

    if (!newsItem) {
      return NextResponse.json({ success: false, error: 'Haber bulunamadı.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, news: newsItem });
  } catch (error: any) {
    console.error('API Single News Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
