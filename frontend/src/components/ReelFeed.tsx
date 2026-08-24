import React from 'react';
import { ByteCard } from '../types';
import { ReelCard } from './ReelCard';
import { Sparkles, ChevronDown } from 'lucide-react';

interface ReelFeedProps {
  cards: ByteCard[];
  onBrickEarned: () => void;
  selectedChapterCount: number;
}

export const ReelFeed: React.FC<ReelFeedProps> = ({ cards, onBrickEarned }) => {
  if (cards.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-gray-800 flex items-center justify-center text-3xl">
          📚
        </div>
        <h3 className="text-lg font-extrabold text-white font-heading">No Reels for Filter</h3>
        <p className="text-xs text-gray-400 max-w-xs">
          Tap the Chapter Filter at top right to choose NCERT Geography or PMF IAS Environment chapters.
        </p>
      </div>
    );
  }

  return (
    <div className="mobile-reel-feed">
      {cards.map(card => (
        <ReelCard key={card.id} card={card} onBrickEarned={onBrickEarned} />
      ))}
    </div>
  );
};
