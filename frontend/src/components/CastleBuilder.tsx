import React from 'react';
import { Castle, Award, Trophy, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';

interface CastleBuilderProps {
  brickCount: number;
  totalAvailableBricks: number;
  masteredIds: string[];
}

export const CastleBuilder: React.FC<CastleBuilderProps> = ({
  brickCount,
  totalAvailableBricks,
  masteredIds
}) => {
  const percentage = Math.min(100, Math.round((brickCount / Math.max(1, totalAvailableBricks)) * 100));

  // Castle levels based on bricks
  let castleTitle = 'Novice Aspirant Keep';
  if (brickCount >= 8) castleTitle = 'Imperial Citadel of UPSC 2027';
  else if (brickCount >= 5) castleTitle = 'Fortress of Geomorphology & Ecology';
  else if (brickCount >= 3) castleTitle = 'Bastion of NCERT Knowledge';

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Castle Header Card */}
      <div className="glass-panel p-6 text-center space-y-4 relative overflow-hidden bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/30">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/30">
          <Castle className="w-9 h-9 text-slate-950" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {castleTitle}
          </h2>
          <p className="text-xs text-amber-400 font-semibold mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Brick-by-Brick Micro-Learning Architecture
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 max-w-md mx-auto pt-2">
          <div className="flex justify-between text-xs font-bold text-gray-300">
            <span>Castle Construction Progress</span>
            <span className="text-amber-400">{percentage}% ({brickCount} / {totalAvailableBricks} Bricks)</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full border border-gray-800 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700 shadow-md shadow-amber-500/50"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Castle Grid Wall */}
      <div className="glass-panel p-5 space-y-3 bg-slate-950 border-gray-800">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Mastered Knowledge Bricks
        </h3>

        <div className="castle-grid">
          {Array.from({ length: Math.max(12, totalAvailableBricks) }).map((_, idx) => {
            const isMastered = idx < brickCount;
            return (
              <div
                key={idx}
                className={`brick flex items-center justify-center text-[10px] font-bold ${
                  isMastered ? 'mastered text-slate-950' : 'text-gray-600'
                }`}
                title={isMastered ? `Brick #${idx + 1} Mastered!` : `Brick #${idx + 1} Locked`}
              >
                {isMastered ? '🧱' : `#${idx + 1}`}
              </div>
            );
          })}
        </div>
      </div>

      {/* UPSC 2027 Strategy Note */}
      <div className="glass-panel p-4 bg-slate-900/60 border-sky-500/30 text-xs text-sky-200 flex items-start gap-3">
        <Award className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sky-400 block text-xs">UPSC 2027 Castle Strategy</span>
          <p className="text-gray-300 leading-relaxed">
            Every reel card swiped and PYQ test passed places a solid brick in your memory. By stacking 100+ bricks during office breaks, you construct an unshakeable castle of prelims knowledge before 2027!
          </p>
        </div>
      </div>
    </div>
  );
};
