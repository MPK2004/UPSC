import React from 'react';
import { Chapter } from '../types';
import { BookOpen, Layers, CheckCircle2, ShieldAlert, X, Sparkles } from 'lucide-react';

interface ChapterSelectorProps {
  chapters: Chapter[];
  selectedSubject: 'Geography' | 'Environment' | 'Combined';
  setSelectedSubject: (s: 'Geography' | 'Environment' | 'Combined') => void;
  selectedChapterIds: string[];
  setSelectedChapterIds: (ids: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  selectedSubject,
  setSelectedSubject,
  selectedChapterIds,
  setSelectedChapterIds,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const filteredChapters = selectedSubject === 'Combined'
    ? chapters
    : chapters.filter(c => c.subject === selectedSubject);

  const toggleChapter = (id: string) => {
    if (selectedChapterIds.includes(id)) {
      setSelectedChapterIds(selectedChapterIds.filter(i => i !== id));
    } else {
      if (selectedChapterIds.length >= 2) {
        // Enforce 1-2 chapter rule
        setSelectedChapterIds([selectedChapterIds[1], id]);
      } else {
        setSelectedChapterIds([...selectedChapterIds, id]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Click Backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-Up Bottom Drawer Sheet */}
      <div className="relative w-full max-w-md bg-slate-950 border-t border-gray-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp z-10 shadow-2xl">
        {/* Drawer Drag Bar */}
        <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white font-heading">
              Select Chapter Focus (Max 2)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white bg-slate-900 border border-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedSubject('Combined')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selectedSubject === 'Combined'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-gray-800 text-gray-300'
            }`}
          >
            🌐 Combined
          </button>

          <button
            onClick={() => setSelectedSubject('Geography')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selectedSubject === 'Geography'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-900 border border-gray-800 text-gray-300'
            }`}
          >
            🌍 Geography
          </button>

          <button
            onClick={() => setSelectedSubject('Environment')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selectedSubject === 'Environment'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-gray-800 text-gray-300'
            }`}
          >
            🌿 Environment
          </button>
        </div>

        {/* 1-2 Focus Notice Rule */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-snug">
            <span className="font-bold">Strict Study Focus:</span> Selecting 1 or 2 chapters targets your ByteReel feed so you master topics brick-by-brick!
          </p>
        </div>

        {/* Chapter List Cards */}
        <div className="space-y-2.5 pt-1">
          {filteredChapters.map(ch => {
            const isSelected = selectedChapterIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChapter(ch.id)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      ch.subject === 'Geography' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {ch.subject}
                    </span>
                    <span className="text-xs font-extrabold text-white">
                      Ch {ch.chapter_number}: {ch.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug line-clamp-1">
                    {ch.description}
                  </p>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  isSelected ? 'bg-amber-500 text-slate-950' : 'border border-gray-700'
                }`}>
                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 active:scale-98 transition-all"
        >
          Apply Chapter Focus
        </button>
      </div>
    </div>
  );
};
