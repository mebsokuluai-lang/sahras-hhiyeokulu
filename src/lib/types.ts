export interface NewsItem {
  _id?: string;
  id?: string;
  title: string;
  summary?: string;
  content?: string;
  link: string;
  image?: string;
  category: string; // e.g. "Tıp", "Hemşirelik", "Halk Sağlığı", "Beslenme", "İlaç & Eczacılık", "Acil Durum"
  source: string;
  pubDate: string;
  createdAt?: string;
  isFeatured?: boolean;
  isBreaking?: boolean;
  aiSummary?: string[]; // 3 bullet points summary by Gemini AI
  audioUrl?: string;
  readTimeMinutes?: number;
  viewCount?: number;
  medicalTerms?: { term: string; definition: string }[];
}

export interface RssSource {
  _id?: string;
  name: string;
  url: string;
  category: string;
  isActive: boolean;
  lastFetched?: string;
}

export interface HealthTerm {
  term: string;
  definition: string;
  category: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
