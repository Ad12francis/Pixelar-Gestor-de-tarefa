// src/services/jsonDbService.ts
import { AppData } from '../types';

const DB_FILE_PATH = '/database.json';

// Interface para o que será salvo no JSON
interface JsonDatabase {
  version: string;
  lastUpdated: string;
  data: AppData;
}

class JsonDbService {
  private static instance: JsonDbService;
  private apiUrl: string;

  private constructor() {
    // Em desenvolvimento, usamos o caminho relativo
    // Em produção, precisaríamos de um endpoint API
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/db'  // Endpoint da API em produção
      : DB_FILE_PATH;
  }

  static getInstance(): JsonDbService {
    if (!JsonDbService.instance) {
      JsonDbService.instance = new JsonDbService();
    }
    return JsonDbService.instance;
  }

  async save(data: AppData): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Em produção, enviar para API
        return await this.saveToApi(data);
      } else {
        // Em desenvolvimento, usar fetch para o arquivo JSON
        await this.saveToJsonFile(data);
        return true;
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return false;
    }
  }

  async load(): Promise<AppData | null> {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Em produção, buscar da API
        return await this.loadFromApi();
      } else {
        // Em desenvolvimento, ler do arquivo JSON
        return await this.loadFromJsonFile();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return null;
    }
  }

  private async saveToJsonFile(data: AppData): Promise<void> {
    // Em desenvolvimento, estamos limitados a ler arquivos estáticos
    // Para escrever, precisaríamos de um servidor Node.js ou API
    console.warn('Em desenvolvimento, salvar no JSON requer uma API backend');
    
    // Alternativa: usar localStorage como fallback
    localStorage.setItem('pixelar_json_backup', JSON.stringify({
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      data
    }));
  }

  private async loadFromJsonFile(): Promise<AppData> {
    try {
      // Tentar buscar do arquivo JSON estático
      const response = await fetch(this.apiUrl);
      
      if (response.ok) {
        const jsonData: JsonDatabase = await response.json();
        return jsonData.data;
      }
    } catch (error) {
      console.log('Falha ao carregar JSON, usando localStorage...');
    }
    
    // Fallback para localStorage
    const backup = localStorage.getItem('pixelar_json_backup');
    if (backup) {
      const jsonData: JsonDatabase = JSON.parse(backup);
      return jsonData.data;
    }
    
    // Se não houver nada, retornar dados iniciais
    return { tasks: [] };
  }

  private async saveToApi(data: AppData): Promise<boolean> {
    // Implementação para produção
    try {
      const response = await fetch('/api/save-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          data
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Erro na API:', error);
      return false;
    }
  }

  private async loadFromApi(): Promise<AppData> {
    try {
      const response = await fetch('/api/load-db');
      if (response.ok) {
        const jsonData: JsonDatabase = await response.json();
        return jsonData.data;
      }
    } catch (error) {
      console.error('Erro na API:', error);
    }
    return { tasks: [] };
  }
}

export const jsonDb = JsonDbService.getInstance();
