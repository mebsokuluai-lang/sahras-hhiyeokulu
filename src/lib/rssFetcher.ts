import { connectToDatabase } from './mongodb';
import { NewsItem, RssSource } from './types';

export const DEFAULT_HEALTH_RSS_SOURCES: RssSource[] = [
  {
    name: 'Medimagazin Sağlık',
    url: 'https://www.medimagazin.com.tr/rss',
    category: 'Tıp & Klinik',
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

function sanitizeHtmlText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractImageUrl(itemXml: string): string | null {
  // 1. media:content or media:thumbnail url
  const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch && mediaMatch[1]) return mediaMatch[1].trim();

  // 2. enclosure url with image mime type
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch && enclosureMatch[1]) return enclosureMatch[1].trim();

  // 3. img src tag inside description or content
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) return imgMatch[1].trim();

  return null;
}

export async function fetchRssFeed(url: string, sourceName: string, category: string): Promise<Partial<NewsItem>[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) return [];

    const xmlText = await response.text();
    const items: Partial<NewsItem>[] = [];

    // Match each <item> block in the XML
    const itemRegex = /<item[\s\S]*?>([\s\S]*?)<\/item>/gi;
    let match;

    const defaultImages = [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?w=800&auto=format&fit=crop&q=80'
    ];

    let imgIndex = 0;

    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 20) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const contentEncodedMatch = itemXml.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
      const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);

      if (titleMatch && linkMatch) {
        const title = sanitizeHtmlText(titleMatch[1]);
        const fullContent = sanitizeHtmlText(contentEncodedMatch ? contentEncodedMatch[1] : (descMatch ? descMatch[1] : ''));
        const link = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim();
        const extractedImg = extractImageUrl(itemXml);
        const image = extractedImg || defaultImages[imgIndex % defaultImages.length];
        imgIndex++;

        let pubDate = new Date().toISOString();
        if (pubDateMatch && pubDateMatch[1]) {
          try {
            pubDate = new Date(pubDateMatch[1].trim()).toISOString();
          } catch {
            pubDate = new Date().toISOString();
          }
        }

        const summary = fullContent.length > 280
          ? fullContent.substring(0, 280).replace(/\s\S*$/, '') + '...'
          : fullContent;

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
