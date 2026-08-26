import React from 'react';
import { ByteCard, PYQQuestion } from '../types';
import { ReelCard } from './ReelCard';

interface ReelFeedProps {
  cards: ByteCard[];
  onBrickEarned: () => void;
  pyqs?: PYQQuestion[];
}

export const ReelFeed: React.FC<ReelFeedProps> = ({ cards, onBrickEarned, pyqs }) => {
  if (cards.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-gray-800 flex items-center justify-center text-3xl">
          📚
        </div>
        <h3 className="text-lg font-extrabold text-white font-heading">No Cards Yet</h3>
        <p className="text-xs text-gray-400 max-w-xs">
          No cards yet for this chapter.
        </p>
      </div>
    );
  }

  return (
    <div className="mobile-reel-feed">
      {cards.map(card => (
        <ReelCard key={card.id} card={card} onBrickEarned={onBrickEarned} relatedPyq={pyqs?.[0]} />
      ))}
    </div>
  );
};
