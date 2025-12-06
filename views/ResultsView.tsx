
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateExplanation, analyzePerformance } from '../services/geminiService';
import { QuestionWithExplanation, Question } from '../types';
import Spinner from '../components/Spinner';
import { supabase } from '../services/supabaseClient';

const ResultsView: React.FC = () => {
    const { examResult, setAppState, examConfig, user, addXp } = useApp();
    const [explanations, setExplanations] = useState<Record<number, QuestionWithExplanation>>({});
    const [loadingExplanation, setLoadingExplanation] = useState<number | null>(null);
    const [performanceAnalysis, setPerformanceAnalysis] = useState<string>('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [xpGained, setXpGained] = useState(0);
    const [savedToDb, setSavedToDb] = useState(false);

    const incorrectQuestions = useMemo(() => {
        if (!examResult) return [];
        return examResult.questions.filter((q, i) => {
            const userAnswer = examResult.userAnswers.find(ua => ua.questionIndex === i);
            return !userAnswer || userAnswer.answer !== q.answer;
        });
    }, [examResult]);

    // Gamification & Persistence Logic
    useEffect(() => {
        if (examResult && !savedToDb) {
            // Calculate XP
            let xp = examResult.correctAnswers * 10;
            if (examResult.score >= 70) xp += 50;
            if (examResult.score === 100) xp += 100;
            
            setXpGained(xp);
            addXp(xp);

            // Save to DB if user is logged in
            if (user) {
                const saveExam = async () => {
                    try {
                        await supabase.from('exams').insert({
                            user_id: user.id,
                            exam_name: examConfig?.examName || 'Simulado Personalizado',
                            score: examResult.score,
                            total_questions: examResult.totalQuestions,
                            correct_answers: examResult.correctAnswers,
                            subjects: examConfig?.subjects || []
                        });
                    } catch (err) {
                        console.error("Failed to save exam history", err);
                    }
                };
                saveExam();
            }
            setSavedToDb(true);
        }
    }, [examResult, savedToDb, user]); 

    const handleGetExplanation = async (question: Question, index: number) => {
        if (explanations[index]) {
             setExplanations(prev => ({ ...prev, [index]: { ...prev[index], explanation: '' } })); 
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
        return <div className="text-center p-8 text-white">Nenhum resultado para exibir.</div>;
    }

    const percentage = examResult.score;
    const scoreColor = percentage >= 70 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400';
    const borderColor = percentage >= 70 ? 'border-green-500' : percentage >= 50 ? 'border-yellow-500' : 'border-red-500';

    const renderMarkdown = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g).filter(Boolean);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-brand-300">{part.slice(2, -2)}</strong>;
            if (part === '\n') return <br key={i} />;
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate__animated animate__fadeIn">
            {/* Exam Name Header */}
            <div className="text-center mb-4">
                <p className="text-slate-400 text-sm uppercase tracking-wide">Resultado do Simulado</p>
                <h2 className="text-3xl font-bold text-white mt-1">{examConfig?.examName || "Concurso Personalizado"}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Score Summary */}
                <div className="md:col-span-2 bg-slate-900/60 border border-white/5 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    </div>
                    
                    <h2 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-widest">Nota Final</h2>
                    <div className={`relative w-40 h-40 rounded-full border-8 ${borderColor} flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
                        <div className="text-center">
                             <span className={`text-4xl font-extrabold ${scoreColor}`}>{percentage.toFixed(0)}</span>
                             <span className="block text-xs text-slate-500 font-bold">de 100</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 w-full text-center">
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                            <p className="text-2xl font-bold text-green-400">{examResult.correctAnswers}</p>
                            <p className="text-xs text-slate-400 uppercase">Acertos</p>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                            <p className="text-2xl font-bold text-red-400">{examResult.incorrectAnswers}</p>
                            <p className="text-xs text-slate-400 uppercase">Erros</p>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                            <p className="text-2xl font-bold text-white">{examResult.totalQuestions}</p>
                            <p className="text-xs text-slate-400 uppercase">Total</p>
                        </div>
                    </div>
                </div>

                {/* Gamification & Trajectory */}
                <div className="bg-gradient-to-b from-brand-900/40 to-slate-900 border border-brand-500/20 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                     <div>
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                            <span className="bg-brand-500 p-1 rounded mr-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </span>
                            Sua Trajetória
                        </h3>
                        <p className="text-sm text-slate-400 mb-6">Continue estudando para subir de ranking.</p>
                        
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 mb-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-2xl font-bold text-brand-400">+{xpGained} XP</span>
                                <span className="text-xs text-slate-500">Ganho nesta prova</span>
                            </div>
                            {user ? (
                                <>
                                    <div className="flex justify-between text-xs text-white font-semibold mb-1">
                                        <span>Nível {user.level}</span>
                                        <span className="text-slate-400">{user.currentXp} / {user.nextLevelXp}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-brand-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                                            style={{ width: `${(user.currentXp / user.nextLevelXp) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 text-right">Próximo: Nível {user.level + 1}</p>
                                </>
                            ) : (
                                <p className="text-xs text-yellow-400 mt-2">Faça login para salvar seu progresso!</p>
                            )}
                        </div>

                        <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                             <h4 className="text-xs font-bold text-slate-300 uppercase mb-3">Ranking Diário</h4>
                             <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                     <div className="flex items-center">
                                         <span className="text-brand-400 font-bold mr-3">1º</span>
                                         <div className="w-6 h-6 bg-slate-700 rounded-full mr-2"></div>
                                         <span className="text-xs text-slate-300">Você</span>
                                     </div>
                                     <span className="text-xs font-mono text-brand-300">{user?.currentXp || xpGained} XP</span>
                                 </div>
                                 <div className="flex items-center justify-between opacity-50">
                                     <div className="flex items-center">
                                         <span className="text-slate-500 font-bold mr-3">2º</span>
                                         <div className="w-6 h-6 bg-slate-700 rounded-full mr-2"></div>
                                         <span className="text-xs text-slate-300">Carlos M.</span>
                                     </div>
                                     <span className="text-xs font-mono text-slate-400">850 XP</span>
                                 </div>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
            
            {/* Performance Analysis AI */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 p-8 rounded-2xl shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">Análise do Coach IA</h3>
                    <span className="bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Premium Feature</span>
                 </div>
                 
                 <div className="bg-slate-950/50 rounded-xl p-6 min-h-[150px] border border-white/5">
                    {performanceAnalysis ? (
                         <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                            {renderMarkdown(performanceAnalysis)}
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center py-4">
                             <p className="text-slate-400 mb-4 text-sm max-w-md mx-auto">Nossa IA analisa cada erro seu, identifica padrões e cria um roteiro personalizado para você estudar apenas o que precisa.</p>
                             <button onClick={handleGetPerformanceAnalysis} disabled={loadingAnalysis} className="bg-white text-slate-900 font-bold py-2.5 px-6 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition shadow-lg shadow-white/5">
                                 {loadingAnalysis ? 'Processando dados...' : 'Gerar Relatório de Desempenho'}
                             </button>
                         </div>
                     )}
                     {loadingAnalysis && <Spinner message="Consultando especialistas virtuais..."/>}
                 </div>
            </div>

            {/* CTA */}
            <div className="flex justify-center">
                <button onClick={() => setAppState('GENERATOR')} className="bg-brand-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-brand-500 transition shadow-lg shadow-brand-500/30 hover:scale-105 transform duration-200">
                    Criar Novo Simulado
                </button>
            </div>

            {/* Detailed Results */}
            <div className="bg-slate-900/60 border border-white/5 p-8 rounded-2xl shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    Correção Detalhada
                </h3>
                <div className="space-y-4">
                    {examResult.questions.map((q, i) => {
                        const userAnswer = examResult.userAnswers.find(ua => ua.questionIndex === i);
                        const isCorrect = userAnswer?.answer === q.answer;
                        
                        return (
                            <div key={i} className={`border rounded-xl p-5 transition-all ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isCorrect ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                        Questão {i + 1}
                                    </span>
                                    <span className="text-xs text-slate-500">{q.subject}</span>
                                </div>

                                <p className="font-medium text-slate-200 mb-4">{q.question}</p>
                                
                                <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                                    <div className={`p-3 rounded-lg border ${isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                                        <p className="text-xs text-slate-400 mb-1">Sua resposta:</p>
                                        <p className={isCorrect ? 'text-green-300 font-semibold' : 'text-red-300 font-semibold'}>{userAnswer?.answer || "Não respondida"}</p>
                                    </div>
                                    {!isCorrect && (
                                        <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                                            <p className="text-xs text-slate-400 mb-1">Resposta correta:</p>
                                            <p className="text-green-300 font-semibold">{q.answer}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <button onClick={() => handleGetExplanation(q, i)} disabled={loadingExplanation === i} className="text-sm font-medium text-brand-400 hover:text-brand-300 flex items-center transition disabled:opacity-50">
                                     {loadingExplanation === i ? <><Spinner message="" /> Carregando...</> : (explanations[i]?.explanation ? 'Fechar Explicação' : 'Por que eu errei? Ver Explicação')}
                                </button>
                                
                                {explanations[i]?.explanation && (
                                    <div className="mt-4 p-5 bg-slate-800 rounded-xl border border-white/5 animate__animated animate__fadeIn">
                                        <div className="flex items-start mb-3">
                                            <div className="bg-brand-500/20 p-1.5 rounded mr-3">
                                                <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-white mb-1">Explicação da IA</p>
                                                <p className="text-slate-300 text-sm leading-relaxed">{explanations[i].explanation}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Vídeos Recomendados</p>
                                            <div className="flex flex-col space-y-2">
                                                {explanations[i].videoLinks.map((link, linkIndex) => (
                                                    <a key={linkIndex} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition group">
                                                        <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
                                                        {link.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
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
