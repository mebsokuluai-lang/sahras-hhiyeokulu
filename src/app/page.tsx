'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { NewsItem } from '@/lib/types';

export default function HomePage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideSent, setHideSent] = useState(false);

  // Collapsible panels
  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);

  // Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const allCategories = ['Tıp & Klinik', 'Klinik & Araştırma', 'Halk Sağlığı', 'Beslenme & Yaşam', 'Acil Durum & İlk Yardım', 'Sahra Tıbbı'];

  // Manual News Form
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [manualSource, setManualSource] = useState('Sahra Sağlık');
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Edit history tracking for undo/redo
  const [modifiedFields, setModifiedFields] = useState<{ [key: string]: boolean }>({});
  const [savingStatus, setSavingStatus] = useState<{ [key: string]: string }>({});

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success && data.news) {
        setNewsList(data.news);
      }
    } catch (err) {
      console.error('Haberler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleToggleSent = async (item: NewsItem) => {
    const id = item._id || item.id;
    try {
      const res = await fetch('/api/gonderildi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, link: item.link, gonderildi: !item.gonderildi })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNewsList(prev =>
          prev.map(n =>
            (n._id === id || n.id === id || n.link === item.link)
              ? { ...n, gonderildi: data.gonderildi }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
    }
  };

  const handleSaveField = async (item: NewsItem, field: string, value: string) => {
    const key = `${item._id || item.id || item.link}_${field}`;
    setSavingStatus(prev => ({ ...prev, [key]: 'saving' }));

    try {
      const res = await fetch('/api/news/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item._id || item.id,
          link: item.link,
          field,
          value
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSavingStatus(prev => ({ ...prev, [key]: 'saved' }));
        setModifiedFields(prev => ({ ...prev, [key]: false }));
        setTimeout(() => {
          setSavingStatus(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }, 3000);
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      setSavingStatus(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const handleManualNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualContent || !manualLink) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/news/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: manualLink,
          field: 'title_turkish',
          value: manualTitle
        })
      });
      alert('Haber eklendi / güncellendi!');
      setManualTitle('');
      setManualContent('');
      setManualLink('');
      fetchNews();
    } catch (err) {
      alert('Haber eklenirken hata oluştu.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSyncRss = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/rss/sync', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'RSS kaynakları güncellendi!');
      fetchNews();
    } catch (err) {
      alert('RSS senkronizasyon hatası!');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleAllCategories = (checked: boolean) => {
    setSelectedCategories(checked ? [...allCategories] : []);
  };

  // Filter items
  const filteredNews = newsList.filter(item => {
    if (hideSent && item.gonderildi) return false;
    if (selectedCategories.length > 0) {
      return selectedCategories.some(c => item.category?.toLowerCase().includes(c.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="haberler-container">
      
      {/* Page Header */}
      <div className="page-header">
        <h1>📰 Haberler</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="news-count">{filteredNews.length} haber gösteriliyor</span>
          <button
            onClick={handleSyncRss}
            disabled={isSyncing}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.85em' }}
          >
            {isSyncing ? '🔄 Çekiliyor...' : '🔄 RSS Güncelle'}
          </button>
        </div>
      </div>

      {/* Collapsible: Manual News Addition */}
      <div className={`collapsible-section add-news-section ${isAddNewsOpen ? 'expanded' : ''}`} style={{ background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)', color: 'white' }}>
        <div className="collapsible-header" onClick={() => setIsAddNewsOpen(!isAddNewsOpen)} style={{ background: 'transparent' }}>
          <div>
            <h3>➕ Manuel Haber Ekle</h3>
            <div className="info-text">Farklı kaynaklardan haber eklemek için kullanın. Eklenen haberler otomatik işlenir.</div>
          </div>
          <span className="collapse-icon">▼</span>
        </div>
        <div className="collapsible-content">
          <form onSubmit={handleManualNewsSubmit} style={{ paddingTop: '10px' }}>
            <input
              type="text"
              placeholder="Haber Başlığı (zorunlu)"
              value={manualTitle}
              onChange={e => setManualTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginBottom: '10px', border: 'none', borderRadius: '5px', color: '#333' }}
            />
            <textarea
              placeholder="Haber İçeriği (zorunlu)"
              value={manualContent}
              onChange={e => setManualContent(e.target.value)}
              required
              style={{ width: '100%', minHeight: '90px', padding: '10px', marginBottom: '10px', border: 'none', borderRadius: '5px', color: '#333' }}
            />
            <input
              type="url"
              placeholder="Kaynak Linki (zorunlu, örn: https://...)"
              value={manualLink}
              onChange={e => setManualLink(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginBottom: '10px', border: 'none', borderRadius: '5px', color: '#333' }}
            />
            <input
              type="text"
              placeholder="Kaynak Adı (zorunlu, örn: Medimagazin)"
              value={manualSource}
              onChange={e => setManualSource(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginBottom: '12px', border: 'none', borderRadius: '5px', color: '#333' }}
            />
            <button
              type="submit"
              disabled={isAdding}
              style={{ background: 'white', color: '#2e7d32', border: 'none', padding: '10px 24px', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}
            >
              {isAdding ? 'Ekleniyor...' : '📥 Haberi Ekle'}
            </button>
          </form>
        </div>
      </div>

      {/* Collapsible: Category Filter */}
      <div className={`collapsible-section kategori-filter ${isCategoryFilterOpen ? 'expanded' : ''}`}>
        <div className="collapsible-header" onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}>
          <div>
            <h3>🏷️ Kategorilere Göre Filtrele</h3>
            <div className="info-text">⚠️ Hiçbiri seçili değilse filtre uygulanmaz, bütün haberler gösterilir.</div>
          </div>
          <span className="collapse-icon">▼</span>
        </div>
        <div className="collapsible-content">
          <div style={{ marginBottom: '12px', paddingTop: '10px' }}>
            <label className="kategori-checkbox" style={{ fontWeight: 'bold', color: '#1976d2' }}>
              <input
                type="checkbox"
                checked={selectedCategories.length === allCategories.length}
                onChange={e => toggleAllCategories(e.target.checked)}
              />
              <span>Hepsini Seç</span>
            </label>
          </div>
          <div className="kategori-checkboxes">
            {allCategories.map(cat => (
              <label key={cat} className="kategori-checkbox">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Sent Filter Toggle Bar */}
      <div className="filter-toggle-bar">
        <div className="filter-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={hideSent}
              onChange={e => setHideSent(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span>Sadece gönderilmeyenleri göster</span>
        </div>
        <span className={`filter-hint ${hideSent ? 'active' : ''}`}>
          {hideSent ? 'Gönderilen haberler gizleniyor' : 'Tüm haberler gösteriliyor'}
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#1976d2', fontWeight: 600, fontSize: '1.1em' }}>Haberler yükleniyor...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="empty-state">
          <h2>📭 Haber Bulunamadı</h2>
          <p>Seçili kriterlere uygun haber bulunmamaktadır. Filtre ayarlarınızı değiştirmeyi deneyin.</p>
        </div>
      ) : (
        <table className="news-table">
          {filteredNews.map((haber, idx) => {
            const id = haber._id || haber.id || encodeURIComponent(haber.title);
            const score = haber.interest_score || haber.interestScore || (8 - (idx % 4));
            const displayTitle = haber.title_turkish || haber.title_english || haber.title;
            const displaySummary = haber.summary_turkish || haber.summary || haber.content || '';
            const displayContent = haber.content_turkish || haber.content_english || haber.content || haber.summary || '';
            const displayDate = haber.date_turkish || haber.date_english || (haber.pubDate ? new Date(haber.pubDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Güncel');

            const titleKey = `${id}_title_turkish`;
            const summaryKey = `${id}_summary_turkish`;
            const contentKey = `${id}_content_turkish`;

            return (
              <tbody key={id || idx} className={`news-item ${haber.gonderildi ? 'sent-item' : ''}`}>
                
                {/* 1. Başlık */}
                <tr>
                  <th>Başlık <span className="edit-indicator">✏️ düzenlenebilir</span></th>
                  <td className={`news-title ${haber.gonderildi ? 'sent' : ''} editable-field`}>
                    <div
                      className={`editable-content ${modifiedFields[titleKey] ? 'modified' : ''}`}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => setModifiedFields(prev => ({ ...prev, [titleKey]: true }))}
                      onBlur={e => {
                        const newText = e.currentTarget.innerText.trim();
                        if (newText && newText !== displayTitle) {
                          handleSaveField(haber, 'title_turkish', newText);
                        }
                      }}
                    >
                      {displayTitle}
                    </div>
                    <div className="edit-buttons">
                      {savingStatus[titleKey] === 'saving' && <span className="autosave-indicator">kaydediliyor...</span>}
                      {savingStatus[titleKey] === 'saved' && <span className="autosave-indicator" style={{ color: '#4caf50' }}>kaydedildi ✓</span>}
                    </div>
                  </td>
                </tr>

                {/* 2. İlgi Puanı */}
                <tr>
                  <th>İlgi Puanı</th>
                  <td>
                    <span className={`interest-score ${score >= 7 ? 'score-high' : score >= 4 ? 'score-medium' : 'score-low'}`}>
                      {score}/10
                    </span>
                  </td>
                </tr>

                {/* 3. Kaynak */}
                <tr>
                  <th>Kaynak</th>
                  <td><span className="news-source">{haber.source || 'Sağlık Akışı'}</span></td>
                </tr>

                {/* 4. Tarih */}
                <tr>
                  <th>Tarih</th>
                  <td className="news-date">{displayDate}</td>
                </tr>

                {/* 5. Özet */}
                <tr>
                  <th>Özet <span className="edit-indicator">✏️ düzenlenebilir</span></th>
                  <td className="content-cell editable-field">
                    <div
                      className={`editable-content ${modifiedFields[summaryKey] ? 'modified' : ''}`}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => setModifiedFields(prev => ({ ...prev, [summaryKey]: true }))}
                      onBlur={e => {
                        const newText = e.currentTarget.innerText.trim();
                        if (newText && newText !== displaySummary) {
                          handleSaveField(haber, 'summary_turkish', newText);
                        }
                      }}
                    >
                      {displaySummary}
                    </div>
                    <div className="text-stats">
                      <span className="char-count">{displaySummary.length} karakter</span>
                      <span className="word-count">{displaySummary.split(/\s+/).filter(Boolean).length} kelime</span>
                    </div>
                    <div className="edit-buttons">
                      {savingStatus[summaryKey] === 'saving' && <span className="autosave-indicator">kaydediliyor...</span>}
                      {savingStatus[summaryKey] === 'saved' && <span className="autosave-indicator" style={{ color: '#4caf50' }}>kaydedildi ✓</span>}
                    </div>
                  </td>
                </tr>

                {/* 6. İçerik */}
                <tr>
                  <th>İçerik <span className="edit-indicator">✏️ düzenlenebilir</span></th>
                  <td className="content-cell editable-field">
                    <div
                      className={`editable-content ${modifiedFields[contentKey] ? 'modified' : ''}`}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => setModifiedFields(prev => ({ ...prev, [contentKey]: true }))}
                      onBlur={e => {
                        const newText = e.currentTarget.innerText.trim();
                        if (newText && newText !== displayContent) {
                          handleSaveField(haber, 'content_turkish', newText);
                        }
                      }}
                    >
                      {displayContent}
                    </div>
                    <div className="text-stats">
                      <span className="char-count">{displayContent.length} karakter</span>
                      <span className="word-count">{displayContent.split(/\s+/).filter(Boolean).length} kelime</span>
                    </div>
                    <div className="edit-buttons">
                      {savingStatus[contentKey] === 'saving' && <span className="autosave-indicator">kaydediliyor...</span>}
                      {savingStatus[contentKey] === 'saved' && <span className="autosave-indicator" style={{ color: '#4caf50' }}>kaydedildi ✓</span>}
                    </div>
                  </td>
                </tr>

                {/* 7. Etiketler */}
                <tr>
                  <th>Etiketler</th>
                  <td>
                    <div className="news-tags">
                      {(haber.tags && haber.tags.length > 0 ? haber.tags : ['Tıp', 'Sağlık', 'İlk Yardım']).map((tag, tIdx) => (
                        <span key={tIdx} className="news-tag">{tag}</span>
                      ))}
                    </div>
                  </td>
                </tr>

                {/* 8. Kategori */}
                <tr>
                  <th>Kategori</th>
                  <td><span className="news-category">{haber.category || 'Sağlık & Tıp'}</span></td>
                </tr>

                {/* 9. Gönderildi mi? */}
                <tr>
                  <th>Gönderildi mi?</th>
                  <td>
                    {haber.gonderildi ? (
                      <span className="status-sent">✓ Gönderildi</span>
                    ) : (
                      <span className="status-not-sent">○ Gönderilmedi</span>
                    )}
                  </td>
                </tr>

                {/* 10. Kaynak Link */}
                <tr>
                  <th>Kaynak Link</th>
                  <td className="news-link">
                    <a href={haber.link} target="_blank" rel="noopener noreferrer">
                      🔗 Haberin Kaynağına Git
                    </a>
                  </td>
                </tr>

                {/* 11. Action Buttons */}
                <tr>
                  <td colSpan={2} className="action-buttons">
                    <button
                      onClick={() => handleToggleSent(haber)}
                      className="gonderildi-btn"
                    >
                      {haber.gonderildi ? '↩️ Gönderilmedi Yap' : '📤 Gönderildi Olarak İşaretle'}
                    </button>

                    <Link
                      href={`/haber/${id}`}
                      className="whatsapp-btn"
                      style={{ background: '#1976d2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      📝 Gönderim Öncesi Ön İzleme
                    </Link>
                  </td>
                </tr>

                {/* Separator Gradient */}
                <tr className="news-separator">
                  <td colSpan={2}></td>
                </tr>

              </tbody>
            );
          })}
        </table>
      )}

    </div>
  );
}
