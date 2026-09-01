'use client';

import React, { useState, useEffect } from 'react';
import { NewsItem } from '@/lib/types';

interface ApiKeyItem {
  _id?: string;
  name?: string;
  provider?: string;
  type?: string;
  key?: string;
  api_key?: string;
  active?: boolean;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [news, setNews] = useState<NewsItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'keys' | 'haberler'>('keys');

  // Form for Adding/Updating API key
  const [keyProvider, setKeyProvider] = useState('openrouter');
  const [keyName, setKeyName] = useState('OpenRouter AI');
  const [keyValue, setKeyValue] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keySuccessMsg, setKeySuccessMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '12345678' || password === 'admin') {
      setIsAuthenticated(true);
      setErrorMsg('');
      loadData();
    } else {
      setErrorMsg('Hatalı şifre! Lütfen kontrol ediniz.');
    }
  };

  const loadData = async () => {
    try {
      const newsRes = await fetch('/api/news');
      const newsData = await newsRes.json();
      if (newsData.news) setNews(newsData.news);

      const keysRes = await fetch('/api/admin/keys');
      const keysData = await keysRes.json();
      if (keysData.keys) setApiKeys(keysData.keys);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue) return;

    setSavingKey(true);
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyName,
          provider: keyProvider,
          type: keyProvider,
          key: keyValue,
          api_key: keyValue,
        })
      });
      const data = await res.json();
      if (data.success) {
        setKeySuccessMsg('API Anahtarı başarıyla kaydedildi!');
        setKeyValue('');
        loadData();
        setTimeout(() => setKeySuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteApiKey = async (id?: string, provider?: string) => {
    if (!confirm('Bu API anahtarını silmek istediğinize emin misiniz?')) return;
    try {
      let url = '/api/admin/keys';
      if (id) url += `?id=${id}`;
      else if (provider) url += `?provider=${provider}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/rss/sync', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'RSS senkronizasyonu tamamlandı!');
      loadData();
    } catch (err) {
      alert('RSS Senkronizasyon hatası!');
    } finally {
      setSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto' }}>
        <div className="card">
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white', textAlign: 'center' }}>
            <h2>🔒 Yönetim Paneli</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Yönetici Şifresi</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                  required
                />
              </div>

              {errorMsg && (
                <div style={{ background: '#ffcdd2', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '0.9em' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Giriş Yap
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="page-header">
        <h1>⚙️ Admin Yönetim Paneli</h1>
        <button
          onClick={handleTriggerSync}
          disabled={syncing}
          className="btn btn-primary"
        >
          {syncing ? '🔄 RSS Çekiliyor...' : '🔄 Tüm RSS Kaynaklarını Güncelle'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('keys')}
          className={`btn ${activeTab === 'keys' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🔑 API Anahtarları (OpenRouter & Gemini)
        </button>

        <button
          onClick={() => setActiveTab('haberler')}
          className={`btn ${activeTab === 'haberler' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📰 Haber Listesi ({news.length})
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Add Key Card */}
          <div className="card">
            <div className="card-header" style={{ background: '#f5f5f5' }}>
              <h3>➕ API Anahtarı Ekle / Güncelle</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveApiKey}>
                <div className="form-group">
                  <label className="form-label">Sağlayıcı</label>
                  <select
                    value={keyProvider}
                    onChange={e => {
                      setKeyProvider(e.target.value);
                      if (e.target.value === 'openrouter') setKeyName('OpenRouter AI');
                      if (e.target.value === 'gemini') setKeyName('Google Gemini AI');
                      if (e.target.value === 'elevenlabs') setKeyName('ElevenLabs TTS');
                    }}
                    className="form-control"
                  >
                    <option value="openrouter">OpenRouter (Gemini 2.0 Flash / GPT-4o-mini / Llama 3.3)</option>
                    <option value="gemini">Google Gemini AI</option>
                    <option value="elevenlabs">ElevenLabs Seslendirme</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Açıklama Adı</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={e => setKeyName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">API Key Değeri</label>
                  <input
                    type="text"
                    value={keyValue}
                    onChange={e => setKeyValue(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="form-control"
                    required
                  />
                </div>

                {keySuccessMsg && (
                  <div style={{ background: '#c8e6c9', color: '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '0.9em' }}>
                    {keySuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingKey}
                  className="btn btn-success"
                  style={{ width: '100%' }}
                >
                  {savingKey ? 'Kaydediliyor...' : '💾 API Key Kaydet'}
                </button>
              </form>
            </div>
          </div>

          {/* Active Keys List */}
          <div className="card">
            <div className="card-header" style={{ background: '#f5f5f5' }}>
              <h3>🛡️ Tanımlı API Anahtarları ({apiKeys.length})</h3>
            </div>
            <div className="card-body">
              {apiKeys.length === 0 ? (
                <p style={{ color: '#777', fontSize: '0.9em' }}>Henüz kayıtlı API Key bulunmuyor.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {apiKeys.map((k, idx) => {
                    const keyStr = k.key || k.api_key || '';
                    const prov = k.provider || k.type || 'api';
                    return (
                      <div key={k._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '12px 15px', borderRadius: '6px', border: '1px solid #eee' }}>
                        <div>
                          <span className="source-badge" style={{ marginRight: '8px' }}>{prov}</span>
                          <strong>{k.name || prov}</strong>
                          <div style={{ fontSize: '0.8em', color: '#888', marginTop: '4px', fontFamily: 'monospace' }}>
                            {keyStr.substring(0, 10)}...{keyStr.substring(Math.max(0, keyStr.length - 4))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteApiKey(k._id, prov)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.8em' }}
                        >
                          Sil
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* News List Tab */}
      {activeTab === 'haberler' && (
        <div className="card">
          <div className="card-header" style={{ background: '#f5f5f5' }}>
            <h3>Haber Veritabanı</h3>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Kategori</th>
                  <th>Kaynak</th>
                  <th>Tarih</th>
                  <th>Gönderildi</th>
                </tr>
              </thead>
              <tbody>
                {news.map(item => (
                  <tr key={item._id || item.link}>
                    <td style={{ fontWeight: 600, color: '#1a237e' }}>{item.title}</td>
                    <td><span className="category-badge">{item.category}</span></td>
                    <td><span className="source-badge">{item.source}</span></td>
                    <td style={{ fontSize: '0.85em', color: '#666' }}>{new Date(item.pubDate).toLocaleDateString('tr-TR')}</td>
                    <td>{item.gonderildi ? '✅ Gönderildi' : '⏳ Gönderilmedi'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
