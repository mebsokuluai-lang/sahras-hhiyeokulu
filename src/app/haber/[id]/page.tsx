'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, Eye, Sparkles, Volume2, ExternalLink, ArrowLeft, CheckCircle2, Cross, AlertCircle, Share2, BookOpen } from 'lucide-react';
import { NewsItem } from '@/lib/types';
import GlossaryTooltip from '@/components/GlossaryTooltip';
import AudioPlayer from '@/components/AudioPlayer';

export default function SingleNewsPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const fetchSingleNews = async () => {
      setLoading(true);
      setNotFoundState(false);

      try {
        // 1. Try dedicated single news API endpoint
        const res = await fetch(`/api/news/${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.news && isMounted) {
            setNewsItem(data.news);
            if (data.news.aiSummary && Array.isArray(data.news.aiSummary)) {
              setAiSummary(data.news.aiSummary);
            }
            setLoading(false);
            return;
          }
        }

        // 2. Fallback: Search all news list
        const fallbackRes = await fetch('/api/news');
        if (fallbackRes.ok) {
          const allData = await fallbackRes.json();
          if (allData.news && Array.isArray(allData.news)) {
            const decodedId = decodeURIComponent(id);
            const found = allData.news.find(
              (n: any) =>
                n._id === id ||
                n.id === id ||
                n.link === id ||
                n.link === decodedId ||
                n.title === decodedId ||
                encodeURIComponent(n.title) === id
            );

            if (found && isMounted) {
              setNewsItem(found);
              if (found.aiSummary && Array.isArray(found.aiSummary)) {
                setAiSummary(found.aiSummary);
              }
              setLoading(false);
              return;
            }
          }
        }

        if (isMounted) {
          setNotFoundState(true);
        }
      } catch (err) {
        console.error('Haber yüklenirken hata oluştu:', err);
        if (isMounted) setNotFoundState(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSingleNews();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleFetchAiSummary = async () => {
    if (!newsItem) return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsItem.title,
          content: newsItem.content || newsItem.summary || newsItem.title,
        }),
      });
      const data = await res.json();
      if (data.summary && Array.isArray(data.summary)) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error('AI özetleme hatası:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6 animate-pulse bg-slate-50">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4" />
        <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
        <div className="h-72 bg-slate-200 rounded-3xl" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (notFoundState || !newsItem) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 bg-slate-50">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-medical-red flex items-center justify-center mx-auto border border-red-200 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Aradığınız Haber Bulunamadı</h2>
          <p className="text-sm text-slate-600 font-medium max-w-md mx-auto">
            İlgili haber silinmiş, taşınmış veya henüz senkronize edilmemiş olabilir. Ana sayfadaki güncel akıştan diğer sağlık haberlerine göz atabilirsiniz.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="px-6 py-3 bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-2 shadow-md shadow-medical-600/20 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya ve Haber Akışına Dön</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50">
      
      {/* Breadcrumbs & Back Button */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-medical-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Haberlere Dön</span>
        </Link>

        <span className="hidden sm:inline-block text-slate-400">
          Ana Sayfa &gt; {newsItem.category || 'Sağlık'} &gt; Detay
        </span>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="bg-medical-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
            {newsItem.category || 'Sahra Sıhhiye'}
          </span>
          <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            Kaynak: {newsItem.source || 'Resmi Sağlık Akışı'}
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
              <span>{newsItem.viewCount || 65} görüntülenme</span>
            </span>
            <span>•</span>
            <span className="font-medium">
              {newsItem.pubDate ? new Date(newsItem.pubDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Güncel'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlayingAudio(true)}
              className="px-3.5 py-1.5 rounded-xl bg-medical-50 border border-medical-200 text-medical-700 hover:bg-medical-600 hover:text-white transition text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <Volume2 className="w-4 h-4" />
              <span>Sesli Dinle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Image */}
      {newsItem.image && (
        <div className="relative w-full h-[320px] md:h-[440px] rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
          <Image
            src={newsItem.image}
            alt={newsItem.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}

      {/* Sahra AI 3-Maddelik Özet Kartı */}
      <div className="bg-white border border-medical-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-medical-700 font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-medical-600" />
            <span>🤖 SAHRA AI TIBBİ ÖZETİ (3 MADDE)</span>
          </div>

          {!aiSummary && (
            <button
              onClick={handleFetchAiSummary}
              disabled={loadingAi}
              className="px-4 py-1.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {loadingAi ? 'AI Özeti Hazırlanıyor...' : 'AI Özeti Oluştur'}
            </button>
          )}
        </div>

        {aiSummary ? (
          <ul className="space-y-3 text-xs md:text-sm text-slate-800 font-medium">
            {aiSummary.map((pt, idx) => (
              <li key={idx} className="flex items-start space-x-3 bg-medical-50/60 p-3 rounded-2xl border border-medical-100">
                <CheckCircle2 className="w-4 h-4 text-medical-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Yapay zeka motorumuz (OpenRouter / Gemini) ile bu haberin 3 maddelik sadeleştirilmiş hekim analizini hemen oluşturabilirsiniz.
          </p>
        )}
      </div>

      {/* Full Content Body */}
      <div className="bg-white border border-slate-200 p-6 md:p-10 rounded-3xl space-y-6 shadow-sm leading-relaxed text-sm md:text-base text-slate-800">
        
        {newsItem.summary && newsItem.summary !== newsItem.content && (
          <p className="font-bold text-medical-900 text-base md:text-lg border-l-4 border-medical-600 pl-4 py-1 bg-medical-50/30 rounded-r-xl">
            {newsItem.summary}
          </p>
        )}

        <div className="space-y-4 text-slate-700 leading-loose">
          <p>
            {newsItem.content || newsItem.summary || newsItem.title}
          </p>
          <p className="text-xs text-slate-500 font-medium pt-2">
            İlgili sıhhiye terimlerinin açıklaması için üzerine geliniz:{' '}
            <GlossaryTooltip term="Turnike">Turnike (TCCC)</GlossaryTooltip>,{' '}
            <GlossaryTooltip term="Miyokard İnfarktüsü">Miyokard İnfarktüsü</GlossaryTooltip> veya{' '}
            <GlossaryTooltip term="Epidemiyoloji">Epidemiyoloji</GlossaryTooltip>.
          </p>
        </div>

        {/* Link to External Press Source */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
          <span className="text-slate-500 font-medium">
            Yayıncı Kaynağı: <strong className="text-slate-900">{newsItem.source}</strong>
          </span>
          
          {newsItem.link && (
            <a
              href={newsItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-medical-700 font-bold flex items-center space-x-1.5 transition border border-slate-200 shadow-sm"
            >
              <span>Orijinal Kaynak Sitesine Git</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

      </div>

      {/* Audio Player Drawer */}
      {isPlayingAudio && (
        <AudioPlayer
          title={newsItem.title}
          textToSpeak={`${newsItem.title}. ${newsItem.summary || newsItem.content || ''}`}
          onClose={() => setIsPlayingAudio(false)}
        />
      )}

    </div>
  );
}
