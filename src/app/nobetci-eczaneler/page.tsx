'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Navigation, Pill } from 'lucide-react';

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  isOpen24h: boolean;
}

const SAMPLE_PHARMACIES: Pharmacy[] = [
  {
    id: '1',
    name: 'Sıhhiye & Merkez Eczanesi',
    city: 'Ankara',
    district: 'Sıhhiye',
    address: 'Atatürk Bulvarı No:68/B (Numune & Hacettepe Hastanesi Yakını)',
    phone: '0312 310 11 22',
    isOpen24h: true,
  },
  {
    id: '2',
    name: 'Sahra Hayat Eczanesi',
    city: 'Ankara',
    district: 'Mamak',
    address: 'Tıp Fakültesi Cad. No:82 (Devlet Hastanesi Karşısı)',
    phone: '0312 368 44 00',
    isOpen24h: true,
  },
  {
    id: '3',
    name: 'Gözde Şifa Eczanesi',
    city: 'İstanbul',
    district: 'Kadıköy',
    address: 'Bağdat Caddesi No:210 Kadıköy',
    phone: '0216 345 88 99',
    isOpen24h: true,
  },
  {
    id: '4',
    name: 'Ege Nöbet Eczanesi',
    city: 'İzmir',
    district: 'Konak',
    address: 'Alsancak Mah. Atatürk Cad. No:88',
    phone: '0232 464 12 34',
    isOpen24h: true,
  },
];

export default function PharmacyPage() {
  const [selectedCity, setSelectedCity] = useState('Ankara');
  const [selectedDistrict, setSelectedDistrict] = useState('Sıhhiye');

  const filteredPharmacies = SAMPLE_PHARMACIES.filter(
    p => p.city.toLowerCase() === selectedCity.toLowerCase()
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full text-amber-700 text-xs font-black uppercase tracking-wider">
          <Pill className="w-4 h-4 text-amber-500" />
          <span>CANLI NÖBETÇİ ECZANE SİSTEMİ</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900">Nöbetçi Eczaneler</h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto font-medium">
          Şehir ve ilçe seçerek bu gece açık olan Nöbetçi Eczanelerin açık adresini, telefonunu ve canlı yol tarifini görüntüleyin.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Şehir Seçin</label>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-sm text-slate-900 outline-none"
            >
              <option value="Ankara">Ankara</option>
              <option value="İstanbul">İstanbul</option>
              <option value="İzmir">İzmir</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">İlçe / Bölge</label>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl text-sm text-slate-900 outline-none"
            >
              <option value="Sıhhiye">Sıhhiye / Çankaya</option>
              <option value="Mamak">Mamak</option>
              <option value="Keçiören">Keçiören</option>
              <option value="Kadıköy">Kadıköy</option>
              <option value="Konak">Konak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pharmacy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPharmacies.map(pharmacy => (
          <div
            key={pharmacy.id}
            className="bg-white border border-slate-200 hover:border-amber-400 p-6 rounded-3xl space-y-4 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="bg-amber-50 text-amber-700 border border-amber-200 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  NÖBETÇİ • BU GECE AÇIK
                </span>
                <h3 className="text-lg font-bold text-slate-900 pt-1">{pharmacy.name}</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {pharmacy.city} / {pharmacy.district}
                </span>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                <Pill className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 border-t border-b border-slate-100 py-3 font-medium">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{pharmacy.address}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-medical-600 shrink-0" />
                <a href={`tel:${pharmacy.phone}`} className="hover:text-medical-600 font-bold transition">
                  {pharmacy.phone}
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={`tel:${pharmacy.phone}`}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs hover:bg-medical-600 hover:text-white transition flex items-center space-x-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hemen Ara</span>
              </a>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(pharmacy.name + ' ' + pharmacy.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition flex items-center space-x-1.5 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Yol Tarifi Al</span>
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
