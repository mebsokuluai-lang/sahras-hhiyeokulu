import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { link, id, gonderildi } = await request.json();
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
      return NextResponse.json({ status: 'error', message: 'Haber linki veya ID gerekli' }, { status: 400 });
    }

    const current = await collection.findOne(query);
    const newStatus = gonderildi !== undefined ? gonderildi : !(current?.gonderildi);

    await collection.updateOne(query, {
      $set: {
        gonderildi: newStatus,
        updatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      status: 'success',
      message: newStatus ? 'Haber gönderildi olarak işaretlendi.' : 'Haber gönderilmedi olarak işaretlendi.',
      gonderildi: newStatus
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
