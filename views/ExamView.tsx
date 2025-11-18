
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
                <h2 className="text-2xl font-bold">Erro ao carregar o simulado.</h2>
                <p>Por favor, volte e tente gerar um novo simulado.</p>
                <button onClick={() => setAppState('GENERATOR')} className="mt-4 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Voltar</button>
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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg relative">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Simulado em Andamento</h2>
                        <p className="text-slate-500 dark:text-slate-400">Questão {currentQuestionIndex + 1} de {questions.length}</p>
                    </div>
                    <div className="text-2xl font-bold text-red-500 bg-red-100 dark:bg-red-900/50 px-4 py-2 rounded-lg">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                </div>

                <div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full mb-4 inline-block">{currentQuestion.subject}</span>
                    <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">{currentQuestion.question}</p>
                    <div className="space-y-4">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = currentUserAnswer === option;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(option)}
                                    className={`w-full text-left p-4 border rounded-lg transition-colors duration-200 flex items-center
                                    ${isSelected 
                                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 ring-2 ring-blue-500' 
                                        : 'bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                >
                                    <span className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-400'} flex items-center justify-center mr-4 flex-shrink-0`}>
                                        {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4"/></svg>}
                                    </span>
                                    <span>{option}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button 
                        onClick={goToPrevious} 
                        disabled={currentQuestionIndex === 0}
                        className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                    >
                        Anterior
                    </button>
                    
                    {currentQuestionIndex === questions.length - 1 ? (
                        <button onClick={finishExam} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition">
                            Finalizar Prova
                        </button>
                    ) : (
                         <button 
                            onClick={goToNext} 
                            disabled={currentQuestionIndex === questions.length - 1}
                            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                        >
                            Próxima
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamView;
