'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, Eye, Sparkles, Volume2, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { NewsItem } from '@/lib/types';
import GlossaryTooltip from '@/components/GlossaryTooltip';
import AudioPlayer from '@/components/AudioPlayer';

export default function SingleNewsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchSingleNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news`);
        const data = await res.json();
        if (data.news) {
          const item = data.news.find((n: any) => n._id === id || n.id === id || encodeURIComponent(n.title) === id);
          if (item) {
            setNewsItem(item);
            if (item.aiSummary) setAiSummary(item.aiSummary);
          }
        }
      } catch (err) {
        console.error('Failed to fetch single news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSingleNews();
  }, [id]);

  const handleFetchAiSummary = async () => {
    if (!newsItem) return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newsItem.title, content: newsItem.content || newsItem.summary }),
      });
      const data = await res.json();
      if (data.summary) setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse bg-slate-50">
        <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-900">Haber Bulunamadı</h2>
        <p className="text-xs text-slate-500">İstenen haber mevcut değil veya silinmiş olabilir.</p>
        <Link href="/" className="px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs rounded-xl inline-block shadow-sm">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50">
      
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-medical-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Tüm Haberlere Dön</span>
      </Link>

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="bg-medical-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
            {newsItem.category || 'Sahra Sıhhiye'}
          </span>
          <span className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            Kaynak: {newsItem.source}
          </span>
        </div>

        <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
          {newsItem.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-4 gap-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 font-medium">
              <Clock className="w-4 h-4 text-medical-600" />
              <span>{newsItem.readTimeMinutes || 3} dk okuma</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 font-medium">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>{newsItem.viewCount || 85} görüntülenme</span>
            </span>
            <span>•</span>
            <span className="font-medium">{new Date(newsItem.pubDate).toLocaleDateString('tr-TR')}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlayingAudio(true)}
              className="px-3.5 py-1.5 rounded-xl bg-medical-50 border border-medical-200 text-medical-700 hover:bg-medical-600 hover:text-white transition text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <Volume2 className="w-4 h-4" />
              <span>Sesli Dinle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Image */}
      {newsItem.image && (
        <div className="relative w-full h-[320px] md:h-[420px] rounded-3xl overflow-hidden shadow-md border border-slate-200">
          <Image
            src={newsItem.image}
            alt={newsItem.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* Gemini / OpenRouter AI Summary Box */}
      <div className="bg-white border border-medical-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-medical-700 font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-medical-600" />
            <span>YAPAY ZEKA 3 MADDEDE HABER ÖZETİ</span>
          </div>

          {!aiSummary && (
            <button
              onClick={handleFetchAiSummary}
              disabled={loadingAi}
              className="px-3.5 py-1.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs transition shadow-sm"
            >
              {loadingAi ? 'AI Hazırlıyor...' : 'AI Özeti Oluştur'}
            </button>
          )}
        </div>

        {aiSummary ? (
          <ul className="space-y-2 text-xs md:text-sm text-slate-800 font-medium">
            {aiSummary.map((pt, idx) => (
              <li key={idx} className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-medical-600 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Yapay Zeka servisi ile bu haberin 3 maddelik tıbbi analizi ve özeti anında hazırlanabilir.
          </p>
        )}
      </div>

      {/* Full Content Body */}
      <div className="bg-white border border-slate-200 p-6 md:p-10 rounded-3xl space-y-6 shadow-sm leading-relaxed text-sm md:text-base text-slate-800">
        
        <p className="font-bold text-medical-900 text-base md:text-lg border-l-4 border-medical-600 pl-4 py-1">
          {newsItem.summary}
        </p>

        <div className="space-y-4 text-slate-700 leading-loose">
          <p>
            {newsItem.content || newsItem.summary}
          </p>
          <p className="text-xs text-slate-500 font-medium pt-2">
            Tıbbi kavram açıklamaları için üzerine geliniz:{' '}
            <GlossaryTooltip term="Turnike">Turnike</GlossaryTooltip>,{' '}
            <GlossaryTooltip term="Miyokard İnfarktüsü">Miyokard İnfarktüsü</GlossaryTooltip> veya{' '}
            <GlossaryTooltip term="Epidemiyoloji">Epidemiyoloji</GlossaryTooltip>.
          </p>
        </div>

        {/* Link to External Press Source */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Yayıncı Kaynağı: <strong className="text-slate-900">{newsItem.source}</strong></span>
          
          <a
            href={newsItem.link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-medical-700 font-bold flex items-center space-x-1.5 transition border border-slate-200"
          >
            <span>Orijinal Kaynağa Git</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* Audio Player Drawer */}
      {isPlayingAudio && (
        <AudioPlayer
          title={newsItem.title}
          textToSpeak={`${newsItem.title}. ${newsItem.summary || newsItem.content}`}
          onClose={() => setIsPlayingAudio(false)}
        />
      )}

    </div>
  );
}
