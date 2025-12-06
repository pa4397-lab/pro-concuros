
import React from 'react';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
    const { resetState, openAuthModal, user, logout, setAppState } = useApp();

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div 
                    className="flex items-center space-x-3 cursor-pointer group"
                    onClick={resetState}
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-300">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            PRO <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-400">CONCURSOS</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Plataforma de Elite</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                     <button 
                        onClick={() => window.open('#pricing', '_self')}
                        className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Planos
                    </button>

                    {user && (
                        <button 
                            onClick={() => setAppState('HISTORY')}
                            className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Meus Simulados
                        </button>
                    )}
                    
                    {user ? (
                         <div className="flex items-center space-x-3 bg-slate-900 border border-white/10 rounded-full pl-1 pr-4 py-1">
                             <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold text-white leading-none">{user.name.split(' ')[0]}</p>
                                <p className="text-[10px] text-brand-400 leading-none mt-0.5">Lvl {user.level} • {user.title}</p>
                            </div>
                            <button 
                                onClick={logout}
                                className="ml-2 text-slate-500 hover:text-red-400 transition-colors"
                                title="Sair"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            </button>
                         </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                             <button 
                                onClick={openAuthModal}
                                className="text-sm font-bold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                            >
                                Entrar
                            </button>
                            <button 
                                onClick={() => {
                                    const pricingSection = document.getElementById('pricing-section');
                                    if(pricingSection) {
                                        pricingSection.scrollIntoView({ behavior: 'smooth' });
                                    } else {
                                        resetState();
                                    }
                                }}
                                className="bg-white text-slate-950 hover:bg-slate-200 font-bold py-2 px-5 rounded-lg text-sm transition-all shadow-lg shadow-white/5"
                            >
                                Assinar PRO
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;