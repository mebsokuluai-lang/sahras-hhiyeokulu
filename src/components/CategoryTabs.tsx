'use client';

import React from 'react';
import { Activity, Stethoscope, ShieldAlert, HeartPulse, Pill, Apple, Cross } from 'lucide-react';

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

const CATEGORIES = [
  { id: 'hepsi', label: 'Tüm Haberler & Akış', icon: Activity },
  { id: 'Sahra & Askeri', label: 'Sahra & Askeri Sağlık', icon: Cross },
  { id: 'Tıp & Klinik', label: 'Tıp & Klinik Haberler', icon: Stethoscope },
  { id: 'İlk Yardım', label: 'İlk Yardım & TCCC', icon: ShieldAlert },
  { id: 'Halk Sağlığı', label: 'Halk Sağlığı & Aşı', icon: HeartPulse },
  { id: 'Eczacılık', label: 'İlaç & Eczacılık', icon: Pill },
];

export default function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const isActive = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 shrink-0 ${
              isActive
                ? 'bg-medical-600 text-white shadow-lg shadow-medical-600/30 scale-105 border border-white/20'
                : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-medical-500/50 hover:text-white'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-medical-400'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
