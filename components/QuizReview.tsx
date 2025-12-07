import React from 'react';
import { Question } from '../types';
import { Button } from './Button';
import { CheckCircle, XCircle, MinusCircle, ArrowLeft } from 'lucide-react';

interface QuizReviewProps {
    questions: Question[];
    userAnswers: Record<string, string>;
    onExit: () => void;
}

export const QuizReview: React.FC<QuizReviewProps> = ({ questions, userAnswers, onExit }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            <div className="bg-white shadow-sm border-b border-slate-200 p-4 shrink-0 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Quiz Review</h2>
                <Button onClick={onExit} variant="secondary" size="sm" className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {questions.map((q, idx) => {
                        const userSelected = userAnswers[q.id];
                        // Find correct option safely handles _id vs id
                        const correctOption = q.options.find(o => o.isCorrect);
                        const userOption = q.options.find(o => (o as any)._id === userSelected || o.id === userSelected);

                        const isCorrect = correctOption && userOption && ((correctOption as any)._id === (userOption as any)._id || correctOption.id === userOption.id);
                        const isSkipped = !userSelected;

                        return (
                            <div key={q.id || q._id} className={`bg-white rounded-xl border-2 p-6 ${isCorrect ? 'border-green-100' : isSkipped ? 'border-slate-100' : 'border-red-100'
                                }`}>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm text-white ${isCorrect ? 'bg-green-500' : isSkipped ? 'bg-slate-400' : 'bg-red-500'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-medium text-slate-800">{q.text}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {isCorrect && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Correct</span>}
                                            {!isCorrect && !isSkipped && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded flex items-center"><XCircle className="w-3 h-3 mr-1" /> Incorrect</span>}
                                            {isSkipped && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center"><MinusCircle className="w-3 h-3 mr-1" /> Skipped</span>}

                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${q.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                                                    q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                }`}>{q.difficulty}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4 ml-12">
                                    {q.options.map((opt) => {
                                        const optId = (opt as any)._id || opt.id;
                                        const isSelected = userSelected === optId;
                                        const isThisCorrect = opt.isCorrect;

                                        let containerClass = "border-slate-200 bg-slate-50";
                                        let icon = null;

                                        if (isThisCorrect) {
                                            containerClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                                            icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                                        } else if (isSelected && !isThisCorrect) {
                                            containerClass = "border-red-500 bg-red-50 ring-1 ring-red-500";
                                            icon = <XCircle className="w-5 h-5 text-red-600" />;
                                        }

                                        return (
                                            <div key={optId} className={`p-4 rounded-lg border-2 flex items-center justify-between ${containerClass}`}>
                                                <span className={`font-medium ${isThisCorrect ? 'text-green-900' : isSelected ? 'text-red-900' : 'text-slate-700'}`}>
                                                    {opt.text}
                                                </span>
                                                {icon}
                                            </div>
                                        )
                                    })}
                                </div>

                                {q.explanation && (
                                    <div className="ml-12 mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-indigo-800 border border-indigo-100">
                                        <span className="font-bold block mb-1">Explanation:</span>
                                        {q.explanation}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
