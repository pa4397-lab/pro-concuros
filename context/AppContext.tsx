
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AppState, ExamConfig, Question, ExamResult, FreeTierUsage } from '../types';

interface AppContextType {
    appState: AppState;
    setAppState: (state: AppState) => void;
    examConfig: ExamConfig | null;
    setExamConfig: (config: ExamConfig | null) => void;
    questions: Question[];
    setQuestions: (questions: Question[]) => void;
    examResult: ExamResult | null;
    setExamResult: (result: ExamResult | null) => void;
    freeTierUsage: FreeTierUsage;
    incrementEditalUploads: () => void;
    incrementSimuladosCreated: () => void;
    isFreeTierExceeded: (subjectCount: number) => boolean;
    resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useState<AppState>('HOME');
    const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    
    const [freeTierUsage, setFreeTierUsage] = useState<FreeTierUsage>(() => {
        try {
            const item = window.localStorage.getItem('proConcursosFreeTier');
            return item ? JSON.parse(item) : { editalUploads: 0, simuladosCreated: 0 };
        } catch (error) {
            console.error(error);
            return { editalUploads: 0, simuladosCreated: 0 };
        }
    });

    const updateLocalStorage = (usage: FreeTierUsage) => {
        try {
            window.localStorage.setItem('proConcursosFreeTier', JSON.stringify(usage));
        } catch (error) {
            console.error(error);
        }
    };
    
    const incrementEditalUploads = useCallback(() => {
        setFreeTierUsage(prev => {
            const newUsage = { ...prev, editalUploads: prev.editalUploads + 1 };
            updateLocalStorage(newUsage);
            return newUsage;
        });
    }, []);

    const incrementSimuladosCreated = useCallback(() => {
        setFreeTierUsage(prev => {
            const newUsage = { ...prev, simuladosCreated: prev.simuladosCreated + 1 };
            updateLocalStorage(newUsage);
            return newUsage;
        });
    }, []);

    const isFreeTierExceeded = useCallback((subjectCount: number): boolean => {
        if (freeTierUsage.editalUploads > 0 && freeTierUsage.simuladosCreated === 0) return false;
        if (freeTierUsage.simuladosCreated > 0) return true;
        if (subjectCount > 3) return true;
        return false;
    }, [freeTierUsage]);
    
    const resetState = useCallback(() => {
        setExamConfig(null);
        setQuestions([]);
        setExamResult(null);
        setAppState('HOME');
    }, []);

    const value = {
        appState,
        setAppState,
        examConfig,
        setExamConfig,
        questions,
        setQuestions,
        examResult,
        setExamResult,
        freeTierUsage,
        incrementEditalUploads,
        incrementSimuladosCreated,
        isFreeTierExceeded,
        resetState,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
