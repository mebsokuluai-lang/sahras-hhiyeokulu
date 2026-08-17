'use client';

import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, ChevronRight, CheckCircle2, Cross, AlertTriangle } from 'lucide-react';

interface FirstAidGuide {
  id: string;
  title: string;
  category: string;
  dangerLevel: 'KRİTİK' | 'YÜKSEK' | 'ORTA';
  steps: string[];
  doNot: string[];
}

const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'turnike',
    title: 'Taktik Turnike Uygulaması & Ağır Kanama Kontrolü (TCCC)',
    category: 'Sahra & Askeri İlk Yardım',
    dangerLevel: 'KRİTİK',
    steps: [
      'Kanayan uzvun (kol veya bacak) yara bölgesinin 5-7 cm yukarısına turnikeyi yerleştirin (Asla eklem üzerine takmayın).',
      'Turnike bandını olabildiğince sıkın ve cırt cırtını sabitleyin.',
      'Sıkıştırma çubuğunu (rüzgarlık/windlass) kanama tamamen durana ve nabız kaybolana kadar çevirin.',
      'Çubuğu kilitleyin ve turnikenin üzerine takıldığı saati (Örn: 14:30) mutlaka yazın.',
      'Yaralıyı sıcak tutun ve derhal 112 / Sıhhi Tahliye ekibini bilgilendirin.',
    ],
    doNot: [
      'Turnikeyi kesinlikle gevşetip tekrar sıkmayın (Tromboz ve ani kan kaybı riski).',
      'Turnikenin üzerini giysi veya battaniye ile örtmeyin (Sağlık ekipleri tarafından hemen görülmelidir).',
      'İnce tel, ip veya dar bağcık gibi cildi kesebilecek malzemeleri turnike olarak kullanmayın.',
    ],
  },
  {
    id: 'cpr',
    title: 'Kalp Masajı (CPR) & Suni Solunum',
    category: 'Solunum & Dolaşım Durması',
    dangerLevel: 'KRİTİK',
    steps: [
      'Yaralının bilincini ve solunumunu kontrol edin (Bak-Dinle-Hisset, maksimum 10 sn).',
      'Solunum yoksa derhal 112 Acil Servisi arayın veya yanınızdakilere aratın.',
      'Hastayı sert ve düz bir zemine sırtüstü yatırın.',
      'Göğüs kemiğinin alt yarısına ellerinizi üst üste kenetleyip 30 kez göğüs basısı uygulayın (5-6 cm çökme, 100-120 bası/dk).',
      'Hava yolunu açıp 2 kez kurtarıcı soluk verin. 30 bası : 2 soluk ritmini 112 ekibi gelene kadar sürdürün.',
    ],
    doNot: [
      'Bilinci açık veya normal nefes alan kişiye asla kalp masajı yapmayın.',
      'Yumuşak sünger veya yatak üzerinde kalp masajı uygulamayın.',
    ],
  },
  {
    id: 'heimlich',
    title: 'Tam Tıkanma & Heimlich Manevrası',
    category: 'Soluk Borusu Tıkanması',
    dangerLevel: 'KRİTİK',
    steps: [
      'Kişinin elleriyle boğazını tutup tutmadığını ve konuşup öksüremediğini kontrol edin.',
      'Kişinin arkasına geçip bir elinizi yumruk yaparak göbeğin hemen üstüne yerleştirin.',
      'Diğer elinizle yumruğunuzu kavrayıp içe ve yukarı doğru kuvvetle bastırın (5 kez).',
      'Yabancı cisim çıkana kadar veya hasta bilincini kaybedene kadar işleme devam edin.',
    ],
    doNot: [
      'Hafif tıkanmada öksürebilen kişinin sırtına vurmayın (öksürmeye teşvik edin).',
      'Görmediğiniz yabancı cismi çıkarmak için ağza körlemesine parmak sokmayın.',
    ],
  },
  {
    id: 'burns',
    title: 'Yanık & Termal Yaralanma Müdahalesi',
    category: 'Isı & Kimyasal Yanıklar',
    dangerLevel: 'ORTA',
    steps: [
      'Yanan bölgeyi en az 15-20 dakika musluk altındaki akan ılık/soğuk su altında tutun.',
      'Cilde yapışmamış takı ve giysileri hemen çıkarın.',
      'Bölgeyi temiz, nemli steril gazlı bezle örtün.',
      'Geniş yanıklarda hastanın vücut ısısını korumak için termal örtü/battaniye ile sarın.',
    ],
    doNot: [
      'Yanık üzerine salça, diş macunu, yoğurt veya zeytinyağı sürmeyin.',
      'Su toplayan bülleri (kabarcıkları) kesinlikle patlatmayın.',
    ],
  },
  {
    id: 'kirik',
    title: 'Kırık, Çıkık & Sahra Atellemesi',
    category: 'Ortopedik Travma',
    dangerLevel: 'YÜKSEK',
    steps: [
      'Kırık şüphesi olan uzvu kesinlikle hareket ettirmeyin.',
      'Kırık bölgeyi alt ve üst iki eklemi de içine alacak şekilde atel (sert destek tahtası vb.) ile sabitleyin.',
      'Açık kırık varsa temiz steril bezle yarayı örtün, kemik uçlarına dokunmayın.',
      'Uzvun uç kısmındaki nabız, ısı ve renk kontrolünü düzenli yapın.',
    ],
    doNot: [
      'Kırık kemiği yerine oturtmaya veya düzeltmeye çalışmayın.',
      'Yaralı uzva ağırlık vermesine izin vermeyin.',
    ],
  },
];

