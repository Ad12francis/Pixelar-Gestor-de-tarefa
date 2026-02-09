
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
// Só cria a instância se a chave não for vazia
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const polishTaskDescription = async (title: string, rawDescription: string): Promise<string> => {
  // Se não houver IA configurada, retorna o texto original sem erro
  if (!ai) {
    console.warn("IA desativada: Chave de API não configurada.");
    return rawDescription;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um gestor de projetos profissional na Pixelar... [resto do seu prompt]`,
    });

    return response.text?.trim() || rawDescription;
  } catch (error) {
    console.error("Erro ao polir tarefa:", error);
    return rawDescription;
  }
};
