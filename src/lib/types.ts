export interface NewsItem {
  _id?: string;
  id?: string;
  title: string;
  title_turkish?: string;
  title_english?: string;
  summary?: string;
  summary_turkish?: string;
  content?: string;
  content_turkish?: string;
  content_english?: string;
  link: string;
  image?: string;
  category: string;
  source: string;
  pubDate: string;
  date_turkish?: string;
  date_english?: string;
  createdAt?: string;
  interest_score?: number;
  interestScore?: number;
  gonderildi?: boolean;
  tags?: string[];
  isFeatured?: boolean;
  isBreaking?: boolean;
  aiSummary?: string[];
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
