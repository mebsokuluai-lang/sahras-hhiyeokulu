import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { link, id, field, value } = await request.json();
    if (!field || value === undefined) {
      return NextResponse.json({ status: 'error', message: 'Alan ve değer gerekli' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('haberler');

    let query: any = {};
    if (id && ObjectId.isValid(id)) {
      query._id = new ObjectId(id);
    } else if (id) {
      query.$or = [{ _id: id as any }, { id: id }, { link: id }];
    } else if (link) {
      query.link = link;
    } else {
      return NextResponse.json({ status: 'error', message: 'ID veya link gerekli' }, { status: 400 });
    }

    const updateDoc: any = {
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    // If updating Turkish field, also update base field for compatibility
    if (field === 'title_turkish') updateDoc.title = value;
    if (field === 'summary_turkish') updateDoc.summary = value;
    if (field === 'content_turkish') updateDoc.content = value;

    await collection.updateOne(query, { $set: updateDoc });

    return NextResponse.json({ status: 'success', message: 'Kayıt güncellendi.' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
