'use client';

import React, { useState, useEffect } from 'react';
import BreakingNewsBar from '@/components/BreakingNewsBar';
import HeroSlider from '@/components/HeroSlider';
import CategoryTabs from '@/components/CategoryTabs';
import NewsCard from '@/components/NewsCard';
import AudioPlayer from '@/components/AudioPlayer';
import GlossaryTooltip from '@/components/GlossaryTooltip';
import { NewsItem } from '@/lib/types';
import { RefreshCw, Search, Sparkles, ShieldAlert, HeartPulse, Stethoscope, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('hepsi');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Audio player state
  const [activeAudioItem, setActiveAudioItem] = useState<NewsItem | null>(null);

  const fetchNews = async (category = 'hepsi', search = '') => {
    setLoading(true);
    try {
      let url = `/api/news?category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.news) {
        setNews(data.news);
      }
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory, searchQuery);
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(selectedCategory, searchQuery);
  };

  const handleSyncRss = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/rss/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchNews(selectedCategory, searchQuery);
      }
    } catch (err) {
      console.error('RSS sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const breakingNews = news.filter(n => n.isBreaking || n.isFeatured);
  const heroNews = news.slice(0, 3);
  const gridNews = news;

  return (
    <div className="space-y-8 pb-16 bg-slate-50 min-h-screen">
      
      {/* Breaking News Ticker */}
      <BreakingNewsBar news={breakingNews.length > 0 ? breakingNews : news.slice(0, 4)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Hero Headline Slider */}
        {heroNews.length > 0 && <HeroSlider newsList={heroNews} />}

        {/* 3 Quick Module Banners on Clean White Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/ilk-yardim" className="group bg-white border border-slate-200 hover:border-medical-red p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-medical-red flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-red-100 shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-medical-red transition-colors flex items-center space-x-1">
                <span>Sahra & Acil İlk Yardım</span>
                <ArrowRight className="w-4 h-4 text-medical-red opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Taktik turnike, CPR, Heimlich, Yanık ve Zehirlenme</p>
            </div>
          </Link>

          <Link href="/hesaplayicilar" className="group bg-white border border-slate-200 hover:border-medical-600 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-medical-100 shadow-sm">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-medical-600 transition-colors flex items-center space-x-1">
                <span>Tıbbi Hesaplayıcılar</span>
                <ArrowRight className="w-4 h-4 text-medical-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">VKİ (Beden kitle), Günlük Su ve Kalori İhtiyacı</p>
            </div>
          </Link>

          <Link href="/nobetci-eczaneler" className="group bg-white border border-slate-200 hover:border-amber-500 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-amber-100 shadow-sm">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-amber-600 transition-colors flex items-center space-x-1">
                <span>Nöbetçi Eczaneler</span>
                <ArrowRight className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">İl ve ilçe bazlı anlık Nöbetçi Eczane haritası</p>
            </div>
          </Link>

        </div>

        {/* AI Medical Term Glossary Demo Box */}
        <div className="bg-white border border-medical-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center shrink-0 border border-medical-200 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-black text-medical-600 uppercase tracking-wider block">
                SAHRA SIHHİYE • YAPAY ZEKA TIBBİ SÖZLÜK
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Makalelerde geçen tıbbi kavramların üzerine gelin: Örn:{' '}
                <GlossaryTooltip term="Turnike">Turnike</GlossaryTooltip>,{' '}
                <GlossaryTooltip term="Miyokard İnfarktüsü">Miyokard İnfarktüsü</GlossaryTooltip> ve{' '}
                <GlossaryTooltip term="Farmakoloji">Farmakoloji</GlossaryTooltip>.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncRss}
            disabled={syncing}
            className="px-5 py-3 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs transition flex items-center space-x-2 shrink-0 disabled:opacity-50 shadow-md shadow-medical-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'RSS Çekiliyor...' : 'RSS Kaynaklarını Güncelle'}</span>
          </button>
        </div>

        {/* Search & Category Filter Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 shrink-0">
              <input
                type="text"
                placeholder="Sağlık haberlerinde ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-medical-600 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none transition shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>
          </div>
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-white rounded-3xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : gridNews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700">Henüz Bu Kategoride Haber Bulunmuyor</h3>
            <p className="text-xs text-slate-500">RSS Kaynaklarını Güncelle butonuna basarak yeni haberleri çekebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridNews.map(item => (
              <NewsCard
                key={item._id || item.link}
                news={item}
                onPlayAudio={selectedNews => setActiveAudioItem(selectedNews)}
              />
            ))}
          </div>
        )}

      </div>

      {/* Floating Audio Player */}
      {activeAudioItem && (
        <AudioPlayer
          title={activeAudioItem.title}
          textToSpeak={`${activeAudioItem.title}. ${activeAudioItem.summary || activeAudioItem.content}`}
          onClose={() => setActiveAudioItem(null)}
        />
      )}

    </div>
  );
}
