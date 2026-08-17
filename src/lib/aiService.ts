import { connectToDatabase } from './mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ApiKeyDoc {
  provider?: string;
  type?: string;
  key?: string;
  api_key?: string;
  active?: boolean;
}

const DEFAULT_OPENROUTER_KEY = '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';

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
  // 1. Try OpenRouter Key (Supports Google Gemini 2.0 Flash, GPT-4o-mini, Llama 3.3)
  const openRouterKey = (await getActiveApiKey('openrouter')) || process.env.OPENROUTER_API_KEY || DEFAULT_OPENROUTER_KEY;

  if (openRouterKey) {
    // Models to try in order of priority
    const modelsToTry = [
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o-mini',
      'google/gemini-2.0-flash-lite:free',
      'meta-llama/llama-3.3-70b-instruct:free'
    ];

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://sahras-hhiyeokulu.vercel.app',
            'X-Title': 'Sahra Sıhhiye Okulu',
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.3,
            messages: [
              {
                role: 'system',
                content: 'Sen askeri tıp ve sağlık alanında uzman bir hekimsin. Verilen haber metninden yalnızca 3 maddelik, sade, teknik terimleri anlaşılır kılan, Türkçe hap bilgi özeti çıkar. Yanıtını doğrudan HTML/Markdown liste formatında (• Madde 1...) ver, giriş/çıkış laf kalabalığı yapma.'
              },
              {
                role: 'user',
                content: `Başlık: ${title}\nİçerik: ${content ? content.substring(0, 2000) : title}`
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
        console.error(`OpenRouter model ${modelName} error:`, err);
      }
    }
  }

  // 2. Try Gemini Key (Direct Google AI SDK fallback)
  const geminiKey = (await getActiveApiKey('gemini')) || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Sen askeri tıp ve sağlık alanında uzman bir hekimsin. Verilen haber metninden yalnızca 3 maddelik, sade, teknik terimleri anlaşılır kılan, Türkçe hap bilgi özeti çıkar:\nBaşlık: ${title}\nİçerik: ${content ? content.substring(0, 1500) : title}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const lines = text
        .split('\n')
        .map((line: string) => line.replace(/^[*•\d.-]+\s*/, '').trim())
        .filter((line: string) => line.length > 5);

      if (lines.length > 0) return lines.slice(0, 3);
    } catch (err) {
      console.error('Gemini AI summary fallback error:', err);
    }
  }

  // 3. Fallback Smart Sentence Extraction
  const cleanContent = content ? content.replace(/<[^>]+>/g, '') : '';
  const sentences = cleanContent
    ? cleanContent.split('. ').map(s => s.trim()).filter(s => s.length > 20)
    : [];

  return [
    sentences[0] ? `${sentences[0]}.` : `Bu haber, "${title}" başlıklı klinik ve sahra tıp gelişmelerini aktarmaktadır.`,
    sentences[1] ? `${sentences[1]}.` : `Koruyucu hekimlik, ilk yardım ve halk sağlığı açısından kritik bilgiler içerir.`,
    `Detaylı inceleme ve klinik yönergeler için haberin tamamını inceleyebilirsiniz.`
  ];
}

export async function explainMedicalTermAi(term: string): Promise<string> {
  const openRouterKey = (await getActiveApiKey('openrouter')) || process.env.OPENROUTER_API_KEY || DEFAULT_OPENROUTER_KEY;

  if (openRouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sahras-hhiyeokulu.vercel.app',
          'X-Title': 'Sahra Sıhhiye Okulu',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: 'Sen askeri ve sivil sağlık alanında uzman bir hekimsin. Sana sorulan tıbbi terimi halk ve sıhhiye personeli için 2 kısa, net ve anlaşılır cümlede Türkçe açıkla.'
            },
            {
              role: 'user',
              content: `"${term}" tıbbi terimini açıkla.`
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
      const result = await model.generateContent(`"${term}" tıbbi terimini 2 kısa cümlede açıkla.`);
      return result.response.text().trim();
    } catch (err) {
      console.error('Gemini term error:', err);
    }
  }

  return `${term}: Sahra sıhhiye ve klinik tıp literatüründe kullanılan temel kavramlardan biridir.`;
}
