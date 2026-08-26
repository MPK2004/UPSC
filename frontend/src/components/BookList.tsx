import React, { useEffect, useState } from 'react';
import { Book } from '../types';
import { listBooks } from '../utils/bookData';
import { subjectColor } from '../utils/subjectColor';
import { BookOpen, Loader2, AlertTriangle, Clock } from 'lucide-react';

interface BookListProps {
  onSelectBook: (bookId: string) => void;
}

function statusBadge(status: Book['status']) {
  switch (status) {
    case 'ready':
      return null;
    case 'failed':
      return (
        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> Processing failed
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-gray-400 border border-gray-700 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> Still being prepared
        </span>
      );
  }
}

export const BookList: React.FC<BookListProps> = ({ onSelectBook }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listBooks().then(res => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else setBooks(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-xs font-semibold">Loading library…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3 text-center p-6">
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

  if (books.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
        <BookOpen className="w-10 h-10 text-gray-500" />
        <h3 className="text-lg font-extrabold text-white font-heading">No books yet</h3>
        <p className="text-xs text-gray-400 max-w-xs">
          Ask your admin to queue a book for processing.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pt-16 pb-24 space-y-3">
      <h2 className="text-sm font-extrabold text-gray-300 uppercase tracking-wider px-1">Library</h2>
      {books.map(book => {
        const palette = subjectColor(book.subject);
        const notReady = book.status !== 'ready';
        return (
          <button
            key={book.id}
            onClick={() => onSelectBook(book.id)}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 bg-slate-900/60 border-gray-800 hover:border-gray-700 ${notReady ? 'opacity-70' : ''}`}
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {book.subject && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${palette.bg} ${palette.text} border ${palette.border}`}>
                    {book.subject}
                  </span>
                )}
                {statusBadge(book.status)}
              </div>
              <span className="text-sm font-extrabold text-white block truncate">{book.title}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
