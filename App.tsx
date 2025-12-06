
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import HomePage from './views/HomePage';
import ExamGenerator from './views/ExamGenerator';
import ExamView from './views/ExamView';
import ResultsView from './views/ResultsView';
import HistoryView from './views/HistoryView';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

const AppContent: React.FC = () => {
    const { appState, isAuthModalOpen, closeAuthModal } = useApp();

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
            case 'HISTORY':
                return <HistoryView />;
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] mix-blend-screen opacity-30"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] mix-blend-screen opacity-30"></div>
            </div>
            
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
                {renderContent()}
            </main>
            <Footer />

            <AuthModal 
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                onSuccess={closeAuthModal}
            />
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