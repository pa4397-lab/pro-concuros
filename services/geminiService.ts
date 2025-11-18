
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const extractSubjectsFromEdital = async (editalContent: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analise o seguinte texto de um edital de concurso público e extraia APENAS a lista de matérias/disciplinas cobradas. Retorne a resposta como um array JSON de strings.

            Edital:
            ---
            ${editalContent}
            ---
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        materias: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.materias || [];
    } catch (error) {
        console.error("Erro ao extrair matérias do edital:", error);
        throw new Error("Não foi possível processar o edital. Verifique o conteúdo e tente novamente.");
    }
};

export const generateQuestions = async (subjects: string[], difficulty: string, questionCount: number): Promise<Question[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Gere ${questionCount} questões de múltipla escolha para um concurso público, com 4 opções cada e apenas uma correta. 
            As questões devem ser sobre as seguintes matérias: ${subjects.join(', ')}.
            O nível de dificuldade deve ser: ${difficulty}.
            Para cada questão, indique a matéria correspondente.
            Retorne um array JSON de objetos, onde cada objeto tem as chaves "subject", "question", "options" (um array de 4 strings), e "answer" (o texto exato da resposta correta).
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            subject: { type: Type.STRING },
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            answer: { type: Type.STRING }
                        },
                        required: ["subject", "question", "options", "answer"]
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Erro ao gerar questões:", error);
        throw new Error("A IA não conseguiu gerar as questões. Tente novamente com parâmetros diferentes.");
    }
};

export const generateExplanation = async (question: Question, userAnswer: string) => {
    const isCorrect = userAnswer === question.answer;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
            A seguinte questão de concurso foi respondida.
            Questão: "${question.question}"
            Opções: ${question.options.join(", ")}
            Resposta Correta: "${question.answer}"
            Resposta do Usuário: "${userAnswer}"
            Status: ${isCorrect ? 'Correta' : 'Incorreta'}

            1. Forneça uma explicação clara e concisa sobre o porquê da resposta correta ser a certa, e se a resposta do usuário foi incorreta, explique o erro.
            2. Sugira 2 vídeos fictícios no YouTube que aprofundem o tema da questão.

            Retorne a resposta como um objeto JSON com as chaves "explanation" (string) e "videoLinks" (um array de objetos com "title" e "url").
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: { type: Type.STRING },
                        videoLinks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    url: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    required: ["explanation", "videoLinks"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Erro ao gerar explicação:", error);
        throw new Error("Não foi possível gerar a explicação para esta questão.");
    }
};

export const analyzePerformance = async (incorrectQuestions: Question[]): Promise<string> => {
     if (incorrectQuestions.length === 0) {
        return "Parabéns! Você acertou todas as questões. Continue com o excelente trabalho e explore novos simulados para solidificar seu conhecimento.";
    }
    try {
        const topics = incorrectQuestions.map(q => `Matéria: ${q.subject}, Questão: ${q.question}`).join('\n');
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
            Um usuário de uma plataforma de estudos para concursos errou as seguintes questões:
            ${topics}

            Com base nesses erros, analise o desempenho do usuário. Identifique as matérias e os subtemas com maior dificuldade. 
            Forneça uma análise construtiva e sugestões de tópicos específicos para reforço nos estudos.
            A resposta deve ser em formato de texto (markdown), começando com um título "Análise de Desempenho".
            Seja encorajador.
            `,
        });
        
        return response.text;
    } catch (error) {
        console.error("Erro ao analisar desempenho:", error);
        throw new Error("Não foi possível gerar a análise de desempenho.");
    }
};
