import React from 'react';
import { Library, Castle, Bookmark } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'library' | 'castle';
  setActiveTab: (tab: 'library' | 'castle') => void;
  openNotes: () => void;
  brickCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  openNotes,
  brickCount
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-gray-800/80 px-4 py-2 flex items-center justify-around max-w-md mx-auto">
      {/* 1. Library Tab */}
      <button
        onClick={() => setActiveTab('library')}
        role="tab"
        aria-selected={activeTab === 'library'}
        aria-label="Library"
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'library' ? 'text-amber-400 scale-105' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <div className={`p-1.5 rounded-xl ${activeTab === 'library' ? 'bg-amber-500/20 border border-amber-500/40' : ''}`}>
          <Library className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-extrabold tracking-tight">Library</span>
      </button>

      {/* 2. Castle Tab */}
      <button
        onClick={() => setActiveTab('castle')}
        role="tab"
        aria-selected={activeTab === 'castle'}
        aria-label={`Castle — ${brickCount} bricks earned`}
        className={`flex flex-col items-center gap-1 transition-all relative ${
          activeTab === 'castle' ? 'text-emerald-400 scale-105' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <div className={`p-1.5 rounded-xl ${activeTab === 'castle' ? 'bg-emerald-500/20 border border-emerald-500/40' : ''}`}>
          <Castle className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-extrabold tracking-tight">Castle</span>
        {brickCount > 0 && (
          <span className="absolute -top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center border border-amber-300 shadow-md" aria-hidden="true">
            {brickCount}
          </span>
        )}
      </button>

      {/* 3. Saved Notes Drawer Trigger */}
      <button
        onClick={openNotes}
        aria-label="Saved notes"
        className="flex flex-col items-center gap-1 transition-all text-gray-400 hover:text-gray-200"
      >
        <div className="p-1.5 rounded-xl hover:bg-slate-900">
          <Bookmark className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="text-[10px] font-extrabold tracking-tight">Notes</span>
      </button>
    </nav>
  );
};
