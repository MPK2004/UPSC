import React, { useEffect, useState } from 'react';
import { Chapter } from '../types';
import { getChapter } from '../utils/bookData';
import { ArrowLeft, Loader2, AlertTriangle, Film, BookOpen, Link2, ShieldCheck } from 'lucide-react';

interface ChapterDetailProps {
  chapterId: string;
  onBack: () => void;
  onStudyCards: () => void;
  onTakeQuiz: () => void;
}

const IMPORTANCE_STYLE: Record<string, string> = {
  High: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  Low: 'bg-slate-700/40 text-gray-300 border-gray-600',
};

export const ChapterDetail: React.FC<ChapterDetailProps> = ({ chapterId, onBack, onStudyCards, onTakeQuiz }) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getChapter(chapterId).then(res => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else setChapter(res.chapter);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [chapterId, refreshKey]);

  const BackButton = (
    <button
      onClick={onBack}
      aria-label="Back to book"
      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white mb-3"
    >
      <ArrowLeft className="w-4 h-4" /> Book
    </button>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 pt-16 pb-24">
        {BackButton}
        <div className="h-[60vh] flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs font-semibold">Loading chapter…</span>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="max-w-2xl mx-auto p-4 pt-16 pb-24">
        {BackButton}
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-center p-6">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
          <p className="text-xs text-gray-400 max-w-xs">{error || 'Chapter not found.'}</p>
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

  const notReady = chapter.status !== 'ready';
  const reason = chapter.status === 'failed'
    ? 'Processing failed for this chapter.'
    : chapter.status === 'pending' || chapter.status === 'processing'
      ? 'Still being prepared — check back soon.'
      : null;

  return (
    <div className="max-w-2xl mx-auto p-4 pt-16 pb-24 space-y-4">
      {BackButton}

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-extrabold text-white font-heading">
            Ch {chapter.chapter_number ?? '—'}: {chapter.title}
          </h1>
          {chapter.importance_label && (
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${IMPORTANCE_STYLE[chapter.importance_label]}`}>
              {chapter.importance_label} yield
            </span>
          )}
        </div>
      </div>

      {chapter.importance_note && (
        <div className="glass-panel p-4 bg-slate-900/60 border-gray-800 space-y-1.5">
          <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Why this matters</h2>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{chapter.importance_note}</p>
        </div>
      )}

      {chapter.approach_guide && (
        <div className="glass-panel p-4 bg-slate-900/60 border-gray-800 space-y-1.5">
          <h2 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">How to approach it</h2>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{chapter.approach_guide}</p>
        </div>
      )}

      {chapter.sources && chapter.sources.length > 0 && (
        <div className="glass-panel p-4 bg-slate-900/60 border-gray-800 space-y-2">
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Sources</h2>
          <ul className="space-y-1.5">
            {chapter.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 text-xs text-sky-300 hover:text-sky-200 leading-snug"
                >
                  <Link2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span className="underline underline-offset-2">{s.title}</span>
                  {s.tier === 'official' && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex-shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5" /> Official
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reason && (
        <p className="text-xs text-gray-500 text-center">{reason}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onStudyCards}
          disabled={notReady}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:shadow-none active:scale-98 transition-all"
        >
          <Film className="w-4 h-4" /> Study Cards
        </button>
        <button
          onClick={onTakeQuiz}
          disabled={notReady}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-500 text-white font-black text-sm shadow-lg shadow-sky-500/30 disabled:opacity-40 disabled:shadow-none active:scale-98 transition-all"
        >
          <BookOpen className="w-4 h-4" /> Take Quiz
        </button>
      </div>
    </div>
  );
};
