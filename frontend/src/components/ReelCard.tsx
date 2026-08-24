import React, { useState } from 'react';
import { ByteCard } from '../types';
import { addMasteredBrick, saveNote, toggleBookmark, getBookmarks, getMasteredBricks } from '../utils/supabaseClient';
import { Volume2, VolumeX, Castle, Bookmark, Sparkles, AlertCircle, Lightbulb, Image as ImageIcon, ZoomIn, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReelCardProps {
  card: ByteCard;
  onBrickEarned: () => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({ card, onBrickEarned }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showDiagramZoom, setShowDiagramZoom] = useState(false);
  const [isSavedNote, setIsSavedNote] = useState(false);

  const masteredIds = getMasteredBricks();
  const isMastered = masteredIds.includes(card.id);

  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.includes(card.id);

  // Audio Text-to-Speech
  const handleToggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToRead = `${card.title}. ${card.bullet_points.join('. ')}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Master Brick trigger
  const handleMasterBrick = () => {
    addMasteredBrick(card.id);
    onBrickEarned();
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {}
  };

  // Save Note trigger
  const handleSaveNote = () => {
    saveNote({
      title: card.title,
      subject: card.subject,
      content: card.bullet_points.join('\n') + (card.mnemonic ? `\n\n${card.mnemonic}` : '')
    });
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 2000);
  };

  return (
    <div className="mobile-reel-card p-5 pt-14 pb-20 max-w-md mx-auto">
      {/* Top Card Badge Overlay */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            card.subject === 'Geography'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {card.subject}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {card.concept_type}
          </span>
        </div>
      </div>

      {/* Main Reel Content Block */}
      <div className="space-y-4 my-auto z-10 pr-12">
        {/* Title */}
        <h2 className="text-xl font-extrabold text-white leading-tight font-heading">
          {card.title}
        </h2>

        {/* Diagram Banner Container */}
        {card.diagram_url && (
          <div
            onClick={() => setShowDiagramZoom(true)}
            className="relative rounded-2xl overflow-hidden border border-gray-800 bg-slate-900 group cursor-pointer shadow-lg"
          >
            <img
              src={card.diagram_url}
              alt={card.title}
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-gray-300 flex items-center gap-1 border border-gray-700">
              <ZoomIn className="w-3 h-3 text-sky-400" /> Tap to Zoom
            </div>
          </div>
        )}

        {/* Bullet Points Stack */}
        <div className="space-y-2.5">
          {card.bullet_points.map((pt, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-gray-800/80 text-sm font-medium text-gray-200 leading-relaxed shadow-sm"
            >
              {pt}
            </div>
          ))}
        </div>

        {/* Mnemonic Accordion */}
        {showMnemonic && card.mnemonic && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs font-bold text-amber-200 animate-fadeIn space-y-1">
            <span className="flex items-center gap-1 text-[10px] uppercase text-amber-400 font-black">
              <Lightbulb className="w-3.5 h-3.5" /> Memory Hack
            </span>
            <p className="leading-snug">{card.mnemonic}</p>
          </div>
        )}

        {/* UPSC Prelims Tip Accordion */}
        {showTip && card.upsc_prelims_tip && (
          <div className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-500/40 text-xs font-bold text-sky-200 animate-fadeIn space-y-1">
            <span className="flex items-center gap-1 text-[10px] uppercase text-sky-400 font-black">
              <AlertCircle className="w-3.5 h-3.5" /> UPSC Prelims Alert
            </span>
            <p className="leading-snug">{card.upsc_prelims_tip}</p>
          </div>
        )}
      </div>

      {/* Floating Action Bar (Right Side TikTok Style) */}
      <div className="floating-action-bar">
        {/* 1. Master Brick Button */}
        <button
          onClick={handleMasterBrick}
          className={`action-btn ${isMastered ? 'active-amber' : ''}`}
          title="Master Brick"
        >
          <Castle className="w-5 h-5" />
          <span className="action-btn-label">{isMastered ? 'Mastered' : 'Brick'}</span>
        </button>

        {/* 2. Audio Read-Aloud */}
        <button
          onClick={handleToggleAudio}
          className={`action-btn ${isPlayingAudio ? 'active-emerald' : ''}`}
          title="Audio TTS"
        >
          {isPlayingAudio ? <VolumeX className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
          <span className="action-btn-label">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
        </button>

        {/* 3. Mnemonic Trick Toggle */}
        {card.mnemonic && (
          <button
            onClick={() => setShowMnemonic(!showMnemonic)}
            className={`action-btn ${showMnemonic ? 'active-amber' : ''}`}
            title="Mnemonic Trick"
          >
            <Lightbulb className="w-5 h-5" />
            <span className="action-btn-label">Trick</span>
          </button>
        )}

        {/* 4. UPSC Tip Toggle */}
        {card.upsc_prelims_tip && (
          <button
            onClick={() => setShowTip(!showTip)}
            className={`action-btn ${showTip ? 'active-sky' : ''}`}
            title="UPSC Tip"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="action-btn-label">Tip</span>
          </button>
        )}

        {/* 5. Save Note Button */}
        <button
          onClick={handleSaveNote}
          className={`action-btn ${isSavedNote ? 'active-emerald' : ''}`}
          title="Save Note"
        >
          {isSavedNote ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          <span className="action-btn-label">{isSavedNote ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Diagram Fullscreen Modal */}
      {showDiagramZoom && card.diagram_url && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setShowDiagramZoom(false)}
            className="absolute top-6 right-6 px-4 py-2 rounded-full bg-slate-900 border border-gray-700 text-xs font-bold text-white"
          >
            Close Diagram ✕
          </button>
          <img
            src={card.diagram_url}
            alt={card.title}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-gray-800"
          />
          <span className="text-xs text-gray-400 font-semibold mt-3">
            {card.title} (NCERT/PMF IAS Diagram)
          </span>
        </div>
      )}
    </div>
  );
};
