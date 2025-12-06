
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import PricingCard from '../components/PricingCard';
import Modal from '../components/Modal';
import { createPreference, checkPaymentCallback } from '../services/paymentService';
import Spinner from '../components/Spinner';

const HomePage: React.FC = () => {
    const { setAppState, user, openAuthModal, refreshUserProfile } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'error' | null>(null);

    // Check for payment return from Mercado Pago
    useEffect(() => {
        const result = checkPaymentCallback();
        if (result) {
            if (result.success) {
                setPaymentStatus('success');
                // Force refresh to get the new 'isPro' status updated by the webhook
                setTimeout(() => refreshUserProfile(), 2000); 
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else if (result.error) {
                setPaymentStatus('error');
            }
        }
    }, [refreshUserProfile]);

    const Feature = ({ icon, title, description }: { icon: React.ReactElement, title: string, description: string }) => (
        <div className="group p-6 bg-slate-900/40 border border-white/5 rounded-2xl hover:bg-slate-800/60 hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                {icon}
            </div>
            <h3 className="text-lg font-bold mb-2 text-white group-hover:text-brand-300 transition-colors">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
    
    const handlePlanSelection = (plan: 'monthly' | 'annual') => {
        if (!user) {
            openAuthModal();
            return;
        }
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const handlePaymentAction = async () => {
        if (!user || !selectedPlan) return;
        setProcessingPayment(true);
        try {
            const { init_point } = await createPreference(
                selectedPlan, 
                user.id,
                user.email || 'cliente@proconcursos.com'
            );
            
            // Redirect to Mercado Pago Checkout
            window.location.href = init_point;
            
        } catch (error) {
            console.error(error);
            alert("Erro ao iniciar pagamento. Tente novamente.");
            setProcessingPayment(false);
        }
    };
    
    // Updated Plans based on user request
    const freeFeatures = [
        "Upload de 1 edital",
        "1 simulado experimental",
        "Correção via IA (Básica)",
        "Acesso básico ao sistema"
    ];

    const monthlyFeatures = [
        "Uploads ILIMITADOS",
        "Geração de simulados ILIMITADA",
        "Análise de Desempenho Profunda",
        "Explicações Detalhadas com Vídeos",
        "Acesso Prioritário a novos modelos"
    ];

    const annualFeatures = [
        "Tudo do Plano Mensal",
        "Suporte Prioritário ao Sistema",
        "Economia de R$ 72,00/ano"
    ];

    return (
        <div className="space-y-24 animate__animated animate__fadeIn pb-12">
            
            {/* Payment Success/Error Notifications */}
            {paymentStatus === 'success' && (
                <div className="fixed top-24 right-4 z-50 bg-green-500 text-white p-4 rounded-xl shadow-2xl animate__animated animate__bounceInRight max-w-sm">
                    <div className="flex items-center">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <div>
                            <h4 className="font-bold">Pagamento Aprovado!</h4>
                            <p className="text-sm opacity-90">Sua conta PRO foi ativada. Aproveite!</p>
                        </div>
                        <button onClick={() => setPaymentStatus(null)} className="ml-4 hover:bg-green-600 rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                </div>
            )}
            
            {paymentStatus === 'error' && (
                <div className="fixed top-24 right-4 z-50 bg-red-500 text-white p-4 rounded-xl shadow-2xl animate__animated animate__bounceInRight max-w-sm">
                    <div className="flex items-center">
                        <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <div>
                            <h4 className="font-bold">Pagamento Não Concluído</h4>
                            <p className="text-sm opacity-90">Houve um problema. Tente novamente.</p>
                        </div>
                        <button onClick={() => setPaymentStatus(null)} className="ml-4 hover:bg-red-600 rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="text-center pt-10 pb-16 relative">
                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-brand-500/20 to-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <span className="inline-block py-1 px-3 rounded-full bg-slate-800/50 border border-white/10 text-brand-300 text-xs font-semibold mb-6 tracking-wide backdrop-blur-sm">
                        ✨ A Revolução dos Concursos Chegou
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        Passe no concurso dos <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-blue-500">
                            seus sonhos com IA.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Pare de perder tempo filtrando questões. Nossa IA lê seu edital e gera simulados personalizados instantaneamente. Estude o que realmente cai.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => setAppState('GENERATOR')}
                            className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-200 font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 shadow-xl shadow-white/5 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1"
                        >
                            Criar Simulado Grátis
                        </button>
                        <button
                            onClick={() => {
                                const el = document.getElementById('pricing-section');
                                el?.scrollIntoView({behavior: 'smooth'});
                            }}
                            className="w-full sm:w-auto bg-slate-800/50 hover:bg-slate-800 text-white border border-white/10 font-semibold py-4 px-10 rounded-xl text-lg transition-all duration-300 backdrop-blur-sm hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1"
                        >
                            Ver Planos Premium
                        </button>
                    </div>
                    <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-slate-500">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>Sem cartão de crédito para testar</span>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Tecnologia de Ponta para sua Aprovação</h2>
                    <p className="text-slate-400">Tudo o que você precisa para sair na frente da concorrência.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <Feature
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                        title="Leitura de Edital"
                        description="Cole o link ou texto. Nossa IA disseca o edital e identifica cada tópico cobrado em segundos."
                    />
                    <Feature
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
                        title="Simulados Infinitos"
                        description="Nunca repita uma prova. Gere questões inéditas baseadas no perfil da banca e dificuldade desejada."
                    />
                    <Feature
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                        title="Correção Explicada"
                        description="Errou? A IA explica o porquê e ainda recomenda vídeos específicos para você aprender o conceito."
                    />
                    <Feature
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
                        title="Coach Virtual"
                        description="Análise de dados precisa que aponta seus pontos fracos e cria um roteiro de estudos automático."
                    />
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing-section" className="relative py-16">
                 <div className="absolute inset-0 bg-slate-900/50 -skew-y-3 transform origin-top-left z-0"></div>
                 <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <span className="text-brand-400 font-bold tracking-wider uppercase text-sm">Investimento no seu Futuro</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Escolha o plano da sua aprovação</h2>
                    </div>
                    
                    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                        {/* Free Tier */}
                        <PricingCard
                            plan="Gratuito"
                            price="R$ 0,00"
                            period="para sempre"
                            description="Ideal para conhecer a plataforma."
                            features={freeFeatures}
                            onSelect={() => setAppState('GENERATOR')}
                        />

                        {/* Monthly Tier */}
                        <PricingCard
                            plan="Plano Mensal - PRO"
                            price="R$ 29,90"
                            period="mês"
                            description="Acesso total e flexibilidade."
                            features={monthlyFeatures}
                            onSelect={() => handlePlanSelection('monthly')}
                        />

                        {/* Annual Tier */}
                        <PricingCard
                            plan="Plano Anual - PRO"
                            price="R$ 24,90"
                            period="mês"
                            economy="Economize R$ 72,00"
                            description="A escolha dos aprovados. Suporte VIP."
                            features={annualFeatures}
                            isFeatured
                            onSelect={() => handlePlanSelection('annual')}
                        />
                    </div>
                </div>
            </section>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Checkout Seguro">
                <div className="text-center">
                    <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Finalizar Assinatura {selectedPlan === 'annual' ? 'Anual' : 'Mensal'}</h4>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                        Você será redirecionado para o ambiente seguro do Mercado Pago para concluir sua assinatura.
                    </p>
                    <button 
                        onClick={handlePaymentAction} 
                        disabled={processingPayment}
                        className="bg-brand-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-700 transition-colors w-full disabled:opacity-50"
                    >
                        {processingPayment ? <Spinner message="Criando link de pagamento..." /> : 'Ir para Mercado Pago'}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-4">Ambiente seguro e criptografado. Cancelamento a qualquer momento.</p>
                </div>
            </Modal>
        </div>
    );
};

export default HomePage;
