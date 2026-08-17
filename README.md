# 🩺 Sahra Sıhhiye Okulu - Askeri & Sivil Sağlık, Tıp ve İlk Yardım Portalı

Yapay Zeka (OpenRouter & Google Gemini AI) destekli, **Next.js 14/15 (App Router)**, **TypeScript**, **Tailwind CSS** (Medikal Mavi & Beyaz & Kırmızı Tema) ve **MongoDB Atlas** kullanılarak sıfırdan geliştirilmiş modern sahra ve tıp portalı.

---

## 🌟 Öne Çıkan İnovatif Modüller

1. **🏥 Canlı Sağlık & Sıhhiye Akışı (`/`):** T.C. Sağlık Bakanlığı, Askeri Tıp ve Medikal Akademi kaynaklarından otomatik canlı haber akışı.
2. **🚑 Sahra & Acil İlk Yardım Rehberi (`/ilk-yardim`):** Taktik Turnike (Tourniquet / TCCC), Kalp Masajı (CPR), Heimlich Manevrası, Sahra Yanık ve Kırık Atelleme adımları.
3. **📊 Tıbbi Hesaplayıcılar (`/hesaplayicilar`):** Vücut Kitle İndeksi (VKİ), Günlük İdeal Su İhtiyacı ve Bazal Metabolizma Hızı (BMH).
4. **💊 Canlı Nöbetçi Eczaneler (`/nobetci-eczaneler`):** İl ve ilçe seçimi ile nöbetçi eczane konumu, telefon ve Google Maps yol tarifi.
5. **🧠 AI Tıbbi Terim Sözlüğü & 3 Maddede Haber Özeti:** OpenRouter (Ücretsiz Gemini 2.0 / Llama 3.3) veya Google Gemini ile tıbbi Latince terimlerin üzerine gelindiğinde anında açıklama.
6. **🎧 Sesli Haber Dinle (Audio Player):** Haberleri canlı sesli okuma oynatıcısı.
7. **💡 Günün Sıhhiye Bilgisi & Quiz (`/quiz`):** 5 soruluk ilk yardım ve tıp testi.
8. **🔒 Yönetici Paneli (`/admin`):** Giriş şifresi: `12345678`. OpenRouter, Gemini ve ElevenLabs API anahtarlarını arayüzden tek tıkla ekleme/yönetme.

---

## 🚀 GitHub ve Vercel Üzerinde Yayına Alma

```bash
git init
git add .
git commit -m "feat: Sahra Sihhiye Okulu Next.js v2.0 tam surum"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/sahra-sihhiye.git
git push -u origin main --force
```

### Vercel Ortam Değişkenleri (Environment Variables):
- `MONGODB_URI`: `mongodb+srv://aliaribas:aliaribas@airsoft1.q6eejuz.mongodb.net/?retryWrites=true&w=majority&appName=airsoft1`
- `MONGODB_DB`: `okulsahrasihhiye` (veya `okulmebs`)
- `DBNAME`: `okulsahrasihhiye`
- `ADMIN_PASSWORD`: `12345678`
