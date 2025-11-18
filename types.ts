
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

export type AppState = 'HOME' | 'GENERATOR' | 'TAKING_EXAM' | 'RESULTS';

export interface FreeTierUsage {
    editalUploads: number;
    simuladosCreated: number;
}
