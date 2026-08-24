import React, { useState } from 'react';
import { ByteCard } from '../types';
import { Volume2, VolumeX, Bookmark, PlusCircle, CheckCircle2, Sparkles, Lightbulb, Compass, Share2 } from 'lucide-react';
import { saveNote, toggleBookmark, getBookmarks, addMasteredBrick } from '../utils/supabaseClient';

interface ReelCardProps {
  card: ByteCard;
  onBrickEarned?: () => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({ card, onBrickEarned }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(getBookmarks().includes(card.id));
  const [readMastered, setReadMastered] = useState<boolean>(false);

  const isGeo = card.subject === 'Geography';

  // Speech Synthesis Audio Read-Aloud
  const toggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToRead = `${card.title}. ${card.bullet_points.join('. ')}. ${card.mnemonic || ''}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const handleSaveNote = () => {
    saveNote({
      card_id: card.id,
      title: card.title,
      subject: card.subject,
      content: `${card.bullet_points.join('\n')}\n\nTip: ${card.upsc_prelims_tip || ''}`
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleToggleBookmark = () => {
    const updated = toggleBookmark(card.id);
    setIsBookmarked(updated.includes(card.id));
  };

  const handleMasterCard = () => {
    addMasteredBrick(card.id);
    setReadMastered(true);
    if (onBrickEarned) onBrickEarned();
  };

  return (
    <div className="w-full max-w-md h-[88vh] glass-panel relative flex flex-col overflow-hidden border border-gray-800 shadow-2xl rounded-3xl bg-slate-950/90">
      {/* Top Banner */}
      <div className="p-4 pb-2 flex items-center justify-between border-b border-gray-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${
            isGeo ? 'badge-geo' : 'badge-env'
          }`}>
            {isGeo ? '🌎 Geography' : '🌿 Environment'}
          </span>
          <span className="text-[11px] font-semibold text-gray-400">
            {card.concept_type}
          </span>
        </div>

        {/* Audio Read-Aloud Button */}
        <button
          onClick={toggleAudio}
          className={`p-2 rounded-full border transition-all ${
            isPlayingAudio
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 animate-pulse'
              : 'bg-slate-900 text-gray-400 border-gray-800 hover:text-white'
          }`}
          title="Audio Read-Aloud"
        >
          {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-none">
        {/* Reel Title */}
        <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug">
          {card.title}
        </h2>

        {/* Visual Diagram Section (Diagrams & Maps) */}
        {card.diagram_url && (
          <div className="rounded-2xl overflow-hidden border border-gray-800 bg-slate-900/80 p-2 relative group">
            <img
              src={card.diagram_url}
              alt={card.title}
              className="w-full h-44 object-contain rounded-xl bg-slate-950"
            />
            <div className="absolute bottom-3 right-3 bg-slate-950/90 px-2 py-0.5 rounded text-[10px] text-amber-400 border border-amber-500/30 flex items-center gap-1 font-semibold">
              <Compass className="w-3 h-3" /> Visual Map / Diagram
            </div>
          </div>
        )}

        {/* High-Yield Bullet Points */}
        <div className="space-y-2.5">
          {card.bullet_points.map((pt, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-gray-800/80 hover:border-gray-700 transition-all">
              <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-200 leading-relaxed font-medium">
                {pt}
              </p>
            </div>
          ))}
        </div>

        {/* Catchy Mnemonic Box */}
        {card.mnemonic && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-400 uppercase text-[10px] block tracking-wider mb-0.5">Mnemonic Trick</span>
              {card.mnemonic}
            </div>
          </div>
        )}

        {/* UPSC Prelims Alert Box */}
        {card.upsc_prelims_tip && (
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-400 uppercase text-[10px] block tracking-wider mb-0.5">Prelims High-Yield Alert</span>
              {card.upsc_prelims_tip}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="p-3 px-5 border-t border-gray-800/80 bg-slate-900/90 flex items-center justify-between">
        {/* Mastered Brick Button */}
        <button
          onClick={handleMasterCard}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            readMastered
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {readMastered ? 'Brick Added! 🧱' : 'Mark Mastered 🧱'}
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Save Note */}
          <button
            onClick={handleSaveNote}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-950 text-gray-400 border-gray-800 hover:text-white'
            }`}
            title="Save to Study Notes"
          >
            <PlusCircle className="w-4 h-4" />
            {isSaved && <span className="text-[10px] font-bold">Saved!</span>}
          </button>

          {/* Bookmark */}
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-xl border text-xs transition-all ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-slate-950 text-gray-400 border-gray-800 hover:text-white'
            }`}
            title="Bookmark Reel"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
