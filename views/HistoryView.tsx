
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SavedExam } from '../types';
import { supabase } from '../services/supabaseClient';
import Spinner from '../components/Spinner';

const HistoryView: React.FC = () => {
    const { user, setAppState } = useApp();
    const [exams, setExams] = useState<SavedExam[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [subjectFilter, setSubjectFilter] = useState('');
    const [scoreFilter, setScoreFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('exams')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setExams(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExam = async (examId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este simulado do seu histórico? Esta ação não pode ser desfeita.")) {
            return;
        }

        try {
            const { error } = await supabase
                .from('exams')
                .delete()
                .eq('id', examId);

            if (error) throw error;

            // Update local state
            setExams(prev => prev.filter(exam => exam.id !== examId));
        } catch (error) {
            console.error('Error deleting exam:', error);
            alert('Ocorreu um erro ao excluir o simulado.');
        }
    };

    const handleShareExam = async (exam: SavedExam) => {
        const percentage = exam.score.toFixed(0);
        const subjectCount = exam.subjects?.length || 0;
        
        // Copy persuasiva para atrair novos usuários
        const shareText = `🔥 Acabei de acertar ${percentage}% no simulado "${exam.exam_name}"!\n\nUsei uma IA para gerar ${exam.total_questions} questões inéditas de ${subjectCount} matérias do edital. Ela analisou meus erros e me disse o que estudar. 🤖📚\n\nDuvido você fazer melhor! Crie seu simulado grátis aqui:`;
        const url = window.location.origin; // Link para a home do site

        if (navigator.share) {
            // Compartilhamento nativo (Mobile: Whatsapp, Instagram, etc)
            try {
                await navigator.share({
                    title: 'Desafio PRO CONCURSOS',
                    text: shareText,
                    url: url
                });
            } catch (err) {
                console.log('User cancelled share');
            }
        } else {
            // Fallback para PC (Copiar para área de transferência)
            try {
                await navigator.clipboard.writeText(`${shareText} ${url}`);
                alert("Texto copiado! Cole no WhatsApp ou redes sociais para desafiar seus amigos.");
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    // Derived Data for Filters
    const availableSubjects = useMemo(() => {
        const subjects = new Set<string>();
        exams.forEach(exam => {
            exam.subjects?.forEach(s => subjects.add(s));
        });
        return Array.from(subjects).sort();
    }, [exams]);

    // Filtering Logic
    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            // Subject Filter
            if (subjectFilter && !exam.subjects?.some(s => s.toLowerCase().includes(subjectFilter.toLowerCase()))) {
                return false;
            }

            // Score Filter
            if (scoreFilter !== 'all') {
                if (scoreFilter === 'high' && exam.score < 80) return false;
                if (scoreFilter === 'medium' && (exam.score < 50 || exam.score >= 80)) return false;
                if (scoreFilter === 'low' && exam.score >= 50) return false;
            }

            // Date Filter
            if (dateFilter) {
                const examDate = new Date(exam.created_at).toISOString().split('T')[0];
                if (examDate !== dateFilter) return false;
            }

            return true;
        });
    }, [exams, subjectFilter, scoreFilter, dateFilter]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!user) {
        return (
            <div className="text-center p-8">
                <p className="text-slate-400 mb-4">Faça login para ver seu histórico.</p>
                <button onClick={() => setAppState('HOME')} className="text-brand-400 underline">Voltar</button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate__animated animate__fadeIn">
             {/* Header */}
             <div className="mb-8 flex justify-between items-end">
                <div>
                    <button onClick={() => setAppState('GENERATOR')} className="text-slate-400 hover:text-white flex items-center text-sm mb-4 transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Voltar para Gerador
                    </button>
                    <h2 className="text-3xl font-bold text-white">Meu Histórico</h2>
                    <p className="text-slate-400">Acompanhe sua evolução e revise simulados anteriores.</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl mb-8 backdrop-blur-sm">
                <div className="grid md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Matéria</label>
                        <select 
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-brand-500 outline-none"
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                        >
                            <option value="">Todas as matérias</option>
                            {availableSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Desempenho</label>
                        <select 
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-brand-500 outline-none"
                            value={scoreFilter}
                            onChange={(e) => setScoreFilter(e.target.value)}
                        >
                            <option value="all">Qualquer nota</option>
                            <option value="high">Excelente ({'>'}80%)</option>
                            <option value="medium">Médio (50% - 79%)</option>
                            <option value="low">Precisa Melhorar ({'<'}50%)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Data Específica</label>
                        <input 
                            type="date" 
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-brand-500 outline-none [color-scheme:dark]"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <button 
                            onClick={() => { setSubjectFilter(''); setScoreFilter('all'); setDateFilter(''); }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-lg transition text-sm border border-white/5"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Spinner message="Carregando histórico..." />
                </div>
            ) : filteredExams.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-white/5">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h3 className="text-white font-bold text-lg">Nenhum simulado encontrado</h3>
                    <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros ou crie um novo simulado.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => {
                        const scoreColor = exam.score >= 80 ? 'text-green-400 border-green-500/20 bg-green-500/10' : 
                                         exam.score >= 50 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' : 
                                         'text-red-400 border-red-500/20 bg-red-500/10';
                        
                        return (
                            <div key={exam.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-500/10 group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold border ${scoreColor}`}>
                                        {exam.score.toFixed(0)}%
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-xs text-slate-500 mr-2">{formatDate(exam.created_at)}</span>
                                        
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleShareExam(exam); }}
                                            className="text-brand-400 hover:text-white hover:bg-brand-500/20 transition-colors p-1.5 rounded"
                                            title="Compartilhar Desafio"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                        </button>

                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                                            className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/10"
                                            title="Excluir do Histórico"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <h3 className="text-white font-bold text-lg mb-2 truncate" title={exam.exam_name}>{exam.exam_name}</h3>
                                
                                <div className="flex items-center text-xs text-slate-400 mb-4 space-x-3">
                                    <span className="flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                        {exam.correct_answers}/{exam.total_questions} Acertos
                                    </span>
                                    <span className="flex items-center">
                                         <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                        {exam.subjects?.length || 0} Matérias
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5 mt-auto">
                                    {exam.subjects?.slice(0, 3).map((sub, i) => (
                                        <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                                            {sub}
                                        </span>
                                    ))}
                                    {exam.subjects && exam.subjects.length > 3 && (
                                        <span className="text-[10px] text-slate-500 px-1">+{exam.subjects.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HistoryView;
