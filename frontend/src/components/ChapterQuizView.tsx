import React, { useEffect, useState } from 'react';
import { PYQQuestion } from '../types';
import { getPyqsForChapter } from '../utils/bookData';
import { TestingArena } from './TestingArena';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

interface ChapterQuizViewProps {
  chapterId: string;
  chapterTitle: string;
  onBack: () => void;
  onBrickUnlocked: () => void;
}

export const ChapterQuizView: React.FC<ChapterQuizViewProps> = ({ chapterId, chapterTitle, onBack, onBrickUnlocked }) => {
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPyqsForChapter(chapterId).then(res => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else setQuestions(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [chapterId, refreshKey]);

  const BackButton = (
    <button
      onClick={onBack}
      aria-label="Back to chapter"
      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white mb-3 px-4 pt-16"
    >
      <ArrowLeft className="w-4 h-4" /> Chapter
    </button>
  );

  if (loading) {
    return (
      <div>
        {BackButton}
        <div className="h-[60vh] flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs font-semibold">Loading quiz…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {BackButton}
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-center p-6">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
          <p className="text-xs text-gray-400 max-w-xs">{error}</p>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-gray-700 text-xs font-bold text-gray-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {BackButton}
      <TestingArena questions={questions} chapterTitle={chapterTitle} onBrickUnlocked={onBrickUnlocked} />
    </div>
  );
};
