'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Clock, Volume2, ChevronRight, Eye } from 'lucide-react';
import { NewsItem } from '@/lib/types';

interface NewsCardProps {
  news: NewsItem;
  onPlayAudio?: (item: NewsItem) => void;
}

export default function NewsCard({ news, onPlayAudio }: NewsCardProps) {
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummaryList, setAiSummaryList] = useState<string[] | null>(news.aiSummary || null);
  const [loadingAi, setLoadingAi] = useState(false);

  const internalHref = `/haber/${news._id || news.id || encodeURIComponent(news.title)}`;

  const handleFetchAiSummary = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (showAiSummary) {
      setShowAiSummary(false);
      return;
    }

    if (!aiSummaryList) {
      setLoadingAi(true);
      try {
        const res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: news.title, content: news.summary || news.content }),
        });
        const data = await res.json();
        setAiSummaryList(data.summary || ['Özet oluşturulamadı.']);
      } catch {
        setAiSummaryList(['AI özet servisi hazır.']);
      } finally {
        setLoadingAi(false);
      }
    }
    setShowAiSummary(true);
  };

  return (
    <div className="bg-white border border-slate-200 hover:border-medical-500 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      
      {/* Image container */}
      <Link href={internalHref} className="relative h-48 w-full overflow-hidden bg-slate-100 block">
        <Image
          src={news.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80'}
          alt={news.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Category Badge */}
        <span className="absolute top-3.5 left-3.5 bg-medical-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
          {news.category || 'Sağlık'}
        </span>

        {/* Source Badge */}
        <span className="absolute top-3.5 right-3.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
          {news.source}
        </span>
      </Link>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          
          <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-medical-600" />
              <span>{news.readTimeMinutes || 3} dk okuma</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{news.viewCount || 45} görüntülenme</span>
            </span>
          </div>

          <Link href={internalHref} className="block">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-medical-600 transition-colors line-clamp-2 leading-snug">
              {news.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {news.summary || news.content}
          </p>
        </div>

        {/* AI Summary Accordion Drawer */}
        {showAiSummary && (
          <div className="bg-medical-50/70 border border-medical-200 p-4 rounded-2xl text-xs space-y-2 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-1.5 font-bold text-medical-700 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-medical-600" />
              <span>Yapay Zeka 3 Maddede Haber Özeti</span>
            </div>
            {loadingAi ? (
              <p className="text-slate-500 italic animate-pulse">Yapay zeka özeti hazırlanıyor...</p>
            ) : (
              <ul className="space-y-1.5 text-[11px] pl-2 list-disc list-inside text-slate-700">
                {aiSummaryList?.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFetchAiSummary}
              className="px-3 py-1.5 rounded-xl bg-medical-50 border border-medical-200 text-medical-700 hover:bg-medical-600 hover:text-white transition text-xs font-bold flex items-center space-x-1 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Özet</span>
            </button>

            {onPlayAudio && (
              <button
                onClick={() => onPlayAudio(news)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-medical-600 hover:bg-slate-200 transition"
                title="Sesli Okut"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <Link
            href={internalHref}
            className="text-xs font-bold text-medical-600 hover:text-medical-700 flex items-center space-x-1 group/btn"
          >
            <span>Haberi Oku</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>

    </div>
  );
}
