'use client';

import React, { useState } from 'react';
import { Calculator, Scale, Droplet, Flame } from 'lucide-react';

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<'vki' | 'su' | 'bmh'>('vki');

  // BMI State
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [bmiResult, setBmiResult] = useState<{ score: number; status: string; color: string } | null>(null);

  // Water State
  const [waterWeight, setWaterWeight] = useState<number>(70);
  const [waterResult, setWaterResult] = useState<number | null>(null);

  // BMR State
  const [bmrAge, setBmrAge] = useState<number>(25);
  const [bmrGender, setBmrGender] = useState<'erkek' | 'kadin'>('erkek');
  const [bmrHeight, setBmrHeight] = useState<number>(175);
  const [bmrWeight, setBmrWeight] = useState<number>(70);
  const [bmrResult, setBmrResult] = useState<number | null>(null);

  // BMI Calculation
  const calculateBMI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heightCm || !weightKg) return;

    const heightM = heightCm / 100;
    const score = Number((weightKg / (heightM * heightM)).toFixed(1));

    let status = 'Normal İdeal Kiloda';
    let color = 'text-emerald-800 border-emerald-300 bg-emerald-50';

    if (score < 18.5) {
      status = 'Zayıf (Düşük Kilo)';
      color = 'text-medical-800 border-medical-300 bg-medical-50';
    } else if (score >= 25 && score < 29.9) {
      status = 'Fazla Kilolu (Hafif Şişman)';
      color = 'text-amber-800 border-amber-300 bg-amber-50';
    } else if (score >= 30) {
      status = 'Obez (I. Derece Şişmanlık)';
      color = 'text-red-800 border-red-300 bg-red-50';
    }

    setBmiResult({ score, status, color });
  };

  // Water Calculation (35 ml per kg)
  const calculateWater = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterWeight) return;
    const liters = Number(((waterWeight * 35) / 1000).toFixed(2));
    setWaterResult(liters);
  };

  // BMR Calculation
  const calculateBMR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bmrWeight || !bmrHeight || !bmrAge) return;

    let bmr = 10 * bmrWeight + 6.25 * bmrHeight - 5 * bmrAge;
    if (bmrGender === 'erkek') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    setBmrResult(Math.round(bmr));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-medical-50 border border-medical-200 px-3.5 py-1 rounded-full text-medical-700 text-xs font-black uppercase tracking-wider">
          <Calculator className="w-4 h-4" />
          <span>SAHRA SIHHİYE MEDİKAL HESAPLAYICILAR</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900">Tıbbi Sağlık Hesaplayıcıları</h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto font-medium">
          Vücut Kitle İndeksi (VKİ), günlük ideal su tüketimi ve bazal metabolizma hızınızı tıp standartlarında formüllerle anında hesaplayın.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200 max-w-md mx-auto shadow-sm">
        <button
          onClick={() => setActiveTab('vki')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'vki' ? 'bg-medical-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>VKİ (Beden Kitle)</span>
        </button>

        <button
          onClick={() => setActiveTab('su')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'su' ? 'bg-medical-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>Su İhtiyacı</span>
        </button>

        <button
          onClick={() => setActiveTab('bmh')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'bmh' ? 'bg-medical-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Metabolizma (BMH)</span>
        </button>
      </div>

      {/* Calculator Body */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm max-w-2xl mx-auto">
        
        {/* VKİ Calculator */}
        {activeTab === 'vki' && (
          <form onSubmit={calculateBMI} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <Scale className="w-5 h-5 text-medical-600" />
                <span>Vücut Kitle İndeksi (VKİ) Hesaplama</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Boy ve kilonuza göre ideal beden kitle oranınızı bulun.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Boyunuz (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  placeholder="Örn: 175"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kilonuz (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={e => setWeightKg(Number(e.target.value))}
                  placeholder="Örn: 70"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-black text-sm transition shadow-md shadow-medical-600/20"
            >
              VKİ Skorunu Hesapla
            </button>

            {bmiResult && (
              <div className={`p-5 rounded-2xl border text-center space-y-2 animate-in fade-in zoom-in-95 ${bmiResult.color}`}>
                <span className="text-xs font-bold uppercase tracking-widest block">VKİ BEDEN SKORUNUZ</span>
                <span className="text-4xl font-black block">{bmiResult.score}</span>
                <span className="text-sm font-bold block">{bmiResult.status}</span>
              </div>
            )}
          </form>
        )}

        {/* Water Calculator */}
        {activeTab === 'su' && (
          <form onSubmit={calculateWater} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <Droplet className="w-5 h-5 text-medical-600" />
                <span>Günlük Su Tüketim İhtiyacı</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Kilonuza göre tüketmeniz gereken günlük su miktarını hesaplayın.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Vücut Ağırlığınız (kg)</label>
              <input
                type="number"
                value={waterWeight}
                onChange={e => setWaterWeight(Number(e.target.value))}
                placeholder="Örn: 70"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-black text-sm transition shadow-md shadow-medical-600/20"
            >
              Su İhtiyacını Hesapla
            </button>

            {waterResult !== null && (
              <div className="p-5 rounded-2xl border border-medical-200 bg-medical-50 text-medical-800 text-center space-y-2 animate-in fade-in zoom-in-95">
                <span className="text-xs font-bold uppercase tracking-widest block">GÜNLÜK İDEAL SU TÜKETİMİ</span>
                <span className="text-4xl font-black block text-slate-900">{waterResult} Litre</span>
                <p className="text-xs text-slate-600 font-medium">Yaklaşık {Math.round(waterResult * 5)} su bardağına denk gelmektedir.</p>
              </div>
            )}
          </form>
        )}

        {/* BMR Calculator */}
        {activeTab === 'bmh' && (
          <form onSubmit={calculateBMR} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <Flame className="w-5 h-5 text-medical-600" />
                <span>Bazal Metabolizma Hızı (BMH)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">Vücudunuzun dinlenme anındayken yaktığı kalori miktarını hesaplayın.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Cinsiyet</label>
                <select
                  value={bmrGender}
                  onChange={e => setBmrGender(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none"
                >
                  <option value="erkek">Erkek</option>
                  <option value="kadin">Kadın</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Yaşınız</label>
                <input
                  type="number"
                  value={bmrAge}
                  onChange={e => setBmrAge(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Boy (cm)</label>
                <input
                  type="number"
                  value={bmrHeight}
                  onChange={e => setBmrHeight(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kilo (kg)</label>
                <input
                  type="number"
                  value={bmrWeight}
                  onChange={e => setBmrWeight(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-black text-sm transition shadow-md shadow-medical-600/20"
            >
              Metabolizma Hızını Hesapla
            </button>

            {bmrResult !== null && (
              <div className="p-5 rounded-2xl border border-medical-200 bg-medical-50 text-medical-800 text-center space-y-2 animate-in fade-in zoom-in-95">
                <span className="text-xs font-bold uppercase tracking-widest block">GÜNLÜK BAZAL METABOLİZMA</span>
                <span className="text-4xl font-black block text-slate-900">{bmrResult} kcal/gün</span>
                <p className="text-xs text-slate-600 font-medium">Dinlenme anında vücudunuzun temel fonksiyonları için harcadığı enerjidir.</p>
              </div>
            )}
          </form>
        )}

      </div>

    </div>
  );
}
