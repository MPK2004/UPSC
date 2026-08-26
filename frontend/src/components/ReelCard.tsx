import React, { useState } from 'react';
import { ByteCard, PYQQuestion } from '../types';
import { addMasteredBrick, saveNote, getMasteredBricks } from '../utils/supabaseClient';
import { Volume2, VolumeX, Castle, Bookmark, AlertCircle, Lightbulb, ZoomIn, Check, HelpCircle, Link2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReelCardProps {
  card: ByteCard;
  onBrickEarned: () => void;
  relatedPyq?: PYQQuestion;
}

export const ReelCard: React.FC<ReelCardProps> = ({ card, onBrickEarned, relatedPyq }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showDiagramZoom, setShowDiagramZoom] = useState(false);
  const [isSavedNote, setIsSavedNote] = useState(false);
  const [showMiniQuiz, setShowMiniQuiz] = useState(false);
  const [miniQuizAnswer, setMiniQuizAnswer] = useState<number | null>(null);
  const [barVisible, setBarVisible] = useState(true);

  const masteredIds = getMasteredBricks();
  const isMastered = masteredIds.includes(card.id);

  const matchingPYQ = relatedPyq;
  const miniQuizAnswered = miniQuizAnswer !== null;
  const miniQuizCorrect = miniQuizAnswer === matchingPYQ?.correct_index;

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
      subject: '',
      content: card.bullet_points.join('\n') + (card.mnemonic ? `\n\n${card.mnemonic}` : '')
    });
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 2000);
  };

  return (
    <div className="mobile-reel-card p-5 pt-14 pb-20 max-w-md mx-auto">
      {/* Top Card Badge Overlay */}
      <div className="flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {card.concept_type}
          </span>
        </div>
      </div>

      {/* Content and the floating action bar occupy the same stacked area, so the
          action bar can stay sticky to the viewport even when content makes this
          card taller than one screen, without reserving its own layout space. */}
      <div className="reel-stack">
      {/* Main Reel Content Block */}
      <div className="reel-content space-y-4 z-10 pr-12 pt-4 pb-6">
        {/* Title */}
        <h2 className="text-xl font-extrabold text-white leading-tight font-heading">
          {card.title}
        </h2>

        {/* Diagram Banner Container */}
        {card.diagram_url && (
          <div
            onClick={() => setShowDiagramZoom(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDiagramZoom(true); }}
            role="button"
            tabIndex={0}
            aria-label={`Zoom diagram: ${card.title}`}
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

        {/* Sources Accordion */}
        {showSources && card.sources && card.sources.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-gray-800 text-xs animate-fadeIn space-y-2">
            <span className="flex items-center gap-1 text-[10px] uppercase text-gray-400 font-black">
              <Link2 className="w-3.5 h-3.5" /> Sources
            </span>
            <ul className="space-y-1.5">
              {card.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1.5 text-gray-300 hover:text-white leading-snug"
                  >
                    <span className="underline underline-offset-2">{s.title}</span>
                    {s.tier === 'official' && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex-shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5" /> Official
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mini Quiz Inline */}
        {showMiniQuiz && matchingPYQ && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-gray-800 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Quick PYQ</span>
              <span className="text-[10px] text-gray-500">{matchingPYQ.year} · {matchingPYQ.difficulty}</span>
            </div>
            <p className="text-xs font-semibold text-white leading-relaxed whitespace-pre-line">{matchingPYQ.question}</p>
            <div className="space-y-2">
              {matchingPYQ.options.map((opt, i) => {
                const isCorrect = i === matchingPYQ.correct_index;
                const isChosen = miniQuizAnswer === i;
                let optStyle = 'bg-slate-800/70 border-gray-700 text-gray-300';
                if (miniQuizAnswered && isCorrect) optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200';
                else if (miniQuizAnswered && isChosen && !isCorrect) optStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                else if (isChosen) optStyle = 'bg-amber-500/15 border-amber-500 text-amber-200';
                return (
                  <button
                    key={i}
                    onClick={() => !miniQuizAnswered && setMiniQuizAnswer(i)}
                    disabled={miniQuizAnswered}
                    className={`w-full p-2.5 rounded-xl border text-left text-[11px] font-medium transition-all ${optStyle}`}
                  >
                    <span className="font-bold mr-1.5">{String.fromCharCode(65 + i)}.</span>{opt}
                  </button>
                );
              })}
            </div>
            {miniQuizAnswered && (
              <div className={`p-2.5 rounded-xl text-[11px] font-bold leading-snug ${miniQuizCorrect ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                {miniQuizCorrect ? '✓ Correct!' : `✗ Wrong — ${matchingPYQ.options[matchingPYQ.correct_index]}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Action Rail (Right Side) — stays pinned near the bottom of the
          viewport for as long as this card is on screen, even if the card's
          content is taller than the screen. */}
      <div className="reel-actions-shell">
        <div className="reel-actions-sticky">
          {/* Toggle Button for Action Bar */}
          <button
            onClick={() => setBarVisible(!barVisible)}
            className="bar-toggle"
            aria-label={barVisible ? 'Hide action buttons' : 'Show action buttons'}
          >
            {barVisible ? '×' : '⋯'}
          </button>

          <div className={`floating-action-bar ${barVisible ? '' : 'bar-hidden'}`} role="toolbar" aria-label="Card actions">
        {/* 1. Master Brick Button */}
        <button
          onClick={handleMasterBrick}
          aria-label={isMastered ? 'Brick mastered' : 'Mark brick as mastered'}
          className={`action-btn ${isMastered ? 'active-amber' : ''}`}
          title="Master Brick"
        >
          <Castle className="w-5 h-5" aria-hidden="true" />
          <span className="action-btn-label">{isMastered ? 'Mastered' : 'Brick'}</span>
        </button>

        {/* 2. Audio Read-Aloud */}
        <button
          onClick={handleToggleAudio}
          aria-label={isPlayingAudio ? 'Stop audio' : 'Listen to card'}
          className={`action-btn ${isPlayingAudio ? 'active-emerald' : ''}`}
          title="Audio TTS"
        >
          {isPlayingAudio ? <VolumeX className="w-5 h-5 animate-pulse" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
          <span className="action-btn-label">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
        </button>

        {/* 3. Mini Quiz Toggle */}
        {matchingPYQ && (
          <button
            onClick={() => { setShowMiniQuiz(!showMiniQuiz); setMiniQuizAnswer(null); }}
            aria-label={showMiniQuiz ? 'Hide quiz' : 'Quick quiz'}
            aria-expanded={showMiniQuiz}
            className={`action-btn ${showMiniQuiz ? 'active-amber' : ''}`}
            title="Quick Quiz"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            <span className="action-btn-label">Quiz</span>
          </button>
        )}

        {/* 4. Mnemonic Trick Toggle */}
        {card.mnemonic && (
          <button
            onClick={() => setShowMnemonic(!showMnemonic)}
            aria-label={showMnemonic ? 'Hide memory trick' : 'Show memory trick'}
            aria-expanded={showMnemonic}
            className={`action-btn ${showMnemonic ? 'active-amber' : ''}`}
            title="Mnemonic Trick"
          >
            <Lightbulb className="w-5 h-5" aria-hidden="true" />
            <span className="action-btn-label">Trick</span>
          </button>
        )}

        {/* 4. UPSC Tip Toggle */}
        {card.upsc_prelims_tip && (
          <button
            onClick={() => setShowTip(!showTip)}
            aria-label={showTip ? 'Hide UPSC tip' : 'Show UPSC tip'}
            aria-expanded={showTip}
            className={`action-btn ${showTip ? 'active-sky' : ''}`}
            title="UPSC Tip"
          >
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
            <span className="action-btn-label">Tip</span>
          </button>
        )}

        {/* 5. Sources Toggle */}
        {card.sources && card.sources.length > 0 && (
          <button
            onClick={() => setShowSources(!showSources)}
            aria-label={showSources ? 'Hide sources' : 'Show sources'}
            aria-expanded={showSources}
            className={`action-btn ${showSources ? 'active-emerald' : ''}`}
            title="Sources"
          >
            <Link2 className="w-5 h-5" aria-hidden="true" />
            <span className="action-btn-label">Sources</span>
          </button>
        )}

        {/* 6. Save Note Button */}
        <button
          onClick={handleSaveNote}
          aria-label={isSavedNote ? 'Note saved' : 'Save note'}
          className={`action-btn ${isSavedNote ? 'active-emerald' : ''}`}
          title="Save Note"
        >
          {isSavedNote ? <Check className="w-5 h-5" aria-hidden="true" /> : <Bookmark className="w-5 h-5" aria-hidden="true" />}
          <span className="action-btn-label">{isSavedNote ? 'Saved' : 'Save'}</span>
        </button>
          </div>
        </div>
      </div>
      </div>

      {/* Diagram Fullscreen Modal */}
      {showDiagramZoom && card.diagram_url && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Diagram: ${card.title}`}>
          <button
            onClick={() => setShowDiagramZoom(false)}
            aria-label="Close diagram"
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
