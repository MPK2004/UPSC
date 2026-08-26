import React from 'react';
import { Castle } from 'lucide-react';

export const Header: React.FC = () => {
  // Days to UPSC Prelims 2027 (~May 23, 2027)
  const targetDate = new Date('2027-05-23');
  const now = new Date();
  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-gray-800/60 px-4 py-2.5 flex items-center justify-between max-w-md mx-auto">
      {/* Brand Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Castle className="w-4 h-4 text-slate-950" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1 font-heading">
            UPSC ReelCastle <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">2027</span>
          </h1>
          <span className="text-[10px] text-gray-400 font-semibold block -mt-0.5">
            ⏳ {diffDays} Days to Prelims
          </span>
        </div>
      </div>
    </header>
  );
};
