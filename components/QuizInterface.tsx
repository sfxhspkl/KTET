import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { Button } from './Button';
import { ChevronRight, ChevronLeft, Flag, Clock, AlertTriangle, X, Send, Grid, SkipForward } from 'lucide-react';
import Swal from 'sweetalert2';

interface QuizInterfaceProps {
  questions: Question[];
  initialProgress: {
    currentIndex: number;
    answers: Record<string, string>;
    markedForReview: string[];
    timeSeconds: number;
  };
  onProgressUpdate: (progress: any) => void;
  onComplete: (results: { correct: number; incorrect: number; skipped: number; timeTaken: number }) => void;
  onExit: () => void;
  onReportIssue: (questionId: string, description: string) => void;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  questions,
  initialProgress,
  onProgressUpdate,
  onComplete,
  onExit,
  onReportIssue
}) => {
  // Initialize state from props to support resume capability
  const [currentIndex, setCurrentIndex] = useState(initialProgress.currentIndex || 0);
  // Use INDEX as key to handle questions with duplicate IDs safely
  const [answers, setAnswers] = useState<Record<number, string>>(initialProgress.answers ?
    // If incoming answers are string-keyed by ID (legacy), this might lose them if we don't migrate.
    // But since this is a fix for BROKEN state, we start fresh or rely on index if the saved state matches.
    // Ideally we cast or map. For now assuming new session or standard object.
    initialProgress.answers as any : {}
  );
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set(
    // Migrate saved review IDs to indices? Hard if IDs are dupes. 
    // We'll treat saved "numbers" as indices.
    (initialProgress.markedForReview || []).map(Number).filter(n => !isNaN(n))
  ));
  const [timeSeconds, setTimeSeconds] = useState(initialProgress.timeSeconds || 0);

  // Mobile Navigation Modal State
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState('');

  // We don't shuffle here anymore. The parent provides shuffled questions.
  const currentQuestion = questions[currentIndex];

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state back to parent periodically or on change
  useEffect(() => {
    // Return keys as strings to maintain compatibility if parent expects string keys
    // BUT we must ensuring parent saves 'answers' as we give it.
    const progressData = {
      currentIndex,
      answers,
      markedForReview: Array.from(markedForReview),
      timeSeconds
    };
    onProgressUpdate(progressData);
  }, [currentIndex, answers, markedForReview, timeSeconds, onProgressUpdate]);

  const handleOptionSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optionId }));
  };

  const toggleReview = () => {
    const newSet = new Set(markedForReview);
    if (newSet.has(currentIndex)) {
      newSet.delete(currentIndex);
    } else {
      newSet.add(currentIndex);
    }
    setMarkedForReview(newSet);
  };

  // ... inside component ...

  const handleSubmit = () => {
    // Check for unanswered questions
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const unansweredCount = totalQuestions - answeredCount;

    if (unansweredCount > 0) {
      Swal.fire({
        title: 'Unanswered Questions',
        text: `You have skipped ${unansweredCount} questions. Do you want to submit anyway?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5', // Indigo 600
        cancelButtonColor: '#d33',
        confirmButtonText: 'Submit Anyway',
        cancelButtonText: 'Review Answers'
      }).then((result) => {
        if (result.isConfirmed) {
          submitQuizResults(timeSeconds);
        }
      });
      return;
    }

    // Direct submit if all answered
    submitQuizResults(timeSeconds);
  };

  const submitQuizResults = (finalTime: number) => {
    // Calculate results
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    questions.forEach((q, idx) => {
      const selected = answers[idx];
      if (!selected) {
        skipped++;
      } else {
        const correctOpt = q.options.find(o => o.isCorrect);
        if (correctOpt && ((correctOpt as any)._id === selected || correctOpt.id === selected)) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    onComplete({ correct, incorrect, skipped, timeTaken: finalTime });
  };

  // ... in Sidebar render ...
  <div className="mt-auto space-y-4">
    {currentIndex === questions.length - 1 ? (
      <Button fullWidth onClick={handleSubmit} variant="primary">Submit Test</Button>
    ) : (
      <Button
        fullWidth
        onClick={() => {
          setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
        }}
        variant={answers[currentIndex] ? "primary" : "secondary"}
      >
        {answers[currentIndex] ? (
          <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
        ) : (
          <>Skip <ChevronRight className="w-4 h-4 ml-1" /></>
        )}
      </Button>
    )}
  </div>

  // ... in Mobile Footer render ...
  {
    currentIndex === questions.length - 1 ? (
      <Button variant="primary" onClick={handleSubmit} size="sm">Submit</Button>
    ) : (
      <Button
        variant={answers[currentIndex] ? "primary" : "secondary"}
        onClick={() => setCurrentIndex(prev => prev + 1)}
        className="px-3"
      >
        {answers[currentIndex] ? <ChevronRight className="w-5 h-5" /> : <span className="text-xs font-bold mr-1">Skip</span>}
        {answers[currentIndex] ? null : <ChevronRight className="w-4 h-4" />}
      </Button>
    )
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const submitReport = () => {
    if (reportDescription.trim()) {
      onReportIssue(currentQuestion.id, reportDescription);
      setReportDescription('');
      setIsReportModalOpen(false);
      alert('Report sent to admin. Thank you!');
    }
  };

  if (!currentQuestion) {
    // Fallback if question array is empty (should not happen with proper parent logic)
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl font-bold mb-4">No questions available.</div>
        <Button onClick={onExit}>Return to Dashboard</Button>
      </div>
    );
  }

  const renderGrid = () => (
    <div className="grid grid-cols-5 gap-2 content-start">
      {questions.map((q, idx) => {
        const isAnswered = !!answers[idx];
        const isMarked = markedForReview.has(idx);
        const isCurrent = idx === currentIndex;

        let bgClass = "bg-white border-slate-200 text-slate-500 hover:border-slate-400";
        if (isCurrent) bgClass = "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50 text-indigo-900";
        else if (isMarked) bgClass = "bg-amber-100 border-amber-300 text-amber-800";
        else if (isAnswered) bgClass = "bg-emerald-100 border-emerald-300 text-emerald-800";

        return (
          <button
            key={idx} // Use Index as key for render stability if IDs are bad
            onClick={() => {
              setCurrentIndex(idx);
              setIsNavOpen(false); // Close modal on selection
            }}
            className={`h-9 w-9 rounded-lg text-sm font-bold border flex items-center justify-center transition-all relative ${bgClass}`}
          >
            {idx + 1}
            {isMarked && <div className="absolute top-0 right-0 -mt-1 -mr-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white shadow-xl md:rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-lg hidden md:block">Exam Mode</span>
          <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-mono">
            Q {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="flex items-center space-x-2 font-mono text-base bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>{formatTime(timeSeconds)}</span>
        </div>
        <Button size="sm" variant="danger" onClick={() => {
          if (confirm("Are you sure you want to exit? Your progress will not be saved.")) {
            onExit();
          }
        }} className="ml-4">
          Exit
        </Button>

      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Question Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-10">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className={`inline-block px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded
                  ${currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}`}>
                  {currentQuestion.difficulty}
                </span>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center space-x-1 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
                    title="Report an issue with this question"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="hidden md:inline">Report Issue</span>
                  </button>

                  <button
                    onClick={toggleReview}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors ${markedForReview.has(currentIndex) ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Flag className={`w-4 h-4 ${markedForReview.has(currentIndex) ? 'fill-current' : ''}`} />
                    <span className="hidden md:inline">{markedForReview.has(currentIndex) ? 'Marked' : 'Mark for Review'}</span>
                  </button>
                </div>
              </div>
              <h2 className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
                <span className="font-bold text-slate-400 mr-2 md:hidden">{currentIndex + 1}.</span>
                {currentQuestion.text}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const optId = (option as any)._id || option.id;
                // DEBUG: Log ID collisions
                // console.log(`Q: ${currentQuestion.id}, Opt: ${optId}, Selected: ${answers[currentQuestion.id]}`);
                return (
                  <button
                    key={optId}
                    onClick={() => handleOptionSelect(optId)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start group
                    ${answers[currentIndex] === optId
                        ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                        : 'border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-white'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 mt-0.5
                    ${answers[currentIndex] === optId ? 'border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}
                  `}>
                      {answers[currentIndex] === optId && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <span className="text-slate-700 font-medium text-base">{option.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Navigation (Desktop) */}
        <div className="hidden lg:flex w-72 bg-slate-50 border-l border-slate-200 flex-col p-4 shrink-0">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wider">Navigator</h3>
          {renderGrid()}

          <div className="mt-auto space-y-4">
            {currentIndex === questions.length - 1 ? (
              <Button
                fullWidth
                onClick={handleSubmit}
                variant={answers[currentIndex] ? "primary" : "secondary"}
                className={answers[currentIndex] ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
              >
                {answers[currentIndex] ? "Submit Test" : (
                  <>Skip & Submit <SkipForward className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            ) : (
              <Button
                fullWidth
                onClick={() => {
                  setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
                }}
                variant={answers[currentIndex] ? "primary" : "secondary"}
                className={answers[currentIndex] ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
              >
                {answers[currentIndex] ? (
                  <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Skip <SkipForward className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation (Mobile) */}
      <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center lg:hidden absolute bottom-0 left-0 right-0 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Button
          variant="secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="px-3"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Clickable Counter Trigger for Mobile Nav */}
        <button
          onClick={() => setIsNavOpen(true)}
          className="flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
            <Grid className="w-3 h-3 text-indigo-500" />
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Tap to Navigate</span>
        </button>

        {currentIndex === questions.length - 1 ? (
          <Button
            variant={answers[currentIndex] ? "primary" : "secondary"}
            onClick={handleSubmit}
            size="sm"
            className={answers[currentIndex] ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
          >
            {answers[currentIndex] ? "Submit" : (
              <div className="flex items-center">
                <span className="text-xs font-bold mr-1">Skip</span>
                <SkipForward className="w-4 h-4" />
              </div>
            )}
          </Button>
        ) : (
          <Button
            variant={answers[currentIndex] ? "primary" : "secondary"}
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="px-3"
          >
            {answers[currentIndex] ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <div className="flex items-center">
                <span className="text-xs font-bold mr-1">Skip</span>
                <SkipForward className="w-4 h-4" />
              </div>
            )}
          </Button>
        )}
      </div>

      {/* Mobile Navigation Modal */}
      {isNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center lg:hidden animate-in fade-in" onClick={() => setIsNavOpen(false)}>
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Question Navigator</h3>
              <button onClick={() => setIsNavOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            {renderGrid()}
            <div className="mt-8">
              <Button fullWidth onClick={handleSubmit} variant="primary">Submit Test</Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Report Issue
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Found a mistake in the question or options? Let us know so we can fix it.
            </p>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4 h-32 resize-none"
              placeholder="Describe the issue here..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={submitReport} disabled={!reportDescription.trim()}>
                <Send className="w-4 h-4 mr-2" /> Send Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};