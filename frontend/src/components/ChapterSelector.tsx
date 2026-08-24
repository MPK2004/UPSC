import React from 'react';
import { Chapter } from '../types';
import { BookOpen, Layers, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface ChapterSelectorProps {
  chapters: Chapter[];
  selectedSubject: 'Geography' | 'Environment' | 'Combined';
  setSelectedSubject: (subj: 'Geography' | 'Environment' | 'Combined') => void;
  selectedChapterIds: string[];
  setSelectedChapterIds: (ids: string[]) => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  selectedSubject,
  setSelectedSubject,
  selectedChapterIds,
  setSelectedChapterIds
}) => {
  const toggleChapter = (id: string) => {
    if (selectedChapterIds.includes(id)) {
      setSelectedChapterIds(selectedChapterIds.filter(cId => cId !== id));
    } else {
      if (selectedChapterIds.length >= 2) {
        // Enforce max 2 chapters rule - replace oldest selection
        setSelectedChapterIds([selectedChapterIds[1], id]);
      } else {
        setSelectedChapterIds([...selectedChapterIds, id]);
      }
    }
  };

  const filteredChapters = selectedSubject === 'Combined'
    ? chapters
    : chapters.filter(c => c.subject === selectedSubject);

  return (
    <div className="bg-slate-900/90 border-b border-gray-800 p-3 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Subject Filter Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-gray-800 w-full md:w-auto">
          <button
            onClick={() => setSelectedSubject('Geography')}
            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedSubject === 'Geography'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌎 NCERT 11 Geography
          </button>

          <button
            onClick={() => setSelectedSubject('Environment')}
            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedSubject === 'Environment'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌿 PMF IAS Environment
          </button>

          <button
            onClick={() => setSelectedSubject('Combined')}
            className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              selectedSubject === 'Combined'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Combined Feed
          </button>
        </div>

        {/* 1 or 2 Chapter Limit Rule Alert */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Focus Limit:
          </span>
          <span className={`font-bold px-2 py-0.5 rounded-md ${
            selectedChapterIds.length === 0
              ? 'bg-slate-800 text-gray-400'
              : selectedChapterIds.length <= 2
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {selectedChapterIds.length === 0
              ? 'All Chapters'
              : `${selectedChapterIds.length} / 2 Chapters Active`}
          </span>

          {selectedChapterIds.length > 0 && (
            <button
              onClick={() => setSelectedChapterIds([])}
              className="text-[11px] text-gray-500 hover:text-gray-300 underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Chapter Selection Chips */}
      <div className="max-w-4xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filteredChapters.map(ch => {
          const isSelected = selectedChapterIds.includes(ch.id);
          const isGeo = ch.subject === 'Geography';

          return (
            <button
              key={ch.id}
              onClick={() => toggleChapter(ch.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                isSelected
                  ? isGeo
                    ? 'bg-sky-950/80 border-sky-400 text-sky-200 shadow-md shadow-sky-500/20'
                    : 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isGeo ? 'bg-sky-400' : 'bg-emerald-400'}`} />
              <span className="font-semibold text-white">Ch {ch.chapter_number}:</span>
              <span className="truncate max-w-[160px]">{ch.title}</span>
              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-400 ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
