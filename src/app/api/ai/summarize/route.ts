import { NextResponse } from 'next/server';
import { generateAiSummary } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title || 'Sahra Sıhhiye Güncel Sağlık Haberi';
    const content = body.content || body.summary || '';

    const summary = await generateAiSummary(title, content);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      summary: [
        'Bu haber, güncel sahra sıhhiye ve tıp alanındaki gelişmeleri aktarmaktadır.',
        'Klinik tıp, koruyucu hekimlik ve ilk yardım açısından önemli bilgiler içermektedir.',
        'Detaylar için makalenin tamamını okuyabilirsiniz.'
      ]
    });
  }
}
