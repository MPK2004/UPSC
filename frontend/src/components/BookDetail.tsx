import React, { useEffect, useState } from 'react';
import { Book, Chapter } from '../types';
import { getBookWithChapters } from '../utils/bookData';
import { ArrowLeft, Loader2, AlertTriangle, Clock } from 'lucide-react';

interface BookDetailProps {
  bookId: string;
  onBack: () => void;
  onSelectChapter: (chapterId: string, chapterTitle: string) => void;
}

const IMPORTANCE_STYLE: Record<string, string> = {
  High: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  Low: 'bg-slate-700/40 text-gray-300 border-gray-600',
};

function chapterStatusNote(status: Chapter['status']) {
  if (status === 'failed') return 'Processing failed';
  if (status !== 'ready') return 'Preparing…';
  return null;
}

export const BookDetail: React.FC<BookDetailProps> = ({ bookId, onBack, onSelectChapter }) => {
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getBookWithChapters(bookId).then(res => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else {
        setBook(res.book);
        setChapters(res.chapters);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [bookId, refreshKey]);

  const BackButton = (
    <button
      onClick={onBack}
      aria-label="Back to library"
      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white mb-3"
    >
      <ArrowLeft className="w-4 h-4" /> Library
    </button>
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 pt-16 pb-24">
        {BackButton}
        <div className="h-[60vh] flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs font-semibold">Loading book…</span>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-2xl mx-auto p-4 pt-16 pb-24">
        {BackButton}
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-center p-6">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
          <p className="text-xs text-gray-400 max-w-xs">{error || 'Book not found.'}</p>
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
    <div className="max-w-2xl mx-auto p-4 pt-16 pb-24 space-y-4">
      {BackButton}

      <h1 className="text-xl font-extrabold text-white font-heading">{book.title}</h1>

      {book.status !== 'ready' && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2 ${
          book.status === 'failed'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            : 'bg-slate-800/60 border-gray-700 text-gray-300'
        }`}>
          {book.status === 'failed' ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <p className="leading-snug">
            {book.status === 'failed'
              ? `This book failed to process${book.error_message ? `: ${book.error_message}` : '.'}`
              : 'This book is still being processed — some chapters may not be ready yet.'}
          </p>
        </div>
      )}

      {book.approach_guide && (
        <div className="glass-panel p-4 bg-slate-900/60 border-gray-800 space-y-1.5">
          <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">How to approach this book</h2>
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{book.approach_guide}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider px-1">Chapters</h2>
        {chapters.length === 0 && (
          <p className="text-xs text-gray-500 px-1">No chapters extracted yet.</p>
        )}
        {chapters.map(ch => {
          const note = chapterStatusNote(ch.status);
          return (
            <button
              key={ch.id}
              onClick={() => onSelectChapter(ch.id, ch.title)}
              className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 bg-slate-900/60 border-gray-800 hover:border-gray-700 ${note ? 'opacity-70' : ''}`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-white">
                    Ch {ch.chapter_number ?? '—'}: {ch.title}
                  </span>
                  {ch.importance_label && (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${IMPORTANCE_STYLE[ch.importance_label]}`}>
                      {ch.importance_label}
                    </span>
                  )}
                </div>
                {note && <p className="text-[11px] text-gray-500">{note}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
