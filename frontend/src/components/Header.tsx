import React, { useState, useEffect } from 'react';
import { Castle, BookOpen, Scroll, CheckCircle2, Bookmark, StickyNote } from 'lucide-react';

interface HeaderProps {
  activeTab: 'reels' | 'test' | 'castle';
  setActiveTab: (tab: 'reels' | 'test' | 'castle') => void;
  brickCount: number;
  openNotes: () => void;
  selectedChapterCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  brickCount,
  openNotes,
  selectedChapterCount
}) => {
  // UPSC CSE Prelims 2027 Target Date (~May 23, 2027)
  const [daysLeft, setDaysLeft] = useState<number>(0);

  useEffect(() => {
    const targetDate = new Date('2027-05-23T00:00:00');
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-panel sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-gray-800 rounded-none bg-slate-950/90">
      {/* Brand & Target Countdown */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Castle className="w-6 h-6 text-slate-950" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
            UPSC ReelCastle <span className="text-xs px-2 py-0.5 rounded-full badge-gold font-semibold">2027</span>
          </h1>
          <p className="text-xs text-amber-400 font-medium">
            🎯 {daysLeft} Days to Prelims 2027
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-gray-800">
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'reels'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Scroll className="w-3.5 h-3.5" />
          ByteReels
          {selectedChapterCount > 0 && (
            <span className="ml-1 bg-slate-950 text-sky-400 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {selectedChapterCount} Ch
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'test'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          PYQ Arena
        </button>

        <button
          onClick={() => setActiveTab('castle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'castle'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Castle className="w-3.5 h-3.5" />
          Castle ({brickCount})
        </button>
      </div>

      {/* Quick Action: Notes & Bookmarks */}
      <div className="flex items-center gap-2">
        <button
          onClick={openNotes}
          className="p-2 rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:text-amber-400 hover:border-amber-500/40 transition-all flex items-center gap-1 text-xs"
          title="Saved Notes & Bookmarks"
        >
          <StickyNote className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline font-medium">Notes</span>
        </button>
      </div>
    </header>
  );
};
