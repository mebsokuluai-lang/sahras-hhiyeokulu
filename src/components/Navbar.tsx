'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cross, ShieldAlert, HeartPulse, Calculator, MapPin, BrainCircuit, UserCheck, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Emblem */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-medical-700 via-medical-600 to-medical-500 p-2 flex items-center justify-center shadow-md shadow-medical-600/30 group-hover:scale-105 transition-all">
              <Cross className="w-7 h-7 text-white fill-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  SAHRA SIHHİYE OKULU
                </span>
                <span className="bg-medical-red text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                  SIHHİYE
                </span>
              </div>
              <span className="block text-[11px] font-bold text-medical-600 tracking-wider uppercase">
                Askeri & Sivil Sağlık, Tıp ve Haber Portalı
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 font-semibold text-sm">
            <Link href="/" className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-medical-600 transition-colors flex items-center space-x-1.5">
              <HeartPulse className="w-4 h-4 text-medical-600" />
              <span>Haberler</span>
            </Link>
            
            <Link href="/ilk-yardim" className="px-3.5 py-2 rounded-xl hover:bg-red-50 text-slate-700 hover:text-medical-red transition-colors flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-medical-red animate-pulse" />
              <span>Sahra & İlk Yardım</span>
            </Link>

            <Link href="/hesaplayicilar" className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-medical-600 transition-colors flex items-center space-x-1.5">
              <Calculator className="w-4 h-4 text-medical-600" />
              <span>Tıbbi Hesaplayıcı</span>
            </Link>

            <Link href="/nobetci-eczaneler" className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-amber-600 transition-colors flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Nöbetçi Eczane</span>
            </Link>

            <Link href="/quiz" className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-cyan-600 transition-colors flex items-center space-x-1.5">
              <BrainCircuit className="w-4 h-4 text-cyan-600" />
              <span>Sıhhiye Quizi</span>
            </Link>
          </nav>

          {/* Action Buttons & Admin */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/admin"
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-medical-600 hover:bg-medical-700 text-white shadow-md shadow-medical-600/20 transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Yönetim Paneli</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:text-medical-600 focus:outline-none border border-slate-200"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 text-sm font-medium shadow-xl">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-slate-100 hover:text-medical-600"
          >
            📰 Sağlık Haberleri & Akış
          </Link>
          <Link
            href="/ilk-yardim"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-medical-red font-bold hover:bg-red-50"
          >
            🚑 Sahra & Acil İlk Yardım Rehberi
          </Link>
          <Link
            href="/hesaplayicilar"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-slate-100"
          >
            📊 Tıbbi Hesaplayıcılar (VKİ, Su, BMH)
          </Link>
          <Link
            href="/nobetci-eczaneler"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-slate-100"
          >
            💊 Canlı Nöbetçi Eczaneler
          </Link>
          <Link
            href="/quiz"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-slate-800 hover:bg-slate-100"
          >
            💡 Günün Sıhhiye Bilgisi & Quiz
          </Link>
          <Link
            href="/admin"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-white font-bold bg-medical-600 shadow-md text-center"
          >
            🔒 Yönetici Paneli
          </Link>
        </div>
      )}
    </header>
  );
}
