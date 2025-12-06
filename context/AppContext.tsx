
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { AppState, ExamConfig, Question, ExamResult, FreeTierUsage, User } from '../types';
import { supabase } from '../services/supabaseClient';

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
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    addXp: (amount: number) => void;
    refreshUserProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useState<AppState>('HOME');
    const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    // Free tier local tracking (fallback)
    const [freeTierUsage, setFreeTierUsage] = useState<FreeTierUsage>({ editalUploads: 0, simuladosCreated: 0 });

    // 1. Check Auth Session on Mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserProfile(session.user.id, session.user.email);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchUserProfile(session.user.id, session.user.email);
            } else {
                // IMPORTANT: Don't logout if it's the demo user
                setUser(prev => prev?.id === 'demo-user-123' ? prev : null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" (user might be new)
                console.error('Error fetching profile:', error);
                return;
            }

            if (data) {
                const effectivePro = data.is_pro || data.is_admin;
                setUser({
                    id: data.id,
                    email: data.email,
                    name: data.name || 'Usuário',
                    isPro: effectivePro,
                    isAdmin: data.is_admin,
                    level: data.level,
                    currentXp: data.current_xp,
                    nextLevelXp: data.next_level_xp,
                    title: data.title
                });
            } else {
                setUser({
                    id: userId,
                    email: email,
                    name: 'Novo Usuário',
                    isPro: false,
                    isAdmin: false,
                    level: 1,
                    currentXp: 0,
                    nextLevelXp: 500,
                    title: 'Iniciante'
                });
            }
        } catch (err) {
            console.error(err);
        }
    };
    
    const refreshUserProfile = useCallback(async () => {
        if (user?.id && user.id !== 'demo-user-123') {
            await fetchUserProfile(user.id, user.email);
        }
    }, [user]);

    const incrementEditalUploads = useCallback(() => {
        setFreeTierUsage(prev => ({ ...prev, editalUploads: prev.editalUploads + 1 }));
    }, []);

    const incrementSimuladosCreated = useCallback(() => {
        setFreeTierUsage(prev => ({ ...prev, simuladosCreated: prev.simuladosCreated + 1 }));
    }, []);

    const isFreeTierExceeded = useCallback((subjectCount: number): boolean => {
        if (user?.isPro || user?.isAdmin) return false;
        
        if (freeTierUsage.editalUploads > 0 && freeTierUsage.simuladosCreated === 0) return false;
        if (freeTierUsage.simuladosCreated > 0) return true;
        if (subjectCount > 3) return true;
        
        return false;
    }, [freeTierUsage, user]);
    
    const resetState = useCallback(() => {
        setExamConfig(null);
        setQuestions([]);
        setExamResult(null);
        setAppState('HOME');
    }, []);

    const login = useCallback((userData: User) => {
        setUser(userData);
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        resetState();
    }, [resetState]);

    const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

    const addXp = useCallback(async (amount: number) => {
        if (!user) return;
        
        let newXp = user.currentXp + amount;
        let newLevel = user.level;
        let nextLevelXp = user.nextLevelXp;
        let newTitle = user.title;

        if (newXp >= nextLevelXp) {
            newLevel += 1;
            newXp = newXp - nextLevelXp;
            nextLevelXp = Math.floor(nextLevelXp * 1.5);
            
            if (newLevel >= 2) newTitle = "Concurseiro Iniciado";
            if (newLevel >= 5) newTitle = "Concurseiro Focado";
            if (newLevel >= 10) newTitle = "Elite dos Concursos";
        }

        // Optimistic UI update
        setUser(prev => prev ? ({
            ...prev,
            level: newLevel,
            currentXp: newXp,
            nextLevelXp: nextLevelXp,
            title: newTitle
        }) : null);

        // Save to DB only if real user
        if (user.id !== 'demo-user-123') {
            try {
                await supabase.from('profiles').update({
                    level: newLevel,
                    current_xp: newXp,
                    next_level_xp: nextLevelXp,
                    title: newTitle
                }).eq('id', user.id);
            } catch (err) {
                console.error("Failed to sync XP with DB", err);
            }
        }

    }, [user]);

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
        user,
        login,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        addXp,
        refreshUserProfile
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
