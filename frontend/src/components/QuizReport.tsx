import React from 'react';
import { DiagnosticReport } from '../types';
import { AlertTriangle, CheckCircle2, RotateCcw, Castle, BookOpen, Link2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizReportProps {
  report: DiagnosticReport;
  onRetake: () => void;
  onContinue: () => void;
}

export const QuizReport: React.FC<QuizReportProps> = ({ report, onRetake, onContinue }) => {
  React.useEffect(() => {
    if (report.mastery_achieved) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [report.mastery_achieved]);

  return (
    <div className="max-w-md mx-auto p-4 pt-16 pb-24 space-y-5">
      {/* Score Header Card */}
      <div className={`glass-panel p-6 text-center space-y-4 rounded-3xl border ${
        report.mastery_achieved
          ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 shadow-2xl shadow-emerald-500/20'
          : 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40'
      }`}>
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black ${
          report.mastery_achieved
            ? 'bg-gradient-to-tr from-emerald-500 to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30'
            : 'bg-gradient-to-tr from-rose-500 to-rose-300 text-slate-950'
        }`}>
          {report.mastery_achieved ? '🏆' : '📊'}
        </div>

        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 block mb-0.5">
            UPSC Prelims Diagnostic Result
          </span>
          <h2 className="text-3xl font-black text-white font-heading">
            {report.total_marks} / {report.max_possible_marks} <span className="text-xs font-semibold text-gray-400">Marks</span>
          </h2>
          <p className="text-xs font-extrabold mt-1 text-emerald-400">
            Accuracy: {report.accuracy_percentage}%
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-gray-800 text-center">
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold">Correct (+2.0)</span>
            <span className="text-base font-black text-emerald-400">{report.correct_count}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold">Wrong (-0.66)</span>
            <span className="text-base font-black text-rose-400">{report.wrong_count}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold">Unattempted</span>
            <span className="text-base font-black text-gray-400">{report.unattempted_count}</span>
          </div>
        </div>

        {/* Diagnostic Recommendation Box */}
        <div className={`p-3.5 rounded-2xl text-xs text-left flex items-start gap-2.5 border ${
          report.mastery_achieved
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
        }`}>
          {report.mastery_achieved ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-extrabold uppercase text-[9px] tracking-wider block">
              {report.mastery_achieved ? 'Chapter Mastered!' : 'Diagnostic Recommendation'}
            </span>
            <p className="text-xs leading-relaxed">{report.recommendation}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={onRetake}
            aria-label="Retake quiz"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900 border border-gray-800 text-gray-300 font-extrabold text-xs active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Retake Test
          </button>

          <button
            onClick={onContinue}
            aria-label="Return to ByteReels"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Castle className="w-4 h-4" aria-hidden="true" /> Back to Reels
          </button>
        </div>
      </div>

      {/* Explanations List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-heading">
          <BookOpen className="w-4 h-4 text-sky-400" />
          UPSC PYQ Answers & Official Explanations
        </h3>

        {report.item_reports.map((item, idx) => (
          <div key={idx} className="glass-panel p-4 space-y-2.5 bg-slate-950 border-gray-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-400">Question {idx + 1}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                item.status === 'Correct'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : item.status === 'Wrong'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {item.status}
              </span>
            </div>

            <p className="text-xs font-semibold text-white whitespace-pre-line leading-relaxed">
              {item.question}
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-gray-800 text-xs space-y-1">
              <div className="text-emerald-400 font-bold text-[11px]">
                ✓ Correct Answer: {item.correct_option_text}
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed pt-1 border-t border-gray-800">
                <span className="font-bold text-sky-400">Explanation: </span>
                {item.explanation}
              </p>
              {item.sources && item.sources.length > 0 && (
                <div className="pt-1 border-t border-gray-800 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Sources:
                  </span>
                  {item.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-sky-300 hover:text-sky-200 underline underline-offset-2"
                    >
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
