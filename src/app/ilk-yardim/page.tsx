'use client';

import React, { useState } from 'react';

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
      'Sıkıştırma çubuğunu kanama tamamen durana ve nabız kaybolana kadar çevirin.',
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
      'Solunum yoksa derhal 112 Acil Servisi arayın.',
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
];

export default function FirstAidPage() {
  const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide>(FIRST_AID_GUIDES[0]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="page-header">
        <h1>🚑 Sahra & Acil İlk Yardım Kılavuzu</h1>
        <a href="tel:112" className="btn btn-danger" style={{ fontSize: '1em', padding: '10px 20px' }}>
          📞 112 ACİL ARA
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Guides List */}
        <div className="card">
          <div className="card-header" style={{ background: '#f5f5f5' }}>
            <h3>Müdahale Konuları</h3>
          </div>
          <div className="card-body" style={{ padding: '10px' }}>
            {FIRST_AID_GUIDES.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGuide(g)}
                style={{
                  padding: '12px 15px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: selectedGuide.id === g.id ? '#e3f2fd' : '#fff',
                  border: selectedGuide.id === g.id ? '1.5px solid #1976d2' : '1px solid #eee',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 600, color: selectedGuide.id === g.id ? '#1565c0' : '#333', fontSize: '0.95em' }}>
                  {g.title}
                </div>
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                  {g.category} • <strong style={{ color: g.dangerLevel === 'KRİTİK' ? '#d32f2f' : '#f57c00' }}>{g.dangerLevel}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Guide Details */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{selectedGuide.title}</h3>
            <span className="user-badge" style={{ background: 'rgba(255,255,255,0.2)' }}>{selectedGuide.category}</span>
          </div>
          <div className="card-body">
            
            <h4 style={{ color: '#2e7d32', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✓ Doğru Müdahale Adımları (Sırasıyla Uygulayınız)
            </h4>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#333', marginBottom: '25px' }}>
              {selectedGuide.steps.map((st, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{st}</li>
              ))}
            </ol>

            <h4 style={{ color: '#d32f2f', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Kesinlikle Yapılmaması Gereken Hatalar
            </h4>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#c62828' }}>
              {selectedGuide.doNot.map((dn, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{dn}</li>
              ))}
            </ul>

          </div>
        </div>

      </div>

    </div>
  );
}