export default function FirstAidPage() {
  const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide>(FIRST_AID_GUIDES[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50">
      
      {/* Emergency Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-medical-red text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1 shadow-sm">
              <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
              <span>ACİL SIHHİYE & İLK YARDIM</span>
            </span>
            <span className="bg-medical-50 text-medical-700 text-xs font-bold px-3 py-1 rounded-full border border-medical-200">
              TCCC & Temel Yaşam Desteği
            </span>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-black text-slate-900">
            Sahra & Acil İlk Yardım Kılavuzu
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-2xl font-medium">
            Sahra şartlarında ve günlük acil durumlarda hayat kurtaran standart müdahale protokolleri. Soğukkanlı olun, güvenliği sağlayın ve adımları uygulayın.
          </p>
        </div>

        <a
          href="tel:112"
          className="px-6 py-4 rounded-2xl bg-medical-red hover:bg-red-700 text-white font-black text-lg flex items-center space-x-3 shadow-md shadow-medical-red/30 hover:scale-105 transition shrink-0"
        >
          <PhoneCall className="w-6 h-6 animate-pulse" />
          <span>112 ACİL ARA</span>
        </a>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side Topic Selectors */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider px-1">
            MÜDAHALE KONULARI
          </h3>

          {FIRST_AID_GUIDES.map(guide => {
            const isSelected = selectedGuide.id === guide.id;

            return (
              <button
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between shadow-sm ${
                  isSelected
                    ? 'bg-white border-medical-red shadow-md ring-1 ring-medical-red/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Cross className={`w-4 h-4 ${isSelected ? 'text-medical-red' : 'text-medical-600'}`} />
                    <h4 className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                      {guide.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 block pl-6 font-medium">{guide.category}</span>
                </div>

                <ChevronRight className={`w-5 h-5 shrink-0 transition-transform ${isSelected ? 'text-medical-red translate-x-1' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div className="space-y-1">
              <span className="text-xs font-bold text-medical-600 uppercase tracking-widest">
                {selectedGuide.category}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">{selectedGuide.title}</h2>
            </div>

            <span className="bg-red-50 border border-red-200 text-medical-red font-black text-xs px-3 py-1 rounded-full">
              RİSK: {selectedGuide.dangerLevel}
            </span>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>DOĞRU MÜDAHALE ADIMLARI (SIRASIYLA UYGULAYINIZ)</span>
            </h3>

            <div className="space-y-3">
              {selectedGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-medical-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {idx + 1}
                  </span>
                  <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Do Nots */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-medical-red uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-medical-red" />
              <span>KESİNLİKLE YAPILMAMASI GEREKEN HAYATİ HATALAR</span>
            </h3>

            <div className="space-y-2">
              {selectedGuide.doNot.map((noItem, idx) => (
                <div key={idx} className="bg-red-50/70 border border-red-200 p-3.5 rounded-2xl text-xs text-red-900 font-semibold flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-medical-red shrink-0" />
                  <span>{noItem}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
