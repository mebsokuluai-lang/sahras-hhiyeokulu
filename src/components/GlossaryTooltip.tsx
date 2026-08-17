'use client';

import React, { useState } from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

interface GlossaryTooltipProps {
  term: string;
  definition?: string;
  children: React.ReactNode;
}

export default function GlossaryTooltip({ term, definition, children }: GlossaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(definition || null);
  const [loading, setLoading] = useState(false);

  const fetchTerm = async () => {
    if (aiExplanation) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/explain-term?term=${encodeURIComponent(term)}`);
      const data = await res.json();
      setAiExplanation(data.explanation || `${term}: Tıbbi bir terimdir.`);
    } catch {
      setAiExplanation(`${term}: Tıbbi kavram.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span
      className="relative inline-block border-b-2 border-dashed border-emerald-400 cursor-help font-semibold text-emerald-300 group"
      onMouseEnter={() => {
        setIsOpen(true);
        fetchTerm();
      }}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      
      {isOpen && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-2xl z-50 text-xs text-slate-200 pointer-events-none block transition-all animate-in fade-in zoom-in-95">
          <span className="flex items-center space-x-1.5 font-bold text-emerald-400 mb-1 border-b border-slate-800 pb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tıbbi Sözlük: {term}</span>
          </span>
          {loading ? (
            <span className="text-slate-400 italic animate-pulse">Açıklama hazırlanıyor...</span>
          ) : (
            <span>{aiExplanation}</span>
          )}
        </span>
      )}
    </span>
  );
}
