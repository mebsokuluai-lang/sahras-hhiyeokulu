'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Flame, Cross } from 'lucide-react';
import { NewsItem } from '@/lib/types';

interface HeroSliderProps {
  newsList: NewsItem[];
}

export default function HeroSlider({ newsList }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (newsList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % newsList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [newsList.length]);

  if (!newsList || newsList.length === 0) return null;

  const current = newsList[currentIndex];
  const internalHref = `/haber/${current._id || current.id || encodeURIComponent(current.title)}`;

  return (
    <div className="relative w-full h-[400px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-medical-500/30 group">
      
      {/* Background Image */}
      <Image
        src={current.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80'}
        alt={current.title}
        fill
        priority
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/20" />

      {/* Content Container */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-4xl space-y-3">
        <div className="flex items-center space-x-3">
          <span className="bg-medical-red text-white font-black text-xs uppercase px-3 py-1 rounded-md shadow-md flex items-center space-x-1.5 border border-white/20">
            <Flame className="w-3.5 h-3.5" />
            <span>ÖNE ÇIKAN SAĞLIK MANŞETİ</span>
          </span>
          <span className="bg-medical-600/40 text-medical-200 font-bold text-xs px-3 py-1 rounded-md border border-medical-500/40 backdrop-blur-sm">
            {current.category || 'Sahra & Genel Tıp'}
          </span>
        </div>

        <Link href={internalHref} className="block">
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-md hover:text-medical-300 transition-colors">
            {current.title}
          </h1>
        </Link>

        <p className="text-xs md:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-3xl">
          {current.summary || current.content}
        </p>

        <div className="pt-2 flex items-center space-x-4">
          <Link
            href={internalHref}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-medical-600 to-medical-500 hover:from-medical-500 hover:to-medical-400 text-white font-black text-xs shadow-lg shadow-medical-600/40 transition-transform active:scale-95 flex items-center space-x-2 border border-white/10"
          >
            <span>Detaylı Haberi Oku</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Controls */}
      {newsList.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => (prev - 1 + newsList.length) % newsList.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-medical-600 transition opacity-0 group-hover:opacity-100 border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentIndex(prev => (prev + 1) % newsList.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-medical-600 transition opacity-0 group-hover:opacity-100 border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute top-4 right-4 flex space-x-1.5">
            {newsList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-8 bg-medical-400' : 'bg-slate-600/80'
                }`}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}
