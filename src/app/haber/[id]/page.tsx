'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { NewsItem } from '@/lib/types';
import AudioPlayer from '@/components/AudioPlayer';

export default function SingleNewsPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Content states for preview/editor
  const [editableText, setEditableText] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // AI Summary
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Audio Player
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news/${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.news && isMounted) {
            setNewsItem(data.news);
            const fullText = formatUnifiedContent(data.news);
            setEditableText(fullText);
            if (data.news.aiSummary) setAiSummary(data.news.aiSummary);
            setLoading(false);
            return;
          }
        }

        // Fallback search
        const allRes = await fetch('/api/news');
        if (allRes.ok) {
          const allData = await allRes.json();
          const decoded = decodeURIComponent(id);
          const found = allData.news?.find((n: any) =>
            n._id === id || n.id === id || n.link === id || n.link === decoded || n.title === decoded
          );
          if (found && isMounted) {
            setNewsItem(found);
            const fullText = formatUnifiedContent(found);
            setEditableText(fullText);
            if (found.aiSummary) setAiSummary(found.aiSummary);
            setLoading(false);
            return;
          }
        }

        if (isMounted) setNotFound(true);
      } catch (err) {
        console.error('Haber yüklenemedi:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();
    return () => { isMounted = false; };
  }, [id]);

  const formatUnifiedContent = (item: NewsItem) => {
    const title = item.title_turkish || item.title_english || item.title || '';
    const summary = item.summary_turkish || item.summary || '';
    const content = item.content_turkish || item.content_english || item.content || '';
    const source = item.source || '';
    const link = item.link || '';

    return `📢 ${title}\n\n📝 ÖZET:\n${summary}\n\n📄 DETAY:\n${content}\n\n🔗 Kaynak: ${source} (${link})`;
  };

  const handleFetchAiSummary = async () => {
    if (!newsItem) return;
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsItem.title,
          content: newsItem.content || newsItem.summary || newsItem.title,
        }),
      });
      const data = await res.json();
      if (data.summary && Array.isArray(data.summary)) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error('AI özetleme hatası:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleToggleSent = async () => {
    if (!newsItem) return;
    const itemId = newsItem._id || newsItem.id;
    try {
      const res = await fetch('/api/gonderildi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, link: newsItem.link, gonderildi: !newsItem.gonderildi })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNewsItem(prev => prev ? { ...prev, gonderildi: data.gonderildi } : null);
        alert(data.message);
      }
    } catch (err) {
      alert('Durum güncellenirken hata oluştu.');
    }
  };

  const handleSaveText = async () => {
    if (!newsItem) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/news/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newsItem._id || newsItem.id,
          link: newsItem.link,
          field: 'content_turkish',
          value: editableText
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsModified(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert('Kayıt sırasında hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(editableText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="preview-container">
        <div style={{ background: 'white', padding: '60px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#1976d2', fontWeight: 600, fontSize: '1.2em' }}>Ön izleme yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (notFound || !newsItem) {
    return (
      <div className="preview-container">
        <div className="empty-state">
          <h2>📭 Haber Bulunamadı</h2>
          <p>İstenen haber mevcut değil veya kaldırılmış olabilir.</p>
          <div style={{ marginTop: '20px' }}>
            <Link href="/" className="btn btn-primary">
              ← Tüm Haberlere Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const score = newsItem.interest_score || newsItem.interestScore || 8;
  const displayTitle = newsItem.title_turkish || newsItem.title_english || newsItem.title;

  return (
    <div className="preview-container">
      
      {/* Preview Header */}
      <div className="preview-header">
        <h1>📝 Gönderim Öncesi Ön İzleme</h1>
        <Link href="/" className="back-link">
          ← Haberlere Dön
        </Link>
      </div>

      {/* Preview Card */}
      <div className="preview-card">
        
        {/* Card Header (Lacivert Gradient) */}
        <div className="preview-card-header">
          <h2>{displayTitle}</h2>
          <div className="preview-meta">
            <span>🏷️ <strong>Kategori:</strong> {newsItem.category || 'Sağlık'}</span>
            <span>🌐 <strong>Kaynak:</strong> {newsItem.source || 'Haber Servisi'}</span>
            <span>⭐ <strong>İlgi Puanı:</strong> {score}/10</span>
            <span>📅 <strong>Tarih:</strong> {newsItem.pubDate ? new Date(newsItem.pubDate).toLocaleDateString('tr-TR') : 'Güncel'}</span>
            <span>{newsItem.gonderildi ? '✅ Gönderildi' : '⏳ Gönderilmedi'}</span>
          </div>
        </div>

        {/* AI 3-Maddelik Özet Kutusu */}
        <div style={{ padding: '20px 25px 0 25px' }}>
          <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', padding: '15px 20px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ color: '#2e7d32', fontSize: '0.95em' }}>🤖 SAHRA AI TIBBİ 3-MADDE ÖZETİ</strong>
              {!aiSummary && (
                <button
                  onClick={handleFetchAiSummary}
                  disabled={loadingAi}
                  className="btn btn-success"
                  style={{ padding: '5px 12px', fontSize: '0.8em' }}
                >
                  {loadingAi ? 'AI Hazırlıyor...' : 'AI Özeti Oluştur'}
                </button>
              )}
            </div>

            {aiSummary ? (
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#1b5e20', fontSize: '0.9em', lineHeight: '1.6' }}>
                {aiSummary.map((pt, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{pt}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: '#388e3c', fontSize: '0.85em' }}>
                Yapay Zeka hekim modeliyle 3 maddelik hap bilgiyi oluşturmak için butona basabilirsiniz.
              </p>
            )}
          </div>
        </div>

        {/* Card Body & Unified Editor */}
        <div className="preview-card-body">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333', fontSize: '0.95em' }}>
            ✏️ Gönderim Metni (Düzenlenebilir):
          </label>
          <textarea
            className={`unified-editor ${isModified ? 'modified' : ''}`}
            value={editableText}
            onChange={e => {
              setEditableText(e.target.value);
              setIsModified(true);
            }}
          />
        </div>

        {/* Action Bar */}
        <div className="action-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleSaveText}
              disabled={isSaving || !isModified}
              className="btn btn-success"
            >
              {isSaving ? 'Kaydediliyor...' : '💾 Değişiklikleri Kaydet'}
            </button>

            <button
              onClick={handleCopyText}
              className="btn btn-primary"
            >
              📋 Metni Kopyala
            </button>

            <button
              onClick={() => setIsPlayingAudio(true)}
              className="btn"
              style={{ background: '#7b1fa2', color: 'white' }}
            >
              🎧 Sesli Dinle
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleSent}
              className="btn btn-danger"
            >
              {newsItem.gonderildi ? '↩️ Gönderilmedi Yap' : '📤 Gönderildi Olarak İşaretle'}
            </button>

            {newsItem.link && (
              <a
                href={newsItem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                🔗 Kaynağa Git
              </a>
            )}
          </div>
        </div>

      </div>

      {saveSuccess && (
        <div style={{ marginTop: '15px', background: '#c8e6c9', color: '#2e7d32', padding: '12px 20px', borderRadius: '6px', textAlign: 'center', fontWeight: 600 }}>
          ✓ Metin başarıyla kaydedildi!
        </div>
      )}

      {copySuccess && (
        <div style={{ marginTop: '15px', background: '#bbdefb', color: '#1565c0', padding: '12px 20px', borderRadius: '6px', textAlign: 'center', fontWeight: 600 }}>
          ✓ Metin panoya kopyalandı!
        </div>
      )}

      {/* Floating Audio Player */}
      {isPlayingAudio && (
        <AudioPlayer
          title={displayTitle}
          textToSpeak={editableText}
          onClose={() => setIsPlayingAudio(false)}
        />
      )}

    </div>
  );
}
