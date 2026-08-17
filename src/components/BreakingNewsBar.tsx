'use client';

import React from 'react';
import { AlertCircle, Flame } from 'lucide-react';
import Link from 'next/link';

interface BreakingNewsProps {
  news: { title: string; link?: string; _id?: string; id?: string }[];
}

export default function BreakingNewsBar({ news }: BreakingNewsProps) {
  if (!news || news.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white text-xs font-semibold py-2.5 px-4 border-b border-red-500/30 flex items-center overflow-hidden shadow-inner">
      <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-md text-slate-950 font-black uppercase tracking-wider shrink-0 mr-4 shadow-md">
        <Flame className="w-4 h-4 text-white animate-bounce" />
        <span className="text-white">SON DAKİKA SAĞLIK</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap w-full">
        <div className="inline-flex space-x-8 animate-marquee">
          {news.concat(news).map((item, idx) => {
            const internalHref = `/haber/${item._id || item.id || encodeURIComponent(item.title)}`;
            return (
              <Link
                key={idx}
                href={internalHref}
                className="hover:text-red-400 transition-colors inline-flex items-center space-x-2"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
