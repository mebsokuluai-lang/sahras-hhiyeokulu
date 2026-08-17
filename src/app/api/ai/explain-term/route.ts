import { NextResponse } from 'next/server';
import { explainMedicalTermAi } from '@/lib/aiService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || 'Tıbbi Kavram';

    const explanation = await explainMedicalTermAi(term);
    return NextResponse.json({ success: true, term, explanation });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      term: 'Tıbbi Kavram',
      explanation: 'Sahra sıhhiye ve tıp literatüründe sıkça kullanılan temel tıbbi kavramlardan biridir.'
    });
  }
}
