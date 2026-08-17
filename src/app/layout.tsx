import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Sahra Sıhhiye Okulu | Askeri & Sivil Sağlık, Tıp ve İlk Yardım Portalı',
  description: 'Sahra Sıhhiye Okulu: Yapay zeka destekli güncel sağlık ve tıp haberleri, taktik sahra ilk yardım rehberleri, nöbetçi eczaneler ve tıbbi hesaplayıcılar.',
  keywords: ['sahra sıhhiye okulu', 'sahra sıhhiye', 'askeri tıp', 'ilk yardım', 'sağlık haberleri', 'nöbetçi eczane', 'tıp portalı', 'tccc'],
  openGraph: {
    title: 'Sahra Sıhhiye Okulu | Askeri & Sivil Sağlık Portalı',
    description: 'Yapay Zeka Destekli Sahra Sıhhiye ve Güncel Tıp Portalı',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-medical-600 selection:text-white">
        <Navbar />
        <main className="flex-1 bg-slate-50">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
