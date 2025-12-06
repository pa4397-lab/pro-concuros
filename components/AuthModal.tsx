
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Spinner from './Spinner';
import { supabase } from '../services/supabaseClient';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState<'input' | 'otp' | 'admin'>('input');
    const [inputValue, setInputValue] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const { login } = useApp();

    if (!isOpen) return null;

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue) {
            setError('Preencha o campo corretamente.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: inputValue,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar código. Verifique o e-mail.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) {
            setError('O código deve ter 6 dígitos.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            // Tenta verificar como Magic Link (Login)
            let { data, error } = await supabase.auth.verifyOtp({
                email: inputValue,
                token: otp,
                type: 'magiclink'
            });

            // Se falhar, tenta verificar como Signup (Cadastro Novo)
            if (error) {
                const retry = await supabase.auth.verifyOtp({
                    email: inputValue,
                    token: otp,
                    type: 'signup'
                });
                error = retry.error;
                data = retry.data;
            }

            if (error) throw error;
            
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError('Código inválido ou expirado. Tente reenviar.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: inputValue,
                password: password
            });

            if (error) throw error;
            onSuccess();
        } catch (err: any) {
             setError('Credenciais inválidas.');
        } finally {
            setLoading(false);
        }
    }

    const handleTestLogin = () => {
        // Simula um login completo com acesso PRO para testes
        const demoUser = {
            id: 'demo-user-123',
            email: 'visitante@proconcursos.com',
            name: 'Visitante Demo',
            isPro: true,
            isAdmin: false,
            level: 5,
            currentXp: 2500,
            nextLevelXp: 3000,
            title: 'Concurseiro Focado'
        };
        login(demoUser);
        onSuccess();
    };

    const reset = () => {
        setStep('input');
        setInputValue('');
        setOtp('');
        setPassword('');
        setError('');
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate__animated animate__fadeIn">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                <div className={`h-2 w-full bg-gradient-to-r ${step === 'admin' ? 'from-red-600 to-orange-600' : 'from-brand-500 to-blue-500'}`}></div>
                
                <button 
                    onClick={() => { reset(); onClose(); }}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${step === 'admin' ? 'bg-red-500/10' : 'bg-brand-500/10'}`}>
                            {step === 'admin' ? (
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            ) : (
                                <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-white">{step === 'admin' ? 'Acesso Admin' : 'Acesso à Plataforma'}</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {step === 'admin' ? 'Login restrito via senha.' : 'Entre para salvar seus simulados.'}
                        </p>
                    </div>

                    {step === 'input' && (
                        <div className="space-y-4">
                            <form onSubmit={handleSendCode}>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                                        E-mail
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <input
                                            type="email"
                                            className="w-full pl-10 p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                                            placeholder="seu@email.com"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-4 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? <Spinner message="" /> : 'Receber Link/Código'}
                                </button>
                            </form>
                            
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">OU TESTE AGORA</span>
                                <div className="flex-grow border-t border-slate-700"></div>
                            </div>

                            <button
                                onClick={handleTestLogin}
                                className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition shadow-lg flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Entrar com Conta de Teste
                            </button>

                            {error && <p className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded">{error}</p>}
                        </div>
                    )} 
                    
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyCode} className="space-y-6">
                            <div className="text-center">
                                <p className="text-slate-300 text-sm">
                                    Enviamos um Magic Link para: <br/><strong className="text-white">{inputValue}</strong>
                                </p>
                                <div className="mt-2 text-xs text-slate-400 bg-slate-800 p-2 rounded">
                                    Dica: Clique no link do e-mail ou digite o código abaixo se houver. Verifique o SPAM.
                                </div>
                                <button type="button" onClick={() => setStep('input')} className="text-brand-400 text-xs hover:underline mt-2">Corrigir e-mail</button>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 text-center">Código (se disponível)</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-center text-2xl tracking-[0.5em] font-mono text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition shadow-lg shadow-brand-500/20 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? <Spinner message="" /> : 'Verificar Código'}
                            </button>
                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                        </form>
                    )}

                    {step === 'admin' && (
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                             <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">E-mail Administrativo</label>
                                <input
                                    type="email"
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 outline-none transition"
                                    placeholder="admin@proconcursos.com.br"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Senha</label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 outline-none transition"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition shadow-lg shadow-red-500/20 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? <Spinner message="" /> : 'Entrar no Sistema'}
                            </button>
                            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                             <div className="text-center pt-2">
                                <button type="button" onClick={() => { setStep('input'); setError(''); setInputValue(''); }} className="text-slate-500 text-xs hover:text-white transition">
                                    Voltar para login de aluno
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {step !== 'admin' && (
                        <>
                            <div className="mt-6 flex justify-center">
                                <button onClick={() => { setStep('admin'); setError(''); setInputValue(''); }} className="text-[10px] text-slate-700 hover:text-slate-500 uppercase tracking-widest font-bold transition">
                                    Acesso Administrativo
                                </button>
                            </div>
                            <p className="mt-4 text-center text-xs text-slate-600">
                                Ao continuar, você concorda com nossos <a href="#" className="underline hover:text-slate-400">Termos</a> e <a href="#" className="underline hover:text-slate-400">Política de Privacidade</a>.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
