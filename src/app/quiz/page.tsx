'use client';

import React, { useState } from 'react';
import { BrainCircuit, Award, CheckCircle2, XCircle, RotateCcw, Lightbulb } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Sahra ve muharebe sahasında uzuvlardaki ağır kanamayı durdurmak için uygulanan en etkili ilk müdahale yöntemi hangisidir?',
    options: ['Turnike (Tourniquet) Uygulaması', 'Yaraya Su Dökmek', 'Sıcak Havlu Koymak', 'Yaralıyı Koşturmak'],
    correct: 0,
    explanation: 'Taktik Muharebe Yaralı Bakımı (TCCC) kılavuzuna göre uzuvlardaki fışkırır tarzdaki arteriyel kanamalarda derhal turnike uygulanır.',
  },
  {
    id: 2,
    question: 'Yetişkin bir insanda dinlenme halindeki normal nabız (kalp atım sayısı) dakikada kaçtır?',
    options: ['30 - 45', '60 - 100', '120 - 150', '160 - 200'],
    correct: 1,
    explanation: 'Sağlıklı bir yetişkinin dinlenme anındaki normal nabzı dakikada 60-100 atım arasındadır.',
  },
  {
    id: 3,
    question: 'Soluk borusu yabancı bir cisimle tam tıkanan ve konuşamayan kişiye uygulanan hayat kurtarıcı manevra hangisidir?',
    options: ['Heimlich Manevrası', 'Valsalva Manevrası', 'Trendelenburg', 'Rentek Manevrası'],
    correct: 0,
    explanation: 'Heimlich manevrası diyafram altına uygulanan basınçla soluk borusundaki cismin dışarı fırlatılmasını sağlar.',
  },
  {
    id: 4,
    question: 'Güneş ışığıyla (UVB) ciltte sentezlenen ve kemik ile bağışıklık sistemi için kritik olan vitamin hangisidir?',
    options: ['A Vitamini', 'B12 Vitamini', 'D Vitamini', 'K Vitamini'],
    correct: 2,
    explanation: 'D vitamini güneş ışığı etkisiyle deride sentezlenir ve kalsiyum emilimi ile bağışıklık fonksiyonları için gereklidir.',
  },
  {
    id: 5,
    question: 'Bayılan veya geçici bilinç kaybı yaşayan bir kazazedeye beyin kan akışını artırmak için hangi pozisyon verilir?',
    options: ['Şok Pozisyonu (Bacaklar 30 cm yukarı)', 'Yüzüstü Yatırma', 'Sandalyede Oturtma', 'Ayakta Yürütme'],
    correct: 0,
    explanation: 'Şok pozisyonunda bacaklar yaklaşık 30 cm kaldırılarak kalbe ve beyne venöz kan dönüşü desteklenir.',
  },
];

export default function QuizPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIdx];

  const handleOptionSelect = (optionIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);

    if (optionIdx === currentQ.correct) {
      setScore(prev => prev + 20);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-slate-50">
      
      {/* Günün Sıhhiye Bilgisi Card */}
      <div className="bg-white border border-medical-200 p-6 md:p-8 rounded-3xl space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 text-medical-700 font-extrabold text-xs uppercase tracking-wider">
          <Lightbulb className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>GÜNÜN SAHRA SIHHİYE & TIP BİLGİSİ</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900">
          Taktik Turnike ve Kanama Kontrolünde Altın Kural
        </h2>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
          Sahra ve acil durumlarda ölümcül uzuv kanamalarına ilk 3 dakika içinde doğru turnike uygulanması hayatta kalma oranını %90&apos;ın üzerine çıkarır. Turnikenin takıldığı saat (Örn: 14:30) mutlaka turnike bandının üzerine not edilmelidir.
        </p>
      </div>

      {/* Quiz Section */}
      <div className="bg-white border border-slate-200 p-6 md:p-10 rounded-3xl space-y-6 shadow-sm">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2 text-medical-600 font-extrabold text-sm uppercase">
            <BrainCircuit className="w-5 h-5" />
            <span>SAHRA SIHHİYE & İLK YARDIM TESTİ</span>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1 rounded-full border border-slate-200">
            Soru {currentIdx + 1} / {QUIZ_QUESTIONS.length}
          </span>
        </div>

        {!isCompleted ? (
          <div className="space-y-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'bg-slate-50 border-slate-200 hover:border-medical-500 text-slate-800 font-medium';
                
                if (selectedOption !== null) {
                  if (idx === currentQ.correct) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-red-50 border-red-500 text-red-800 font-bold';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={selectedOption !== null}
                    className={`w-full p-4 rounded-2xl border text-left text-xs md:text-sm transition-all flex items-center justify-between shadow-sm ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && idx === currentQ.correct && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {selectedOption !== null && idx === selectedOption && idx !== currentQ.correct && (
                      <XCircle className="w-5 h-5 text-medical-red shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after choice */}
            {selectedOption !== null && (
              <div className="p-4 rounded-2xl bg-medical-50 border border-medical-200 text-xs text-medical-900 space-y-1 animate-in fade-in">
                <span className="font-bold block text-medical-700">TIBBİ AÇIKLAMA:</span>
                <p>{currentQ.explanation}</p>
              </div>
            )}

            {selectedOption !== null && (
              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-black text-sm transition shadow-md shadow-medical-600/20"
              >
                {currentIdx + 1 < QUIZ_QUESTIONS.length ? 'Sonraki Soruya Geç' : 'Sonuçları Gör'}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-6 animate-in zoom-in-95">
            <Award className="w-16 h-16 text-medical-600 mx-auto animate-bounce" />
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Tebrikler! Testi Tamamladınız</h2>
              <span className="text-5xl font-black text-medical-600 block py-2">{score} / 100 PUAN</span>
              <p className="text-xs text-slate-600 font-medium">
                {score >= 80 ? 'Mükemmel! Sahra sıhhiye ve ilk yardım bilginiz üst seviyede.' : 'Güzel deneme! Makaleleri okuyarak bilginizi geliştirebilirsiniz.'}
              </p>
            </div>

            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-bold text-xs inline-flex items-center space-x-2 shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Testi Yeniden Başlat</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
