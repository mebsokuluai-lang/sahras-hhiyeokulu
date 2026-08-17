import { connectToDatabase } from './mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ApiKeyDoc {
  provider?: string;
  type?: string;
  key?: string;
  api_key?: string;
  active?: boolean;
}

async function getActiveApiKey(providerName: string): Promise<string | null> {
  try {
    const { db } = await connectToDatabase();
    
    // Find matching key in 'keys' collection
    const keyDoc = await db.collection<ApiKeyDoc>('keys').findOne({
      $or: [
        { provider: providerName, active: { $ne: false } },
        { type: providerName, active: { $ne: false } }
      ]
    });

    if (keyDoc) {
      return keyDoc.key || keyDoc.api_key || null;
    }
  } catch (err) {
    console.error(`Error loading key for ${providerName}:`, err);
  }
  return null;
}

export async function generateAiSummary(title: string, content: string): Promise<string[]> {
  // 1. Try OpenRouter Key (User-specified Free LLMs)
  const openRouterKey = (await getActiveApiKey('openrouter')) || process.env.OPENROUTER_API_KEY;

  if (openRouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sahrasihhiye.vercel.app',
          'X-Title': 'Sahra Sıhhiye Okulu',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite:free',
          messages: [
            {
              role: 'system',
              content: 'Sen Sahra Sıhhiye Okulu tıp ve sağlık uzmanısın. Sağlık ve tıp haberlerini Türkçe olarak tam 3 kısa ve öz maddede özetlersin. Sadece 3 madde ver.'
            },
            {
              role: 'user',
              content: `Başlık: ${title}\nİçerik: ${content.substring(0, 1500)}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        const lines = text
          .split('\n')
          .map((line: string) => line.replace(/^[*•\d.-]+\s*/, '').trim())
          .filter((line: string) => line.length > 5);

        if (lines.length > 0) return lines.slice(0, 3);
      }
    } catch (err) {
      console.error('OpenRouter AI summary error:', err);
    }
  }

  // 2. Try Gemini Key
  const geminiKey = (await getActiveApiKey('gemini')) || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Aşağıdaki sağlık/tıp haberini Sahra Sıhhiye Okulu portalı okuyucuları için Türkçe olarak tam 3 maddede özetle:\nBaşlık: ${title}\nİçerik: ${content.substring(0, 1500)}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const lines = text
        .split('\n')
        .map((line: string) => line.replace(/^[*•\d.-]+\s*/, '').trim())
        .filter((line: string) => line.length > 5);

      if (lines.length > 0) return lines.slice(0, 3);
    } catch (err) {
      console.error('Gemini AI summary error:', err);
    }
  }

  // 3. Fallback Smart Sentence Extraction
  const cleanContent = content ? content.replace(/<[^>]+>/g, '') : '';
  const sentences = cleanContent
    ? cleanContent.split('. ').map(s => s.trim()).filter(s => s.length > 20)
    : [];

  return [
    sentences[0] ? `${sentences[0]}.` : `Bu haber, "${title}" konusundaki sağlık ve tıp gelişmelerini aktarmaktadır.`,
    sentences[1] ? `${sentences[1]}.` : `Sahra sıhhiye, klinik tıp ve koruyucu hekimlik açısından önemli bilgiler içermektedir.`,
    `Detaylı inceleme ve tıbbi rehber için haberin tamamını okuyabilirsiniz.`
  ];
}

export async function explainMedicalTermAi(term: string): Promise<string> {
  const openRouterKey = (await getActiveApiKey('openrouter')) || process.env.OPENROUTER_API_KEY;

  if (openRouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-lite:free',
          messages: [
            {
              role: 'user',
              content: `"${term}" tıbbi/sıhhiye terimini halk ve sağlık personeli için anlaşılır, kısa 2 cümlede açıklayan Türkçe bir tanım yaz.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.error('OpenRouter term explanation error:', err);
    }
  }

  const geminiKey = (await getActiveApiKey('gemini')) || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(`"${term}" tıbbi terimini anlaşılır 2 cümlede açıkla.`);
      return result.response.text().trim();
    } catch (err) {
      console.error('Gemini term error:', err);
    }
  }

  return `${term}: Sahra sıhhiye, tıp ve klinik literatürde kullanılan temel tıbbi terimlerden biridir.`;
}
