'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, RefreshCw, Key, ShieldCheck, FileText, Plus, Trash2, Cross } from 'lucide-react';
import { NewsItem } from '@/lib/types';

interface ApiKeyItem {
  _id?: string;
  name?: string;
  provider?: string;
  type?: string;
  key?: string;
  api_key?: string;
  active?: boolean;
  updatedAt?: string;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [news, setNews] = useState<NewsItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'keys' | 'haberler'>('keys');

  // Form for Adding/Updating API key
  const [keyProvider, setKeyProvider] = useState('openrouter');
  const [keyName, setKeyName] = useState('OpenRouter Ücretsiz LLM');
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
    if (!confirm(`Bu API anahtarını silmek istediğinize emin misiniz?`)) return;
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
      if (data.success) {
        alert(data.message);
        loadData();
      }
    } catch (err) {
      alert('RSS Senkronizasyon hatası!');
    } finally {
      setSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-xl text-slate-900">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center mx-auto border border-medical-200 shadow-sm">
              <Cross className="w-8 h-8 fill-medical-600 text-medical-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Yönetim Paneli</h2>
            <p className="text-xs text-slate-500 font-medium">Devam etmek için yetkili şifrenizi giriniz.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Yönetici Şifresi</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-sm text-slate-900 outline-none transition"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-medical-red bg-red-50 p-2.5 rounded-xl border border-red-200 text-center font-semibold">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-black text-xs transition shadow-md shadow-medical-600/20 active:scale-95"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm text-slate-900">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Cross className="w-5 h-5 text-medical-red" />
            <span className="text-xs font-extrabold text-medical-600 uppercase tracking-widest">
              SAHRA SIHHİYE OKULU • YÖNETİM MERKEZİ
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">API Keys & RSS Haber Yönetimi</h1>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={syncing}
          className="px-5 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-black text-xs transition flex items-center space-x-2 shadow-md shadow-medical-600/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'RSS Çekiliyor...' : 'Tüm Sağlık RSS Kaynaklarını Güncelle'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
            activeTab === 'keys' ? 'bg-medical-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Anahtarları (OpenRouter & Gemini)</span>
        </button>

        <button
          onClick={() => setActiveTab('haberler')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition ${
            activeTab === 'haberler' ? 'bg-medical-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Haber Listesi ({news.length})</span>
        </button>
      </div>

      {/* API Keys Management Section */}
      {activeTab === 'keys' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Key Form */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-medical-600" />
              <span>Yeni API Key Ekle / Güncelle</span>
            </h3>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Sağlayıcı (Provider)</label>
                <select
                  value={keyProvider}
                  onChange={e => {
                    setKeyProvider(e.target.value);
                    if (e.target.value === 'openrouter') setKeyName('OpenRouter Ücretsiz LLM');
                    if (e.target.value === 'gemini') setKeyName('Google Gemini AI');
                    if (e.target.value === 'elevenlabs') setKeyName('ElevenLabs TTS');
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-xs text-slate-900 outline-none"
                >
                  <option value="openrouter">OpenRouter (Ücretsiz LLM: Llama 3.3 / Gemini 2.0 / DeepSeek)</option>
                  <option value="gemini">Google Gemini AI</option>
                  <option value="elevenlabs">ElevenLabs Text-To-Speech</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Açıklama Adı</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-xs text-slate-900 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">API Key String (`sk-or-...` / `AIzaSy...`)</label>
                <input
                  type="text"
                  value={keyValue}
                  onChange={e => setKeyValue(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-medical-600 rounded-xl text-xs text-slate-900 outline-none font-mono"
                  required
                />
              </div>

              {keySuccessMsg && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center font-bold">
                  {keySuccessMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={savingKey}
                className="w-full py-3.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-black text-xs transition shadow-md shadow-medical-600/20 disabled:opacity-50"
              >
                {savingKey ? 'Kaydediliyor...' : 'API Key Veritabanına Kaydet'}
              </button>
            </form>
          </div>

          {/* Existing Keys Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm text-slate-900">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-medical-600" />
              <span>Veritabanında Tanımlı Aktif API Keys ({apiKeys.length})</span>
            </h3>

            {apiKeys.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs text-slate-600">Henüz veritabanında kayıtlı özel API Key bulunmuyor.</p>
                <p className="text-[11px] text-slate-400">Soldaki formdan OpenRouter anahtarınızı eklediğinizde tüm AI işlemleri anında aktifleşir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((k, idx) => {
                  const keyStr = k.key || k.api_key || '';
                  const prov = k.provider || k.type || 'api';

                  return (
                    <div key={k._id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="bg-medical-50 text-medical-700 border border-medical-200 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                            {prov}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{k.name || prov}</h4>
                          {k.active === false && (
                            <span className="text-[10px] text-red-500 font-semibold">(Pasif)</span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 block truncate max-w-sm">
                          Key: {keyStr.substring(0, 10)}...{keyStr.substring(Math.max(0, keyStr.length - 4))}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteApiKey(k._id, prov)}
                        className="p-2 rounded-xl bg-red-50 text-medical-red hover:bg-red-600 hover:text-white transition text-xs border border-red-200"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* News Table Section */}
      {activeTab === 'haberler' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm overflow-hidden text-slate-900">
          <h3 className="text-base font-extrabold text-slate-900">Veritabanındaki Sağlık Haberleri</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Haber Başlığı</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Kaynak</th>
                  <th className="p-3">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {news.map(item => (
                  <tr key={item._id || item.link} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900 truncate max-w-md">{item.title}</td>
                    <td className="p-3">
                      <span className="bg-medical-50 text-medical-700 border border-medical-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {item.category || 'Sağlık'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{item.source}</td>
                    <td className="p-3 text-slate-400">{new Date(item.pubDate).toLocaleDateString('tr-TR')}</td>
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
