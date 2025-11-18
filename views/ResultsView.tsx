
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateExplanation, analyzePerformance } from '../services/geminiService';
import { QuestionWithExplanation, Question } from '../types';
import Spinner from '../components/Spinner';

const ResultsView: React.FC = () => {
    const { examResult, setAppState } = useApp();
    const [explanations, setExplanations] = useState<Record<number, QuestionWithExplanation>>({});
    const [loadingExplanation, setLoadingExplanation] = useState<number | null>(null);
    const [performanceAnalysis, setPerformanceAnalysis] = useState<string>('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    const incorrectQuestions = useMemo(() => {
        if (!examResult) return [];
        return examResult.questions.filter((q, i) => {
            const userAnswer = examResult.userAnswers.find(ua => ua.questionIndex === i);
            return !userAnswer || userAnswer.answer !== q.answer;
        });
    }, [examResult]);

    const handleGetExplanation = async (question: Question, index: number) => {
        if (explanations[index]) {
             setExplanations(prev => ({ ...prev, [index]: { ...prev[index], explanation: '' } })); // This will hide the explanation
             return;
        }
        setLoadingExplanation(index);
        try {
            const userAnswer = examResult?.userAnswers.find(ua => ua.questionIndex === index)?.answer || "Não respondida";
            const result = await generateExplanation(question, userAnswer);
            setExplanations(prev => ({ ...prev, [index]: { ...question, ...result } }));
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingExplanation(null);
        }
    };
    
    const handleGetPerformanceAnalysis = async () => {
        setLoadingAnalysis(true);
        try {
            const analysis = await analyzePerformance(incorrectQuestions);
            setPerformanceAnalysis(analysis);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    if (!examResult) {
        return <div className="text-center p-8">Nenhum resultado para exibir.</div>;
    }

    const scoreColor = examResult.score >= 70 ? 'text-green-500' : examResult.score >= 50 ? 'text-yellow-500' : 'text-red-500';

    const renderMarkdown = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g).filter(Boolean);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
            if (part === '\n') return <br key={i} />;
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate__animated animate__fadeIn">
            {/* Score Summary */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Resultado Final</h2>
                <p className={`text-6xl font-extrabold ${scoreColor} my-4`}>{examResult.score.toFixed(0)}%</p>
                <div className="flex justify-center gap-8 text-slate-600 dark:text-slate-300">
                    <p><strong className="text-green-500">{examResult.correctAnswers}</strong> Corretas</p>
                    <p><strong className="text-red-500">{examResult.incorrectAnswers}</strong> Incorretas</p>
                    <p><strong>{examResult.totalQuestions}</strong> Total</p>
                </div>
                <button onClick={() => setAppState('GENERATOR')} className="mt-8 bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition">
                    Criar Novo Simulado
                </button>
            </div>
            
            {/* Performance Analysis */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                 <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Análise de Desempenho por IA</h3>
                 {performanceAnalysis ? (
                     <div className="prose prose-slate dark:prose-invert max-w-none space-y-2">{renderMarkdown(performanceAnalysis)}</div>
                 ) : (
                     <button onClick={handleGetPerformanceAnalysis} disabled={loadingAnalysis} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition">
                         {loadingAnalysis ? 'Analisando...' : 'Obter Análise e Dicas de Estudo'}
                     </button>
                 )}
                 {loadingAnalysis && <Spinner message="Analisando seus erros para criar um plano de estudo..."/>}
            </div>

            {/* Detailed Results */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Gabarito e Explicações</h3>
                <div className="space-y-6">
                    {examResult.questions.map((q, i) => {
                        const userAnswer = examResult.userAnswers.find(ua => ua.questionIndex === i);
                        const isCorrect = userAnswer?.answer === q.answer;
                        
                        return (
                            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-5">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-3">{i + 1}. {q.question}</p>
                                <p><strong>Sua resposta:</strong> <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>{userAnswer?.answer || "Não respondida"}</span></p>
                                {!isCorrect && <p><strong>Resposta correta:</strong> <span className="text-green-500">{q.answer}</span></p>}
                                
                                <button onClick={() => handleGetExplanation(q, i)} disabled={loadingExplanation === i} className="text-sm text-blue-600 hover:underline mt-3 disabled:text-slate-400">
                                     {loadingExplanation === i ? 'Carregando...' : (explanations[i]?.explanation ? 'Ocultar Explicação' : 'Ver Explicação e Dicas')}
                                </button>
                                
                                {explanations[i]?.explanation && (
                                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-md border-l-4 border-blue-500 animate__animated animate__fadeIn animate__faster">
                                        <p className="font-bold mb-2">Explicação da IA:</p>
                                        <p className="text-slate-600 dark:text-slate-300 mb-4">{explanations[i].explanation}</p>
                                        <p className="font-bold mb-2">Sugestões de Vídeos:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {explanations[i].videoLinks.map((link, linkIndex) => (
                                                <li key={linkIndex}>
                                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 underline">{link.title}</a>
                                                </li>
                                            ))}
                                        </ul>
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

export default ResultsView;
