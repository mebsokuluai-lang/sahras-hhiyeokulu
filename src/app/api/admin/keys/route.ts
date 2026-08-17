import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const keys = await db.collection('keys').find({}).toArray();
    return NextResponse.json({ success: true, keys });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, provider, key } = await request.json();
    if (!name || !key) {
      return NextResponse.json({ error: 'Name and key required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection('keys').updateOne(
      { provider: provider || 'openrouter' },
      { $set: { name, provider: provider || 'openrouter', key, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'API Anahtarı başarıyla kaydedildi.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const provider = searchParams.get('provider');

    const { db } = await connectToDatabase();
    if (id) {
      await db.collection('keys').deleteOne({ _id: new ObjectId(id) });
    } else if (provider) {
      await db.collection('keys').deleteOne({ provider });
    }

    return NextResponse.json({ success: true, message: 'API Anahtarı silindi.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
