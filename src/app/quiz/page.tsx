'use client';

import React, { useState } from 'react';

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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      <div className="page-header">
        <h1>💡 Sahra Sıhhiye Bilgi Quizi</h1>
        <span className="news-count">Soru {currentIdx + 1} / {QUIZ_QUESTIONS.length}</span>
      </div>

      <div className="card">
        {!isCompleted ? (
          <div>
            <div className="card-header" style={{ background: '#f5f5f5' }}>
              <h3 style={{ margin: 0, color: '#1a237e' }}>{currentQ.question}</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {currentQ.options.map((opt, idx) => {
                  let bg = '#fff';
                  let border = '1px solid #ddd';
                  let textColor = '#333';

                  if (selectedOption !== null) {
                    if (idx === currentQ.correct) {
                      bg = '#c8e6c9';
                      border = '2px solid #2e7d32';
                      textColor = '#2e7d32';
                    } else if (idx === selectedOption) {
                      bg = '#ffcdd2';
                      border = '2px solid #c62828';
                      textColor = '#c62828';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={selectedOption !== null}
                      style={{
                        padding: '14px 18px',
                        background: bg,
                        border: border,
                        borderRadius: '6px',
                        textAlign: 'left',
                        fontSize: '0.95em',
                        fontWeight: 500,
                        color: textColor,
                        cursor: selectedOption === null ? 'pointer' : 'default',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedOption !== null && (
                <div style={{ background: '#e3f2fd', color: '#0d47a1', padding: '15px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9em' }}>
                  <strong>Açıklama:</strong> {currentQ.explanation}
                </div>
              )}

              {selectedOption !== null && (
                <button
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  {currentIdx + 1 < QUIZ_QUESTIONS.length ? 'Sonraki Soruya Geç ➔' : 'Sonuçları Gör 🏆'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <h2>🏆 Testi Tamamladınız!</h2>
            <div style={{ fontSize: '3em', fontWeight: 'bold', color: '#1a237e', margin: '20px 0' }}>
              {score} / 100
            </div>
            <p style={{ color: '#666', marginBottom: '25px' }}>
              {score >= 80 ? 'Tebrikler! Sağlık ve ilk yardım bilginiz mükemmel.' : 'Güzel deneme! Haberleri okuyarak bilginizi tazeleyebilirsiniz.'}
            </p>
            <button onClick={handleRestart} className="btn btn-primary">
              🔄 Testi Tekrar Başlat
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
