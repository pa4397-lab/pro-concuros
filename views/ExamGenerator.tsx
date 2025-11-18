
import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { extractSubjectsFromEdital, generateQuestions } from '../services/geminiService';
import { ExamConfig } from '../types';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import PricingCard from '../components/PricingCard';

const ExamGenerator: React.FC = () => {
    const { setAppState, setExamConfig, setQuestions, freeTierUsage, incrementEditalUploads, incrementSimuladosCreated, isFreeTierExceeded } = useApp();
    const [editalContent, setEditalContent] = useState('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<Omit<ExamConfig, 'subjects'>>({
        difficulty: 'Médio',
        questionCount: 10,
        timeLimit: 60
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAnalyzeEdital = async () => {
        if (!editalContent.trim()) {
            setError("Por favor, insira o conteúdo do edital.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            if (freeTierUsage.editalUploads === 0) {
                incrementEditalUploads();
            }
            const extractedSubjects = await extractSubjectsFromEdital(editalContent);
            if(extractedSubjects.length === 0) {
                setError("Nenhuma matéria foi encontrada no edital. Tente colar um trecho maior ou mais específico.");
                setSubjects([]);
            } else {
                setSubjects(extractedSubjects);
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSimulado = async () => {
        if (isFreeTierExceeded(subjects.length)) {
            setIsModalOpen(true);
            return;
        }

        if (subjects.length === 0) {
            setError("Analise um edital para extrair as matérias primeiro.");
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const fullConfig: ExamConfig = { ...config, subjects };
            const generatedQuestions = await generateQuestions(
                fullConfig.subjects,
                fullConfig.difficulty,
                fullConfig.questionCount
            );
            if(generatedQuestions.length < fullConfig.questionCount){
                 setError("A IA gerou menos questões do que o solicitado. Tente novamente com um número menor ou matérias diferentes.");
                 setIsLoading(false);
                 return;
            }
            setExamConfig(fullConfig);
            setQuestions(generatedQuestions);
            incrementSimuladosCreated();
            setAppState('TAKING_EXAM');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigChange = <T extends keyof Omit<ExamConfig, 'subjects'>>(key: T, value: Omit<ExamConfig, 'subjects'>[T]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto animate__animated animate__fadeIn">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Crie seu Simulado Personalizado</h2>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}

                {/* Step 1: Edital */}
                <div className="mb-8">
                    <label htmlFor="edital" className="block text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">1. Cole o conteúdo do Edital</label>
                    <textarea
                        id="edital"
                        rows={8}
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Ex: Noções de Direito Administrativo, Língua Portuguesa, Raciocínio Lógico..."
                        value={editalContent}
                        onChange={(e) => setEditalContent(e.target.value)}
                        disabled={isLoading || subjects.length > 0}
                    />
                    <button
                        onClick={handleAnalyzeEdital}
                        className="mt-3 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                        disabled={isLoading || subjects.length > 0 || !editalContent.trim()}
                    >
                        {isLoading ? 'Analisando...' : 'Analisar Edital'}
                    </button>
                </div>

                {isLoading && <Spinner message="Aguarde, nossa IA está trabalhando..." />}

                {/* Step 2: Configuration */}
                {subjects.length > 0 && !isLoading && (
                    <div className="animate__animated animate__fadeInUp">
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Matérias Encontradas:</h3>
                            <div className="flex flex-wrap gap-2">
                                {subjects.map((subject, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full">{subject}</span>
                                ))}
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">2. Configure seu Simulado</h3>
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label htmlFor="difficulty" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Dificuldade</label>
                                <select id="difficulty" value={config.difficulty} onChange={e => handleConfigChange('difficulty', e.target.value as 'Fácil' | 'Médio' | 'Difícil')} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option>Fácil</option>
                                    <option>Médio</option>
                                    <option>Difícil</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="questionCount" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nº de Questões</label>
                                <input id="questionCount" type="number" min="5" max="50" value={config.questionCount} onChange={e => handleConfigChange('questionCount', parseInt(e.target.value, 10))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label htmlFor="timeLimit" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Tempo (minutos)</label>
                                <input id="timeLimit" type="number" min="10" max="240" step="5" value={config.timeLimit} onChange={e => handleConfigChange('timeLimit', parseInt(e.target.value, 10))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateSimulado}
                            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-green-700 disabled:bg-slate-400 transition"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Gerando...' : 'Gerar Simulado'}
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Limite do Teste Gratuito Atingido">
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Você utilizou seu teste gratuito. Para continuar criando simulados ilimitados e ter acesso a todos os recursos, por favor, escolha um de nossos planos.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                     <PricingCard
                        plan="Mensal"
                        price="R$ 29,90"
                        period="mês"
                        description=""
                        features={["Uploads ilimitados", "Simulados ilimitados"]}
                        onSelect={() => {}}
                    />
                    <PricingCard
                        plan="Anual"
                        price="R$ 24,90"
                        period="mês"
                        description="Cobrado anualmente"
                        features={["Economize R$ 72,00", "Acesso completo"]}
                        isFeatured
                        onSelect={() => {}}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ExamGenerator;
