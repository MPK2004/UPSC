import React, { useState, useEffect } from 'react';
import { PYQQuestion, DiagnosticReport } from '../types';
import { UPSC_PYQS } from '../data/upscData';
import { evaluateQuizClient } from '../utils/evaluator';
import { QuizReport } from './QuizReport';
import { BookOpen, Clock, CheckCircle2, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';

interface TestingArenaProps {
  selectedChapterIds: string[];
  selectedSubject: string;
  onBrickUnlocked: () => void;
}

export const TestingArena: React.FC<TestingArenaProps> = ({
  selectedChapterIds,
  selectedSubject,
  onBrickUnlocked
}) => {
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 mins

  useEffect(() => {
    fetchQuestions();
  }, [selectedChapterIds, selectedSubject]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuestions = () => {
    setReport(null);
    setUserAnswers({});
    let qList = UPSC_PYQS;

    if (selectedChapterIds.length > 0) {
      const active = selectedChapterIds.slice(0, 2);
      qList = qList.filter(q => active.includes(q.chapter_id));
    } else if (selectedSubject && selectedSubject.toLowerCase() !== 'combined') {
      qList = qList.filter(q => q.subject.toLowerCase() === selectedSubject.toLowerCase());
    }

    setQuestions(qList);
    setCurrentIndex(0);
  };

  const handleSelectOption = (qId: string, optionIdx: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmitQuiz = () => {
    setSubmitting(true);
    setTimeout(() => {
      const diagReport = evaluateQuizClient(selectedChapterIds, userAnswers);
      setReport(diagReport);
      if (diagReport.mastery_achieved) {
        onBrickUnlocked();
      }
      setSubmitting(false);
    }, 400);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (report) {
    return (
      <QuizReport
        report={report}
        onRetake={fetchQuestions}
        onContinue={() => setReport(null)}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <BookOpen className="w-12 h-12 text-gray-500" />
        <h3 className="text-lg font-bold text-white">No Questions Available</h3>
        <p className="text-xs text-gray-400">
          Try selecting different chapters or switching subject mode.
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Top Test Header */}
      <div className="glass-panel p-4 flex items-center justify-between bg-slate-950 border-gray-800">
        <div>
          <span className="text-xs font-extrabold text-amber-400 block uppercase tracking-wider">
            UPSC Prelims PYQ Arena ({currentQ.subject})
          </span>
          <span className="text-xs text-gray-400">
            Question {currentIndex + 1} of {questions.length} • Chapter: {currentQ.chapter_name}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-gray-800 text-xs font-mono text-emerald-400 font-bold">
          <Clock className="w-3.5 h-3.5" />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Question Card */}
      <div className="glass-panel p-6 space-y-5 bg-slate-950 border-gray-800 rounded-3xl">
        {/* PYQ Year Badge */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/40">
            UPSC Prelims {currentQ.year}
          </span>
          <span className="text-xs text-gray-500 font-semibold">
            Difficulty: {currentQ.difficulty}
          </span>
        </div>

        {/* Question Text */}
        <p className="text-base font-semibold text-white leading-relaxed whitespace-pre-line">
          {currentQ.question}
        </p>

        {/* MCQ Options */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((opt, optIdx) => {
            const isSelected = userAnswers[currentQ.id] === optIdx;
            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(currentQ.id, optIdx)}
                className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/70 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-gray-400'
                }`}>
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="leading-snug pt-0.5">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Controls Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-gray-800 text-xs font-bold text-gray-400 disabled:opacity-40 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 hover:brightness-110 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Evaluating...' : 'Submit UPSC Test'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-extrabold shadow-md shadow-sky-500/30 hover:bg-sky-400 transition-all"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
