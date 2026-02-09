
import { GoogleGenAI } from "@google/genai";

// Inicialização obrigatória utilizando a chave de ambiente conforme as diretrizes
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const polishTaskDescription = async (title: string, rawDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um gestor de projetos profissional na Pixelar, uma agência digital criativa. 
      Refine esta descrição de tarefa para ser mais clara, profissional e orientada a resultados.
      Mantenha em Português de Angola/Portugal e seja conciso (máximo 3 frases).
      
      Título da Tarefa: ${title}
      Descrição Rascunho: ${rawDescription}`,
    });

    const text = response.text;
    return text?.trim() || rawDescription;
  } catch (error) {
    console.error("Erro ao polir tarefa:", error);
    return rawDescription;
  }
};
