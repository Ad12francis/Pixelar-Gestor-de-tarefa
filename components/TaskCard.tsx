
import React from 'react';
import { Task, TaskStatus } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { Trash2, ChevronRight, ChevronLeft, User as UserIcon, Users, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onStatusChange }) => {
  const statusFlow: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const currentIndex = statusFlow.indexOf(task.status);

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sem prazo';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="glass group p-4 lg:p-5 rounded-[20px] lg:rounded-[24px] border border-white/5 hover:border-purple-500/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 shadow-xl hover:shadow-purple-500/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className={`text-[8px] lg:text-[9px] font-black px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-full uppercase tracking-[0.1em] w-fit ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority}
          </span>
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-[8px] lg:text-[9px] font-bold text-zinc-500 mt-1">
              <Calendar size={10} />
              <span>Limite: {formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => onDelete(task.id)}
          className="opacity-40 lg:opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-500 transition-all duration-300 p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h4 className="text-white font-bold text-base lg:text-lg mb-2 group-hover:text-purple-400 transition-colors leading-tight">
        {task.title}
      </h4>
      
      <p className="text-zinc-500 text-[11px] lg:text-xs mb-5 line-clamp-2 leading-relaxed font-medium">
        {task.description}
      </p>

      <div className="space-y-4 pt-4 border-t border-white/5">
        {/* Autor */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
            <UserIcon size={10} className="text-zinc-500" />
          </div>
          <p className="text-[9px] lg:text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            Por: <span className="text-zinc-200">{task.creator}</span>
          </p>
        </div>

        {/* Executores */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <Users size={12} className="text-purple-500/60" />
          {task.executors.length > 0 ? (
            task.executors.map((exe, i) => (
              <span key={i} className="text-[8px] lg:text-[9px] bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md text-purple-300 font-bold">
                {exe}
              </span>
            ))
          ) : (
            <span className="text-[8px] text-zinc-600 font-bold italic">Sem executores</span>
          )}
        </div>

        {/* Botões de Ação para Status */}
        <div className="flex items-center justify-end gap-2 mt-2">
          {currentIndex > 0 && (
            <button 
              onClick={() => onStatusChange(task.id, statusFlow[currentIndex - 1])}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white"
              title="Mover para anterior"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {currentIndex < statusFlow.length - 1 && (
            <button 
              onClick={() => onStatusChange(task.id, statusFlow[currentIndex + 1])}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-500 hover:text-white"
              title="Mover para próximo"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
