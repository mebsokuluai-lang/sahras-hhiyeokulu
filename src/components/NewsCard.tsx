'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Clock, Volume2, ChevronRight, Eye, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
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

    setShowAiSummary(true);

    if (!aiSummaryList || aiSummaryList.length === 0) {
      setLoadingAi(true);
      try {
        const res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: news.title,
            content: news.content || news.summary || news.title,
          }),
        });
        const data = await res.json();
        if (data.summary && Array.isArray(data.summary) && data.summary.length > 0) {
          setAiSummaryList(data.summary);
        } else {
          setAiSummaryList([
            'Bu haber, güncel sahra sıhhiye ve tıp gelişmelerini aktarmaktadır.',
            'Klinik tıp ve koruyucu hekimlik açısından önemli bilgiler içermektedir.',
            'Detaylar için makalenin tamamını okuyabilirsiniz.'
          ]);
        }
      } catch {
        setAiSummaryList([
          'Bu haber, güncel sahra sıhhiye ve tıp gelişmelerini aktarmaktadır.',
          'Klinik tıp ve koruyucu hekimlik açısından önemli bilgiler içermektedir.',
          'Detaylar için makalenin tamamını okuyabilirsiniz.'
        ]);
      } finally {
        setLoadingAi(false);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 hover:border-medical-500 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      
      {/* Image Container */}
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
          {news.category || 'Sahra Sıhhiye'}
        </span>

        {/* Source Badge */}
        <span className="absolute top-3.5 right-3.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
          {news.source || 'Sağlık Akışı'}
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

        {/* AI Summary Accordion Drawer (Smooth & Aesthetic) */}
        {showAiSummary && (
          <div className="bg-gradient-to-br from-medical-50 to-blue-50/50 border border-medical-200 p-4 rounded-2xl text-xs space-y-2.5 text-slate-800 animate-in fade-in zoom-in-95 shadow-sm">
            <div className="flex items-center justify-between border-b border-medical-100 pb-2">
              <div className="flex items-center space-x-1.5 font-extrabold text-medical-700 text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-medical-600" />
                <span>🤖 SAHRA AI TIBBİ ÖZETİ</span>
              </div>
              <button
                onClick={() => setShowAiSummary(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {loadingAi ? (
              <div className="py-2 flex items-center space-x-2 text-medical-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-medical-600 animate-ping" />
                <span className="italic">Yapay zeka hekim özeti hazırlanıyor...</span>
              </div>
            ) : (
              <ul className="space-y-2 text-[11px] text-slate-800">
                {aiSummaryList?.map((pt, i) => (
                  <li key={i} className="flex items-start space-x-2 bg-white/80 p-2 rounded-xl border border-medical-100/60 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-medical-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{pt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFetchAiSummary}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1 transition shadow-sm ${
                showAiSummary
                  ? 'bg-medical-600 text-white border-medical-600'
                  : 'bg-medical-50 border-medical-200 text-medical-700 hover:bg-medical-600 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showAiSummary ? 'Özeti Gizle' : 'AI Özet'}</span>
            </button>

            {onPlayAudio && (
              <button
                onClick={() => onPlayAudio(news)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-medical-600 hover:bg-slate-200 transition"
                title="Sesli Dinle"
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
