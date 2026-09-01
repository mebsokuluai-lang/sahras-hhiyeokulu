'use client';

import React, { useState } from 'react';

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
}

const SAMPLE_PHARMACIES: Pharmacy[] = [
  {
    id: '1',
    name: 'Sıhhiye & Merkez Eczanesi',
    city: 'Ankara',
    district: 'Sıhhiye',
    address: 'Atatürk Bulvarı No:68/B (Numune & Hacettepe Hastanesi Yakını)',
    phone: '0312 310 11 22',
  },
  {
    id: '2',
    name: 'Sahra Hayat Eczanesi',
    city: 'Ankara',
    district: 'Mamak',
    address: 'Tıp Fakültesi Cad. No:82 (Devlet Hastanesi Karşısı)',
    phone: '0312 368 44 00',
  },
  {
    id: '3',
    name: 'Gözde Şifa Eczanesi',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Bağdat Caddesi No:210 Kadıköy',
    phone: '0216 345 88 99',
  },
  {
    id: '4',
    name: 'Ege Nöbet Eczanesi',
    city: 'İzmir',
    district: 'Konak',
    address: 'Alsancak Mah. Atatürk Cad. No:88',
    phone: '0232 464 12 34',
  },
];

export default function PharmacyPage() {
  const [selectedCity, setSelectedCity] = useState('Ankara');
  const [selectedDistrict, setSelectedDistrict] = useState('Sıhhiye');

  const filtered = SAMPLE_PHARMACIES.filter(
    p => p.city.toLowerCase() === selectedCity.toLowerCase()
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div className="page-header">
        <h1>💊 Nöbetçi Eczaneler</h1>
        <span className="news-count">Canlı Nöbet Sistemi</span>
      </div>

      <div className="card" style={{ marginBottom: '25px' }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Şehir Seçin</label>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="form-control"
            >
              <option value="Ankara">Ankara</option>
              <option value="İstanbul">İstanbul</option>
              <option value="İzmir">İzmir</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">İlçe / Bölge</label>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="form-control"
            >
              <option value="Sıhhiye">Sıhhiye / Çankaya</option>
              <option value="Mamak">Mamak</option>
              <option value="Kadıköy">Kadıköy</option>
              <option value="Konak">Konak</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {filtered.map(p => (
          <div key={p.id} className="card">
            <div className="card-header" style={{ background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#1a237e' }}>{p.name}</h3>
              <span className="user-badge" style={{ background: '#c8e6c9', color: '#2e7d32' }}>Bu Gece Açık</span>
            </div>
            <div className="card-body" style={{ lineHeight: '1.7' }}>
              <div style={{ color: '#555', marginBottom: '8px' }}>
                📍 <strong>Adres:</strong> {p.address}
              </div>
              <div style={{ color: '#555', marginBottom: '15px' }}>
                📞 <strong>Telefon:</strong> <a href={`tel:${p.phone}`} style={{ color: '#1976d2', fontWeight: 600 }}>{p.phone}</a>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`tel:${p.phone}`} className="btn btn-primary" style={{ flex: 1 }}>
                  📞 Hemen Ara
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(p.name + ' ' + p.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  🗺️ Yol Tarifi
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
