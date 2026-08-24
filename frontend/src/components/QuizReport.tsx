import React from 'react';
import { DiagnosticReport } from '../types';
import { Award, AlertTriangle, CheckCircle2, XCircle, ArrowRight, RotateCcw, BookOpen, Castle } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Score Header Card */}
      <div className={`glass-panel p-6 border text-center space-y-4 rounded-3xl ${
        report.mastery_achieved
          ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40 shadow-2xl shadow-emerald-500/20'
          : 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40'
      }`}>
        <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-2xl font-black ${
          report.mastery_achieved
            ? 'bg-gradient-to-tr from-emerald-500 to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30'
            : 'bg-gradient-to-tr from-rose-500 to-rose-300 text-slate-950'
        }`}>
          {report.mastery_achieved ? '🏆' : '📊'}
        </div>

        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400 block mb-1">
            UPSC Prelims Diagnostic Result
          </span>
          <h2 className="text-3xl font-extrabold text-white">
            {report.total_marks} / {report.max_possible_marks} <span className="text-sm font-semibold text-gray-400">Marks</span>
          </h2>
          <p className="text-sm font-bold mt-1 text-emerald-400">
            Accuracy: {report.accuracy_percentage}%
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-950/80 border border-gray-800 text-center">
          <div>
            <span className="text-xs text-gray-400 block">Correct (+2.0)</span>
            <span className="text-lg font-bold text-emerald-400">{report.correct_count}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Wrong (-0.66)</span>
            <span className="text-lg font-bold text-rose-400">{report.wrong_count}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Unattempted</span>
            <span className="text-lg font-bold text-gray-400">{report.unattempted_count}</span>
          </div>
        </div>

        {/* Smart Diagnostic Recommendation Box */}
        <div className={`p-4 rounded-2xl text-xs text-left flex items-start gap-3 border ${
          report.mastery_achieved
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
        }`}>
          {report.mastery_achieved ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-bold uppercase text-[10px] tracking-wider block">
              {report.mastery_achieved ? 'Chapter Mastered!' : 'Diagnostic Recommendation'}
            </span>
            <p className="text-sm leading-relaxed">{report.recommendation}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-gray-300 hover:text-white font-semibold text-xs transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Retake Test
          </button>

          <button
            onClick={onContinue}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all"
          >
            <Castle className="w-4 h-4" /> Continue to Reels
          </button>
        </div>
      </div>

      {/* Item-by-Item UPSC Explanations */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          UPSC PYQ Answers & Official Explanations
        </h3>

        {report.item_reports.map((item, idx) => (
          <div key={idx} className="glass-panel p-4 space-y-3 bg-slate-950 border-gray-800">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-extrabold text-gray-400">Question {idx + 1}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                item.status === 'Correct'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : item.status === 'Wrong'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {item.status}
              </span>
            </div>

            <p className="text-sm font-semibold text-white whitespace-pre-line leading-relaxed">
              {item.question}
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-gray-800 text-xs space-y-1.5">
              <div className="text-emerald-400 font-bold">
                ✓ Correct Answer: {item.correct_option_text}
              </div>
              <p className="text-gray-300 leading-relaxed pt-1 border-t border-gray-800">
                <span className="font-semibold text-sky-400">Explanation: </span>
                {item.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
