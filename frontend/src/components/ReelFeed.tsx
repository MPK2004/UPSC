import React, { useRef } from 'react';
import { ByteCard } from '../types';
import { ReelCard } from './ReelCard';
import { ChevronDown, Sparkles } from 'lucide-react';

interface ReelFeedProps {
  cards: ByteCard[];
  onBrickEarned: () => void;
  selectedChapterCount: number;
}

export const ReelFeed: React.FC<ReelFeedProps> = ({ cards, onBrickEarned, selectedChapterCount }) => {
  const feedRef = useRef<HTMLDivElement>(null);

  if (cards.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-gray-800 flex items-center justify-center text-3xl">
          📚
        </div>
        <h3 className="text-xl font-bold text-white">No ByteReels for Selected Filter</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Select 1 or 2 chapters from the top chapter bar to generate your byte-sized learning feed!
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full flex justify-center bg-slate-950">
      {/* Scroll Tip overlay */}
      <div className="absolute top-3 z-20 bg-slate-900/90 border border-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 backdrop-blur-md shadow-lg">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span>Swipe / Scroll vertical for next Reel</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 animate-bounce" />
      </div>

      {/* Snap Scroll Feed Container */}
      <div ref={feedRef} className="reel-feed-container w-full max-w-lg py-4 space-y-6">
        {cards.map(card => (
          <div key={card.id} className="reel-card-item">
            <ReelCard card={card} onBrickEarned={onBrickEarned} />
          </div>
        ))}
      </div>
    </div>
  );
};
