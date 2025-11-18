
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import HomePage from './views/HomePage';
import ExamGenerator from './views/ExamGenerator';
import ExamView from './views/ExamView';
import ResultsView from './views/ResultsView';
import Header from './components/Header';
import Footer from './components/Footer';

const AppContent: React.FC = () => {
    const { appState } = useApp();

    const renderContent = () => {
        switch (appState) {
            case 'HOME':
                return <HomePage />;
            case 'GENERATOR':
                return <ExamGenerator />;
            case 'TAKING_EXAM':
                return <ExamView />;
            case 'RESULTS':
                return <ResultsView />;
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
