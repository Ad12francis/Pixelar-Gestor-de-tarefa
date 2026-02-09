
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  creator: string;        // Nome de quem criou
  executors: string[];    // Lista de nomes de quem vai executar
  priority: 'BAIXA' | 'MÉDIA' | 'ALTA';
  dueDate: string;        // Data limite formatada
  createdAt: number;
}

export interface AppData {
  tasks: Task[];
}
