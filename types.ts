
export interface Question {
    question: string;
    options: string[];
    answer: string;
    subject: string;
}

export interface QuestionWithExplanation extends Question {
    explanation: string;
    videoLinks: { title: string; url: string }[];
}

export interface ExamConfig {
    examName?: string; 
    subjects: string[];
    difficulty: 'Fácil' | 'Médio' | 'Difícil';
    questionCount: number;
    timeLimit: number; // in minutes
}

export interface UserAnswer {
    questionIndex: number;
    answer: string;
}

export interface ExamResult {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    userAnswers: UserAnswer[];
    questions: Question[];
}

// Interface for exams saved in Supabase
export interface SavedExam {
    id: string;
    created_at: string;
    exam_name: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    subjects: string[];
}

export type AppState = 'HOME' | 'GENERATOR' | 'TAKING_EXAM' | 'RESULTS' | 'HISTORY';

export interface FreeTierUsage {
    editalUploads: number;
    simuladosCreated: number;
}

export interface User {
    id: string;
    email?: string;
    name: string;
    phone?: string;
    isPro: boolean;
    isAdmin: boolean;
    // Gamification fields
    level: number;
    currentXp: number;
    nextLevelXp: number;
    title: string;
}

export interface JobRole {
    name: string;
    vacancies: number; 
}

export interface EditalSummary {
    institution: string; 
    registrationDates: string;
    examDate: string;
    location: string;
    totalVacancies: string;
    roles: JobRole[];
    subjects: string[];
}