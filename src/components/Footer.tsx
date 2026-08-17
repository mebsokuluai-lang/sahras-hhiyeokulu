import React from 'react';
import Link from 'next/link';
import { Cross, Heart, Shield, PhoneCall, Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-medical-900/60 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-medical-600 flex items-center justify-center text-white font-bold shadow-md shadow-medical-600/30">
                <Cross className="w-6 h-6 fill-white text-white" />
              </div>
              <div>
                <span className="text-lg font-black text-white block">SAHRA SIHHİYE OKULU</span>
                <span className="text-[10px] text-medical-400 font-bold uppercase tracking-wider">Dijital Sağlık & Tıp Portalı</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yapay zeka destekli, güncel tıp haberleri, taktik sahra ilk yardım rehberleri, nöbetçi eczane ve tıbbi hesaplayıcı uygulamaları.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-medical-500 pl-2">
              Hızlı Erişim
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-medical-400 transition">Son Sağlık Haberleri</Link></li>
              <li><Link href="/ilk-yardim" className="hover:text-red-400 transition">Sahra & Acil İlk Yardım</Link></li>
              <li><Link href="/hesaplayicilar" className="hover:text-medical-400 transition">Tıbbi Hesaplayıcılar (VKİ, Su, BMH)</Link></li>
              <li><Link href="/nobetci-eczaneler" className="hover:text-amber-400 transition">Canlı Nöbetçi Eczaneler</Link></li>
              <li><Link href="/quiz" className="hover:text-cyan-400 transition">Sıhhiye Bilgisi & Quiz</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-medical-500 pl-2">
              Tıbbi Kategoriler
            </h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-medical-400 transition cursor-pointer">Sahra & Askeri Tıp</span></li>
              <li><span className="hover:text-medical-400 transition cursor-pointer">Klinik & Tıp Haberleri</span></li>
              <li><span className="hover:text-medical-400 transition cursor-pointer">Halk Sağlığı & Aşı</span></li>
              <li><span className="hover:text-medical-400 transition cursor-pointer">İlk Yardım & TCCC</span></li>
              <li><span className="hover:text-medical-400 transition cursor-pointer">İlaç & Eczacılık</span></li>
            </ul>
          </div>

          {/* Emergency Disclaimer */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-medical-red/30 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-red-400 font-bold">
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>ACİL SIHHİYE ÇAĞRI</span>
            </div>
            <p className="text-slate-300">
              Acil tıbbi müdahale ve hayati tehlike durumlarında derhal <strong className="text-red-400 text-sm">112 Acil Çağrı Merkezi</strong>&apos;ni arayınız.
            </p>
            <p className="text-[11px] text-slate-500">
              Sitedeki bilgiler eğitim ve genel bilgilendirme amaçlı olup hekim muayenesi yerine geçmez.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Sahra Sıhhiye Okulu. Tüm Hakları Saklıdır.</p>
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Özenle Hazırlandı • Sahra Sıhhiye Portalı</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
