
import React from 'react';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
    const { resetState } = useApp();

    return (
        <header className="bg-white dark:bg-slate-800 shadow-md">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div 
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={resetState}
                >
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        PRO <span className="text-blue-600 dark:text-blue-500">CONCURSOS</span>
                    </h1>
                </div>
            </div>
        </header>
    );
};

export default Header;
