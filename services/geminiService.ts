
import { GoogleGenAI } from "@google/genai";

// Inicialização conforme instruções do sistema: uso direto de process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const polishTaskDescription = async (title: string, rawDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um gestor de projetos profissional na agência criativa Pixelar.
      Refine este briefing de tarefa para ser mais profissional, claro e motivador para a equipa.
      Mantenha em Português de Portugal/Angola.
      
      Título: ${title}
      Rascunho: ${rawDescription}`,
    });

    const text = response.text;
    return text?.trim() || rawDescription;
  } catch (error) {
    console.error("Erro na integração Gemini:", error);
    return rawDescription;
  }
};
