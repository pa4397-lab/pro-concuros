
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="container mx-auto px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                <p>&copy; {new Date().getFullYear()} PRO CONCURSOS. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
