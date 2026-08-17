import { connectToDatabase } from './mongodb';
import { NewsItem, RssSource } from './types';

export const DEFAULT_HEALTH_RSS_SOURCES: RssSource[] = [
  {
    name: 'Medimagazin Sağlık',
    url: 'https://www.medimagazin.com.tr/rss',
    category: 'Tıp & Camia',
    isActive: true,
  },
  {
    name: 'Medikal Akademi',
    url: 'https://www.medikalakademi.com.tr/feed/',
    category: 'Klinik & Araştırma',
    isActive: true,
  },
  {
    name: 'Sağlık Aktüel',
    url: 'https://www.saglikaktuel.com/rss.xml',
    category: 'Halk Sağlığı',
    isActive: true,
  },
  {
    name: 'Doktorsitesi Sağlık',
    url: 'https://www.doktorsitesi.com/rss/articles',
    category: 'Beslenme & Yaşam',
    isActive: true,
  },
];

function cleanHtmlText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchRssFeed(url: string, sourceName: string, category: string): Promise<Partial<NewsItem>[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return [];

    const xmlText = await response.text();
    const items: Partial<NewsItem>[] = [];

    // Match RSS items
    const itemRegex = /<item[\s\S]*?>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 15) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const contentEncodedMatch = itemXml.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
      const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
      const imgMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i) || 
                       itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i) ||
                       itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);

      if (titleMatch && linkMatch) {
        const title = cleanHtmlText(titleMatch[1]);
        const fullContent = cleanHtmlText(contentEncodedMatch ? contentEncodedMatch[1] : (descMatch ? descMatch[1] : ''));
        const link = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim();
        const image = imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80';
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString();

        const summary = fullContent.length > 280 ? fullContent.substring(0, 280) + '...' : fullContent;

        if (title.length > 3 && link.length > 5) {
          items.push({
            title,
            summary: summary || title,
            content: fullContent || summary || title,
            link,
            image,
            category,
            source: sourceName,
            pubDate,
            createdAt: new Date().toISOString(),
            readTimeMinutes: Math.max(2, Math.ceil(fullContent.split(' ').length / 150)),
          });
        }
      }
    }

    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return [];
  }
}

export async function syncAllHealthRssFeeds() {
  const { db } = await connectToDatabase();
  const newsCollection = db.collection('haberler');
  const sourcesCollection = db.collection('rss_sources');

  let sources = await sourcesCollection.find({ isActive: true }).toArray();

  if (sources.length === 0) {
    await sourcesCollection.insertMany(DEFAULT_HEALTH_RSS_SOURCES as any);
    sources = DEFAULT_HEALTH_RSS_SOURCES as any[];
  }

  let totalNewCount = 0;

  for (const source of sources) {
    const fetchedItems = await fetchRssFeed(source.url, source.name, source.category);

    for (const item of fetchedItems) {
      if (!item.title || !item.link) continue;

      const existing = await newsCollection.findOne({ link: item.link });
      if (!existing) {
        const { _id, id, ...cleanItem } = item;
        await newsCollection.insertOne({
          ...cleanItem,
          isFeatured: totalNewCount === 0,
          isBreaking: totalNewCount < 2,
          viewCount: Math.floor(Math.random() * 120) + 15,
        } as any);
        totalNewCount++;
      }
    }

    await sourcesCollection.updateOne(
      { url: source.url },
      { $set: { lastFetched: new Date().toISOString() } }
    );
  }

  return totalNewCount;
}
