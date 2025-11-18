
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import PricingCard from '../components/PricingCard';
import Modal from '../components/Modal';

const HomePage: React.FC = () => {
    const { setAppState } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // FIX: Changed JSX.Element to React.ReactElement to fix namespace error.
    const Feature = ({ icon, title, description }: { icon: React.ReactElement, title: string, description: string }) => (
        <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-300">{description}</p>
        </div>
    );
    
    const monthlyFeatures = ["Upload de 1 edital", "1 simulado com até 3 matérias", "Acesso limitado a recursos"];
    const annualFeatures = ["Uploads ilimitados de editais", "Simulados ilimitados", "Análise de desempenho completa", "Todos os recursos liberados"];


    return (
        <div className="space-y-16 animate__animated animate__fadeIn">
            {/* Hero Section */}
            <section className="text-center py-16">
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-4">
                    Sua aprovação começa com a <span className="text-blue-600">preparação certa</span>.
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
                    Gere simulados ilimitados com inteligência artificial a partir de qualquer edital e turbine seus estudos para concursos públicos.
                </p>
                <button
                    onClick={() => setAppState('GENERATOR')}
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                >
                    Comece Agora
                </button>
                <p className="text-sm text-slate-500 mt-3">Teste grátis com 1 edital e 1 simulado.</p>
            </section>

            {/* Features Section */}
            <section>
                <h2 className="text-3xl font-bold text-center mb-10 text-slate-900 dark:text-white">Como a Plataforma Funciona</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <Feature
                        icon={<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>}
                        title="1. Upload do Edital"
                        description="Cole o conteúdo do seu edital e nossa IA identifica automaticamente todas as matérias e conteúdos."
                    />
                    <Feature
                        icon={<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>}
                        title="2. Geração Inteligente"
                        description="Personalize seu simulado: escolha a dificuldade, o número de questões e o tempo de prova."
                    />
                    <Feature
                        icon={<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        title="3. Resultados e Explicações"
                        description="Veja sua pontuação, as respostas corretas e acesse explicações detalhadas para cada questão."
                    />
                    <Feature
                        icon={<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>}
                        title="4. Análise de Desempenho"
                        description="Nossa IA aponta seus pontos fracos e indica exatamente o que você precisa estudar para evoluir."
                    />
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-16 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Planos Flexíveis para sua Aprovação</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">Escolha o plano que melhor se adapta à sua jornada de estudos.</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <PricingCard
                        plan="Mensal"
                        price="R$ 29,90"
                        period="mês"
                        description="Ideal para quem busca uma preparação focada e de curto prazo."
                        features={annualFeatures}
                        onSelect={() => setIsModalOpen(true)}
                    />
                    <PricingCard
                        plan="Anual"
                        price="R$ 24,90"
                        period="mês"
                        description="R$ 298,80 por ano. Economize R$ 72,00 e garanta sua preparação completa."
                        features={annualFeatures}
                        isFeatured
                        onSelect={() => setIsModalOpen(true)}
                    />
                </div>
            </section>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Funcionalidade Premium">
                <p className="text-slate-600 dark:text-slate-300">
                    Agradecemos seu interesse! Esta é uma demonstração de conceito. A funcionalidade de assinatura não está implementada.
                </p>
                <div className="mt-6 flex justify-end">
                    <button onClick={() => setIsModalOpen(false)} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                        Entendi
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default HomePage;
