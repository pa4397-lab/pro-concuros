
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTimer } from '../hooks/useTimer';
import { UserAnswer, ExamResult } from '../types';

const ExamView: React.FC = () => {
    const { questions, examConfig, setAppState, setExamResult } = useApp();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    
    const finishExam = useCallback(() => {
        const correctAnswers = questions.reduce((count, question, index) => {
            const userAnswer = userAnswers.find(ua => ua.questionIndex === index);
            return userAnswer && userAnswer.answer === question.answer ? count + 1 : count;
        }, 0);

        const result: ExamResult = {
            score: (correctAnswers / questions.length) * 100,
            totalQuestions: questions.length,
            correctAnswers: correctAnswers,
            incorrectAnswers: questions.length - correctAnswers,
            userAnswers: userAnswers,
            questions: questions,
        };
        
        setExamResult(result);
        setAppState('RESULTS');

    }, [questions, userAnswers, setExamResult, setAppState]);
    
    const { minutes, seconds, start } = useTimer(examConfig?.timeLimit || 60, finishExam);
    
    useEffect(() => {
        start();
    }, [start]);

    if (!examConfig || questions.length === 0) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-white">Erro ao carregar o simulado.</h2>
                <p className="text-slate-400">Por favor, volte e tente gerar um novo simulado.</p>
                <button onClick={() => setAppState('GENERATOR')} className="mt-4 bg-brand-600 text-white font-bold py-2 px-6 rounded-lg">Voltar</button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentUserAnswer = userAnswers.find(ua => ua.questionIndex === currentQuestionIndex)?.answer;

    const handleAnswerSelect = (answer: string) => {
        const updatedAnswers = userAnswers.filter(ua => ua.questionIndex !== currentQuestionIndex);
        setUserAnswers([...updatedAnswers, { questionIndex: currentQuestionIndex, answer }]);
    };
    
    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                <div 
                    className="bg-brand-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur border border-white/5 p-8 rounded-2xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                    <div>
                        <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Questão {currentQuestionIndex + 1}/{questions.length}</span>
                        <div className="mt-1 flex items-center space-x-2">
                             <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">{currentQuestion.subject}</span>
                        </div>
                    </div>
                    <div className={`flex items-center space-x-2 text-xl font-mono font-bold px-4 py-2 rounded-lg border ${minutes < 5 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-200 border-white/5'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-xl text-slate-200 leading-relaxed font-medium">{currentQuestion.question}</p>
                </div>
                
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = currentUserAnswer === option;
                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(option)}
                                className={`w-full text-left p-5 rounded-xl transition-all duration-200 flex items-center group
                                ${isSelected 
                                    ? 'bg-brand-600/20 border border-brand-500 text-white' 
                                    : 'bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:border-white/10'}`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-brand-500 bg-brand-500' : 'border-slate-500 group-hover:border-slate-400'}`}>
                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className="text-base">{option}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-10 flex justify-between items-center pt-6 border-t border-white/5">
                    <button 
                        onClick={goToPrevious} 
                        disabled={currentQuestionIndex === 0}
                        className="text-slate-400 font-semibold py-2 px-4 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:text-white transition flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Anterior
                    </button>
                    
                    {currentQuestionIndex === questions.length - 1 ? (
                        <button onClick={finishExam} className="bg-gradient-to-r from-brand-600 to-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-brand-500/25 transition-all transform hover:-translate-y-0.5">
                            Finalizar e Ver Resultado
                        </button>
                    ) : (
                         <button 
                            onClick={goToNext} 
                            disabled={currentQuestionIndex === questions.length - 1}
                            className="bg-white text-slate-900 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 transition-all flex items-center"
                        >
                            Próxima
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamView;
