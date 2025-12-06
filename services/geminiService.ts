
import { GoogleGenAI, Type } from "@google/genai";
import { Question, EditalSummary } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper to handle input types
export const processEdital = async (
    input: string | File, 
    inputType: 'text' | 'pdf' | 'url'
): Promise<EditalSummary> => {
    try {
        let contents: any[] = [];
        
        // Instrução de Sistema para definir a persona da IA
        const systemInstruction = `
        Você é um Auditor Especialista em Análise de Editais de Concursos Públicos.
        Sua função é ler documentos complexos e extrair dados estruturados com extrema precisão.
        
        Diretrizes de Extração:
        1. CARGOS: Identifique o nome exato do cargo. Se houver variação por especialidade (ex: Analista - TI, Analista - Direito), liste separadamente.
        2. VAGAS: Extraia o número total (Ampla + Cotas). Se for apenas Cadastro Reserva, indique 'CR' ou 0.
        3. MATÉRIAS (CRÍTICO): Extraia APENAS as disciplinas MACRO (Raízes). 
           - CORRETO: "Língua Portuguesa", "Raciocínio Lógico", "Direito Constitucional", "Informática", "Conhecimentos Bancários".
           - ERRADO: Não liste sub-tópicos como "Crase", "Hardware", "Atos Administrativos" ou "Linux". Agrupe tudo na matéria mãe.
           - Se houver "Conhecimentos Básicos" e "Específicos", tente desmembrar as matérias que compõem esses blocos.
        `;

        let promptText = `
        Com base no edital fornecido, extraia as informações no formato JSON solicitado.
        Se o texto for muito longo ou confuso, priorize as tabelas de cargos e o conteúdo programático.
        `;

        if (inputType === 'pdf') {
            const file = input as File;
            const base64Data = await fileToGenerativePart(file);
            contents = [
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: base64Data
                    }
                },
                { text: promptText }
            ];
        } else if (inputType === 'url') {
            promptText += `\n O link do edital é: ${input}. Use a ferramenta de busca do Google para encontrar a página oficial ou o PDF do edital e extrair as informações. Se houver múltiplos editais (abertura, retificação), baseie-se no de Abertura.`;
            contents = [{ text: promptText }];
        } else {
            promptText += `\n Texto do Edital: \n ${input}`;
            contents = [{ text: promptText }];
        }

        // Usa modelos mais capazes para leitura de documentos complexos
        const modelId = inputType === 'url' ? 'gemini-3-pro-image-preview' : 'gemini-3-pro-preview';
        const tools = inputType === 'url' ? [{ googleSearch: {} }] : [];

        const response = await ai.models.generateContent({
            model: modelId,
            contents: contents.length === 1 && typeof contents[0].text === 'string' ? contents[0].text : { parts: contents },
            config: {
                systemInstruction: systemInstruction,
                tools: tools,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        institution: { type: Type.STRING, description: "Nome da banca organizadora e do órgão (ex: Cebraspe - Polícia Federal)" },
                        registrationDates: { type: Type.STRING, description: "Período de inscrição (Data Início a Data Fim)" },
                        examDate: { type: Type.STRING, description: "Data da prova objetiva" },
                        location: { type: Type.STRING, description: "Cidade(s) ou Estado(s) de lotação/prova" },
                        totalVacancies: { type: Type.STRING, description: "Resumo de vagas (ex: '50 + CR' ou '300 vagas')" },
                        roles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Nome do cargo" },
                                    vacancies: { type: Type.NUMBER, description: "Número de vagas imediatas (use 0 se for apenas CR)" }
                                }
                            }
                        },
                        subjects: {
                            type: Type.ARRAY,
                            description: "Lista de disciplinas macro (Matérias) cobradas na prova.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["institution", "roles", "subjects"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        // Sanity check/fallback
        return {
            institution: result.institution || "Não identificado",
            registrationDates: result.registrationDates || "Consultar edital",
            examDate: result.examDate || "A definir",
            location: result.location || "Nacional/Regional",
            totalVacancies: result.totalVacancies || "Ver edital",
            roles: result.roles || [],
            subjects: result.subjects || []
        };

    } catch (error) {
        console.error("Erro ao processar edital:", error);
        throw new Error("Não foi possível processar o edital. Verifique o arquivo ou link e tente novamente.");
    }
};

async function fileToGenerativePart(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data url prefix (e.g. "data:application/pdf;base64,")
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export const generateQuestions = async (subjects: string[], difficulty: string, questionCount: number): Promise<Question[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
