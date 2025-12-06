
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-950 border-t border-white/5 relative z-10">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} PRO CONCURSOS. Aprovando Vencedores.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-brand-400 transition">Termos</a>
                        <a href="#" className="hover:text-brand-400 transition">Privacidade</a>
                        <a href="#" className="hover:text-brand-400 transition">Suporte</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
