'use client';

import React, { useState } from 'react';

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

  const calculateBMI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heightCm || !weightKg) return;
    const heightM = heightCm / 100;
    const score = Number((weightKg / (heightM * heightM)).toFixed(1));

    let status = 'Normal İdeal Kiloda';
    let color = '#2e7d32';

    if (score < 18.5) {
      status = 'Zayıf (Düşük Kilo)';
      color = '#1976d2';
    } else if (score >= 25 && score < 29.9) {
      status = 'Fazla Kilolu (Hafif Şişman)';
      color = '#f57c00';
    } else if (score >= 30) {
      status = 'Obez (I. Derece Şişmanlık)';
      color = '#d32f2f';
    }

    setBmiResult({ score, status, color });
  };

  const calculateWater = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterWeight) return;
    const liters = Number(((waterWeight * 35) / 1000).toFixed(2));
    setWaterResult(liters);
  };

  const calculateBMR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bmrWeight || !bmrHeight || !bmrAge) return;

    let bmr = 10 * bmrWeight + 6.25 * bmrHeight - 5 * bmrAge;
    if (bmrGender === 'erkek') bmr += 5;
    else bmr -= 161;

    setBmrResult(Math.round(bmr));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="page-header">
        <h1>📊 Tıbbi Sağlık Hesaplayıcıları</h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('vki')}
          className={`btn ${activeTab === 'vki' ? 'btn-primary' : 'btn-secondary'}`}
        >
          ⚖️ Vücut Kitle İndeksi (VKİ)
        </button>

        <button
          onClick={() => setActiveTab('su')}
          className={`btn ${activeTab === 'su' ? 'btn-primary' : 'btn-secondary'}`}
        >
          💧 Su İhtiyacı
        </button>

        <button
          onClick={() => setActiveTab('bmh')}
          className={`btn ${activeTab === 'bmh' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🔥 Metabolizma (BMH)
        </button>
      </div>

      <div className="card">
        
        {/* VKİ */}
        {activeTab === 'vki' && (
          <div>
            <div className="card-header" style={{ background: '#f5f5f5' }}>
              <h3>⚖️ Vücut Kitle İndeksi (VKİ) Hesaplama</h3>
            </div>
            <div className="card-body">
              <form onSubmit={calculateBMI}>
                <div className="form-group">
                  <label className="form-label">Boyunuz (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={e => setHeightCm(Number(e.target.value))}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kilonuz (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={e => setWeightKg(Number(e.target.value))}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Hesapla
                </button>

                {bmiResult && (
                  <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center', borderLeft: `6px solid ${bmiResult.color}` }}>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>VKİ Skorunuz:</div>
                    <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: bmiResult.color, margin: '5px 0' }}>
                      {bmiResult.score}
                    </div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{bmiResult.status}</div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Su */}
        {activeTab === 'su' && (
          <div>
            <div className="card-header" style={{ background: '#f5f5f5' }}>
              <h3>💧 Günlük Su İhtiyacı</h3>
            </div>
            <div className="card-body">
              <form onSubmit={calculateWater}>
                <div className="form-group">
                  <label className="form-label">Vücut Ağırlığınız (kg)</label>
                  <input
                    type="number"
                    value={waterWeight}
                    onChange={e => setWaterWeight(Number(e.target.value))}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Hesapla
                </button>

                {waterResult !== null && (
                  <div style={{ marginTop: '20px', padding: '20px', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center', color: '#1565c0' }}>
                    <div style={{ fontSize: '0.9em' }}>Günlük İdeal Su Tüketimi:</div>
                    <div style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '5px 0' }}>
                      {waterResult} Litre
                    </div>
                    <div style={{ fontSize: '0.9em' }}>Yaklaşık {Math.round(waterResult * 5)} su bardağı</div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* BMH */}
        {activeTab === 'bmh' && (
          <div>
            <div className="card-header" style={{ background: '#f5f5f5' }}>
              <h3>🔥 Bazal Metabolizma Hızı (BMH)</h3>
            </div>
            <div className="card-body">
              <form onSubmit={calculateBMR}>
                <div className="form-group">
                  <label className="form-label">Cinsiyet</label>
                  <select
                    value={bmrGender}
                    onChange={e => setBmrGender(e.target.value as any)}
                    className="form-control"
                  >
                    <option value="erkek">Erkek</option>
                    <option value="kadin">Kadın</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Yaşınız</label>
                  <input
                    type="number"
                    value={bmrAge}
                    onChange={e => setBmrAge(Number(e.target.value))}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Boy (cm)</label>
                  <input
                    type="number"
                    value={bmrHeight}
                    onChange={e => setBmrHeight(Number(e.target.value))}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kilo (kg)</label>
                  <input
                    type="number"
                    value={bmrWeight}
                    onChange={e => setBmrWeight(Number(e.target.value))}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Hesapla
                </button>

                {bmrResult !== null && (
                  <div style={{ marginTop: '20px', padding: '20px', background: '#fff3e0', borderRadius: '8px', textAlign: 'center', color: '#e65100' }}>
                    <div style={{ fontSize: '0.9em' }}>Günlük Dinlenme Enerji İhtiyacı:</div>
                    <div style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '5px 0' }}>
                      {bmrResult} kcal/gün
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
