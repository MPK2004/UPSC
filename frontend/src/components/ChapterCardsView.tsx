import React, { useEffect, useState } from 'react';
import { ByteCard, PYQQuestion } from '../types';
import { getCardsForChapter, getPyqsForChapter } from '../utils/bookData';
import { ReelFeed } from './ReelFeed';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

interface ChapterCardsViewProps {
  chapterId: string;
  onBack: () => void;
  onBrickEarned: () => void;
}

export const ChapterCardsView: React.FC<ChapterCardsViewProps> = ({ chapterId, onBack, onBrickEarned }) => {
  const [cards, setCards] = useState<ByteCard[]>([]);
  const [pyqs, setPyqs] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getCardsForChapter(chapterId), getPyqsForChapter(chapterId)]).then(([cardsRes, pyqsRes]) => {
      if (cancelled) return;
      if (cardsRes.error) setError(cardsRes.error);
      else {
        setCards(cardsRes.data);
        setPyqs(pyqsRes.data);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [chapterId, refreshKey]);

  const BackBar = (
    <button
      onClick={onBack}
      aria-label="Back to chapter"
      className="fixed top-2.5 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-gray-700 text-xs font-bold text-gray-200"
    >
      <ArrowLeft className="w-3.5 h-3.5" /> Chapter
    </button>
  );

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2 text-gray-400">
        {BackBar}
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-xs font-semibold">Loading cards…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3 text-center p-6">
        {BackBar}
        <AlertTriangle className="w-8 h-8 text-rose-400" />
        <p className="text-xs text-gray-400 max-w-xs">{error}</p>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-gray-700 text-xs font-bold text-gray-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {BackBar}
      <ReelFeed cards={cards} pyqs={pyqs} onBrickEarned={onBrickEarned} />
    </>
  );
};
