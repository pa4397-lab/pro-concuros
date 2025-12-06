
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { processEdital, generateQuestions } from '../services/geminiService';
import { ExamConfig, EditalSummary, JobRole } from '../types';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import PricingCard from '../components/PricingCard';
import { createPreference } from '../services/paymentService';

const ExamGenerator: React.FC = () => {
    const { setAppState, setExamConfig, setQuestions, freeTierUsage, incrementEditalUploads, incrementSimuladosCreated, isFreeTierExceeded, user, openAuthModal } = useApp();
    
    // UI State
    const [inputType, setInputType] = useState<'url' | 'pdf' | 'text'>('url');
    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Data State
    const [customExamName, setCustomExamName] = useState('');
    const [editalSummary, setEditalSummary] = useState<EditalSummary | null>(null);
    const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    
    const [config, setConfig] = useState<Omit<ExamConfig, 'subjects'>>({
        difficulty: 'Médio',
        questionCount: 10,
        timeLimit: 60
    });

    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStartAnalysis = () => {
        if (!user) {
            openAuthModal();
            return;
        }
        processAnalysis();
    };

    const processAnalysis = async () => {
        if ((inputType === 'text' || inputType === 'url') && !inputValue.trim()) {
            setError("Por favor, preencha o campo solicitado.");
            return;
        }
        if (inputType === 'pdf' && !selectedFile) {
            setError("Por favor, selecione um arquivo PDF.");
            return;
        }
        if (!customExamName.trim()) {
            setError("Dê um nome para este simulado (ex: Concurso BB 2024)");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (freeTierUsage.editalUploads === 0 && !user?.isPro) {
                incrementEditalUploads();
            }

            const input = inputType === 'pdf' ? selectedFile! : inputValue;
            const summary = await processEdital(input, inputType);
            
            setEditalSummary(summary);
            // Reset Selections
            setSelectedJobRole(null);
            setSelectedSubjects([]);

        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubjectToggle = (subject: string) => {
        if (selectedSubjects.includes(subject)) {
            setSelectedSubjects(prev => prev.filter(s => s !== subject));
        } else {
            // Free Tier Constraint
            // Admin inherits Pro, so user?.isPro (which is isPro || isAdmin) works here
            if (!user?.isPro && selectedSubjects.length >= 3) {
                return;
            }
            setSelectedSubjects(prev => [...prev, subject]);
        }
    };

    const handleGenerateSimulado = async () => {
        if (isFreeTierExceeded(selectedSubjects.length)) {
            setIsPricingModalOpen(true);
            return;
        }

        if (selectedSubjects.length === 0) {
            setError("Selecione pelo menos uma matéria.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const fullConfig: ExamConfig = { 
                ...config, 
                subjects: selectedSubjects,
                examName: customExamName
            };
            const generatedQuestions = await generateQuestions(
                fullConfig.subjects,
                fullConfig.difficulty,
                fullConfig.questionCount
            );
            if(generatedQuestions.length < 5){
                 setError("A IA gerou poucas questões. Tente novamente com matérias diferentes.");
                 setIsLoading(false);
                 return;
            }
            setExamConfig(fullConfig);
            setQuestions(generatedQuestions);
            if (!user?.isPro) incrementSimuladosCreated();
            setAppState('TAKING_EXAM');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                setSelectedFile(file);
                setInputValue(file.name);
                setError(null);
            } else {
                setError("Apenas arquivos PDF são permitidos.");
            }
        }
    };

    const handleUpgradeAction = async (plan: 'monthly' | 'annual') => {
        if(!user) return;
        setProcessingPayment(true);
        try {
            const { init_point } = await createPreference(plan, user.id, user.email || '');
            window.location.href = init_point;
        } catch (e) {
            console.error(e);
            alert("Erro ao iniciar pagamento.");
            setProcessingPayment(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto animate__animated animate__fadeIn">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <button onClick={() => setAppState('HOME')} className="text-slate-400 hover:text-white flex items-center text-sm mb-4 transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        Voltar para Home
                    </button>
                    <h2 className="text-3xl font-bold text-white">Novo Simulado</h2>
                    <p className="text-slate-400">Extraia conteúdo do edital e gere provas personalizadas.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Input Section */}
                    <div className="bg-slate-900/50 border border-white/5 p-1 rounded-2xl backdrop-blur-sm overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-white/5 bg-slate-950/30">
                            <button 
                                onClick={() => { setInputType('url'); setEditalSummary(null); }}
                                className={`flex-1 py-4 text-sm font-medium transition flex items-center justify-center ${inputType === 'url' ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                Link do Edital
                            </button>
                            <button 
                                onClick={() => { setInputType('pdf'); setEditalSummary(null); }}
                                className={`flex-1 py-4 text-sm font-medium transition flex items-center justify-center ${inputType === 'pdf' ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                Upload PDF
                            </button>
                            <button 
                                onClick={() => { setInputType('text'); setEditalSummary(null); }}
                                className={`flex-1 py-4 text-sm font-medium transition flex items-center justify-center ${inputType === 'text' ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Texto Copiado
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
                            
                            {/* Exam Name Input */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Nome do Simulad (ex: Banco do Brasil 2024)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                    placeholder="Dê um nome para identificar este estudo..."
                                    value={customExamName}
                                    onChange={e => setCustomExamName(e.target.value)}
                                    disabled={isLoading || !!editalSummary}
                                />
                            </div>

                            {inputType === 'url' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Cole o link oficial do edital (PDF ou Página)</label>
                                    <input 
                                        type="url" 
                                        className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="https://exemplo.com/edital.pdf"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        disabled={isLoading || !!editalSummary}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">Nossa IA irá navegar e extrair as informações relevantes.</p>
                                </div>
                            )}

                            {inputType === 'pdf' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Selecione o arquivo do seu computador</label>
                                    <div 
                                        onClick={() => !editalSummary && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${editalSummary ? 'opacity-50 cursor-not-allowed border-white/10' : 'border-white/20 hover:border-brand-500 hover:bg-slate-800/50'}`}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="application/pdf" 
                                            onChange={handleFileChange} 
                                            disabled={!!editalSummary}
                                        />
                                        <svg className="w-10 h-10 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                        {selectedFile ? (
                                            <p className="text-brand-400 font-semibold">{selectedFile.name}</p>
                                        ) : (
                                            <p className="text-slate-400 text-sm">Clique para upload (PDF)</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {inputType === 'text' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Cole o conteúdo programático</label>
                                    <textarea
                                        rows={6}
                                        className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                                        placeholder="Cole aqui o texto..."
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        disabled={isLoading || !!editalSummary}
                                    />
                                </div>
                            )}

                            {!editalSummary && (
                                <button
                                    onClick={handleStartAnalysis}
                                    disabled={isLoading}
                                    className="mt-6 w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition flex justify-center items-center disabled:opacity-50"
                                >
                                    {isLoading ? <><Spinner message="" /><span className="ml-2">Analisando Edital com IA...</span></> : 'Processar Edital'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Analysis Result */}
                    {editalSummary && (
                        <div className="animate__animated animate__fadeInUp space-y-6">
                            {/* Summary Card */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-1">{editalSummary.institution}</h3>
                                    <p className="text-brand-400 text-sm font-medium mb-4">Resumo do Concurso</p>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                            <p className="text-xs text-slate-500 uppercase">Vagas Totais</p>
                                            <p className="font-semibold text-white">{editalSummary.totalVacancies}</p>
                                        </div>
                                        <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                            <p className="text-xs text-slate-500 uppercase">Inscrições</p>
                                            <p className="font-semibold text-white text-xs mt-1">{editalSummary.registrationDates}</p>
                                        </div>
                                        <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                            <p className="text-xs text-slate-500 uppercase">Local</p>
                                            <p className="font-semibold text-white">{editalSummary.location}</p>
                                        </div>
                                        <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                            <p className="text-xs text-slate-500 uppercase">Data Prova</p>
                                            <p className="font-semibold text-white">{editalSummary.examDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Job Roles Selection */}
                            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex justify-between">
                                    <span>Selecione seu Cargo (Vaga)</span>
                                    <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                                        {user?.isPro ? 'Ilimitado' : 'Máx: 1 (Grátis)'}
                                    </span>
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {editalSummary.roles.length > 0 ? editalSummary.roles.map((role, idx) => (
                                        <label key={idx} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${selectedJobRole === role ? 'bg-brand-500/20 border border-brand-500' : 'bg-slate-950 border border-white/5 hover:bg-slate-800'}`}>
                                            <div className="flex items-center">
                                                <input 
                                                    type="radio" 
                                                    name="jobRole"
                                                    className="form-radio text-brand-500 focus:ring-brand-500 h-4 w-4 bg-slate-900 border-slate-600"
                                                    checked={selectedJobRole === role}
                                                    onChange={() => setSelectedJobRole(role)}
                                                />
                                                <span className="ml-3 text-sm text-slate-200">{role.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">{role.vacancies} vagas</span>
                                        </label>
                                    )) : (
                                        <p className="text-slate-500 text-sm">Nenhum cargo específico identificado. Prossiga com as matérias.</p>
                                    )}
                                </div>
                            </div>

                            {/* Subjects Selection */}
                            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex justify-between">
                                    <span>Selecione as Matérias</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${selectedSubjects.length >= 3 && !user?.isPro ? 'text-red-400 bg-red-500/10' : 'text-brand-400 bg-brand-500/10'}`}>
                                        {user?.isPro ? `${selectedSubjects.length} selecionadas` : `${selectedSubjects.length}/3 (Grátis)`}
                                    </span>
                                </h3>
                                <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {editalSummary.subjects.map((subject, idx) => {
                                        const isSelected = selectedSubjects.includes(subject);
                                        const isDisabled = !user?.isPro && !isSelected && selectedSubjects.length >= 3;
                                        
                                        return (
                                            <label key={idx} className={`flex items-center p-3 rounded-lg transition ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-950/30' : 'cursor-pointer'} ${isSelected ? 'bg-brand-500/20 border border-brand-500' : 'bg-slate-950 border border-white/5 hover:bg-slate-800'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    className="form-checkbox text-brand-500 focus:ring-brand-500 rounded bg-slate-900 border-slate-600"
                                                    checked={isSelected}
                                                    onChange={() => handleSubjectToggle(subject)}
                                                    disabled={isDisabled}
                                                />
                                                <span className={`ml-3 text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{subject}</span>
                                                {isDisabled && <svg className="w-3 h-3 ml-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>}
                                            </label>
                                        );
                                    })}
                                </div>
                                {!user?.isPro && selectedSubjects.length >= 3 && (
                                    <p className="text-xs text-yellow-500 mt-3 flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        Limite do plano gratuito atingido. <button onClick={() => setIsPricingModalOpen(true)} className="underline hover:text-white ml-1">Fazer Upgrade</button>
                                    </p>
                                )}
                            </div>

                            {/* Exam Config & Action */}
                             <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <h3 className="text-sm font-semibold text-slate-300 mb-4 pb-2 border-b border-white/5">Configuração Final</h3>
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Dificuldade</label>
                                        <select value={config.difficulty} onChange={e => setConfig(prev => ({...prev, difficulty: e.target.value as any}))} className="w-full bg-slate-950 border border-white/10 rounded-lg text-sm p-2 text-white">
                                            <option>Fácil</option>
                                            <option>Médio</option>
                                            <option>Difícil</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Questões</label>
                                        <input type="number" min="5" max="50" value={config.questionCount} onChange={e => setConfig(prev => ({...prev, questionCount: parseInt(e.target.value)}))} className="w-full bg-slate-950 border border-white/10 rounded-lg text-sm p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Tempo (min)</label>
                                        <input type="number" value={config.timeLimit} onChange={e => setConfig(prev => ({...prev, timeLimit: parseInt(e.target.value)}))} className="w-full bg-slate-950 border border-white/10 rounded-lg text-sm p-2 text-white" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleGenerateSimulado}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.01] flex justify-center items-center"
                                >
                                    {isLoading ? <><Spinner message="" /><span className="ml-2">Criando Questões...</span></> : 'Gerar Simulado Agora'}
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {user ? (
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
                            <div className="flex items-center mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.isAdmin ? 'bg-red-600' : 'bg-brand-600'}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                    <p className="text-white font-bold text-sm">{user.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {user.isAdmin ? 'Administrador' : (user.isPro ? 'Membro PRO' : 'Plano Gratuito')}
                                    </p>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Nível {user.level}</span>
                                    <span>{user.currentXp} / {user.nextLevelXp} XP</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${(user.currentXp / user.nextLevelXp) * 100}%` }}></div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setAppState('HISTORY')}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg mb-2 transition-colors flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Ver Histórico Completo
                            </button>

                            {!user.isPro && (
                                <button onClick={() => setIsPricingModalOpen(true)} className="w-full py-2 bg-gradient-to-r from-brand-600 to-blue-600 text-white text-xs font-bold rounded-lg mb-2">
                                    Seja PRO (R$ 29,90/mês)
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-brand-900/50 to-slate-900 border border-brand-500/20 p-6 rounded-2xl">
                             <h3 className="text-white font-bold text-lg mb-2">Identifique-se</h3>
                             <p className="text-slate-400 text-sm mb-4">Faça login para salvar seus editais e acompanhar seu progresso.</p>
                             <button onClick={openAuthModal} className="w-full py-2 bg-white text-slate-900 font-bold rounded-lg text-sm">Entrar</button>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} title="Upgrade Necessário">
                <div className="text-center mb-6">
                    <p className="text-slate-400">
                        Você atingiu os limites do plano gratuito. Para selecionar mais matérias e gerar simulados ilimitados, assine o PRO.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                     <PricingCard
                        plan="Mensal"
                        price="R$ 29,90"
                        period="mês"
                        description=""
                        features={["Uploads ilimitados", "Sem fidelidade"]}
                        onSelect={() => handleUpgradeAction('monthly')}
                    />
                    <PricingCard
                        plan="Anual"
                        price="R$ 24,90"
                        period="mês"
                        economy="R$ 72,00 OFF"
                        description="Suporte Prioritário"
                        features={["Melhor valor", "Acesso completo"]}
                        isFeatured
                        onSelect={() => handleUpgradeAction('annual')}
                    />
                </div>
                {processingPayment && <div className="mt-4"><Spinner message="Gerando link de pagamento..." /></div>}
            </Modal>
        </div>
    );
};

export default ExamGenerator;