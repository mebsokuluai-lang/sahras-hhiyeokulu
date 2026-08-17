'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Radio, X } from 'lucide-react';

interface AudioPlayerProps {
  title?: string;
  textToSpeak?: string;
  onClose?: () => void;
}

export default function AudioPlayer({ title, textToSpeak, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && textToSpeak) {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'tr-TR';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlaying(false);
      setSpeech(utterance);
    }
  }, [textToSpeak]);

  const togglePlay = () => {
    if (!speech || typeof window === 'undefined') return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.speak(speech);
      }
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    if (onClose) onClose();
  };

  if (!textToSpeak) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 p-4 rounded-2xl shadow-2xl max-w-sm w-full text-white flex items-center justify-between space-x-3">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div className="truncate">
          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
            SAĞLIK OKULU PODS • SESLİ DİNLE
          </span>
          <p className="text-xs font-semibold truncate text-slate-200">{title || 'Sesli Haber Çaları'}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:scale-105 transition font-bold shadow-md shadow-emerald-500/30"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          onClick={handleClose}
          className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
