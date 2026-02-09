
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, AppData } from './types';
import { STATUS_LABELS, TEAM_MEMBERS } from './constants';
import { polishTaskDescription } from './services/geminiService';
import TaskCard from './components/TaskCard';
import { 
  Plus, 
  Search, 
  LayoutDashboard, 
  CheckCircle2, 
  Users, 
  Sparkles,
  Settings,
  X,
  Loader2,
  Calendar,
  Briefcase,
  Layers,
  Clock
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('pixelar_v3_data');
    if (saved) return JSON.parse(saved);
    return { tasks: [] };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    creator: TEAM_MEMBERS[0],
    selectedExecutors: [] as string[],
    priority: 'MÉDIA' as const,
    dueDate: ''
  });

  useEffect(() => {
    localStorage.setItem('pixelar_v3_data', JSON.stringify(data));
  }, [data]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description,
      status: 'TODO',
      creator: newTask.creator,
      executors: newTask.selectedExecutors,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      createdAt: Date.now()
    };

    setData(prev => ({ ...prev, tasks: [task, ...prev.tasks] }));
    setIsModalOpen(false);
    setNewTask({ title: '', description: '', creator: TEAM_MEMBERS[0], selectedExecutors: [], priority: 'MÉDIA', dueDate: '' });
  };

  const toggleExecutor = (name: string) => {
    setNewTask(prev => {
      const isSelected = prev.selectedExecutors.includes(name);
      return {
        ...prev,
        selectedExecutors: isSelected 
          ? prev.selectedExecutors.filter(n => n !== name)
          : [...prev.selectedExecutors, name]
      };
    });
  };

  const handlePolish = async () => {
    if (!newTask.title || !newTask.description) return;
    setIsPolishing(true);
    const polished = await polishTaskDescription(newTask.title, newTask.description);
    setNewTask(prev => ({ ...prev, description: polished }));
    setIsPolishing(false);
  };

  const deleteTask = (id: string) => {
    if(confirm('Eliminar esta tarefa permanentemente?')) {
      setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    }
  };

  const updateTaskStatus = (id: string, newStatus: TaskStatus) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
    }));
  };

  const filteredTasks = data.tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#03000a] text-zinc-300">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col glass z-20">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14">
            <div className="w-12 h-12 rounded-2xl pixel-gradient flex items-center justify-center font-black text-2xl text-white shadow-lg pixel-shadow">P</div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter block leading-none">Pixelar<span className="text-purple-500">.</span></span>
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">Operações</span>
            </div>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<LayoutDashboard size={22} />} label="Board Principal" active />
            <NavItem icon={<Briefcase size={22} />} label="Projetos Ativos" />
            <NavItem icon={<Calendar size={22} />} label="Cronograma" />
            <NavItem icon={<Layers size={22} />} label="Recursos" />
            <NavItem icon={<Settings size={22} />} label="Definições" />
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-white/5">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Status do Sistema</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-zinc-400 font-bold">Operacional</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 glass z-10 sticky top-0">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar por tarefa, criador ou descrição..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm focus:outline-none focus:border-purple-500/40 transition-all placeholder:text-zinc-700 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl pixel-gradient text-white font-black text-sm pixel-shadow hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
          >
            <Plus size={22} />
            Nova Operação
          </button>
        </header>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-12 flex gap-10">
          {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map(status => (
            <div key={status} className="w-80 flex-shrink-0 flex flex-col gap-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_12px] ${
                    status === 'TODO' ? 'bg-zinc-600 shadow-zinc-600/50' :
                    status === 'IN_PROGRESS' ? 'bg-blue-500 shadow-blue-500/50' :
                    status === 'REVIEW' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
                  }`}></div>
                  <h3 className="font-black text-zinc-500 uppercase tracking-[0.25em] text-[10px]">
                    {STATUS_LABELS[status]}
                  </h3>
                </div>
                <div className="text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-400 font-black">
                  {filteredTasks.filter(t => t.status === status).length}
                </div>
              </div>

              <div className="flex flex-col gap-6 h-full overflow-y-auto pr-3 pb-12 custom-scrollbar">
                {filteredTasks
                  .filter(t => t.status === status)
                  .map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onDelete={deleteTask}
                      onStatusChange={updateTaskStatus}
                    />
                  ))
                }
                {filteredTasks.filter(t => t.status === status).length === 0 && (
                  <div className="border-2 border-dashed border-white/[0.03] rounded-[40px] py-24 flex flex-col items-center justify-center text-zinc-800 gap-4">
                    <CheckCircle2 size={32} className="opacity-10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Coluna Limpa</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal - Criação de Tarefa Dinâmica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="glass w-full max-w-2xl rounded-[48px] p-12 border border-white/10 relative shadow-2xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-12 right-12 text-zinc-600 hover:text-white transition-all duration-300"
            >
              <X size={32} />
            </button>

            <div className="mb-10">
              <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">Lançar Tarefa</h2>
              <p className="text-zinc-500 font-medium text-lg">Defina os prazos e executores da operação.</p>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-6 pb-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Autor / Criador</label>
                  <select 
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold appearance-none cursor-pointer"
                    value={newTask.creator}
                    onChange={e => setNewTask({...newTask, creator: e.target.value})}
                  >
                    {TEAM_MEMBERS.map(member => (
                      <option key={member} value={member} className="bg-zinc-950">{member}</option>
                    ))}
                    <option value="Equipa Pixelar" className="bg-zinc-950">Equipa Pixelar</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Data Limite</label>
                  <div className="relative">
                    <input 
                      required
                      type="date" 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold"
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Executores (Pessoas na Tarefa)</label>
                <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                  {TEAM_MEMBERS.map(member => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleExecutor(member)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                        newTask.selectedExecutors.includes(member)
                          ? 'bg-purple-500 text-white pixel-shadow shadow-purple-500/20'
                          : 'bg-white/5 text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {member}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Título da Operação</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-purple-500/50 transition-all font-bold"
                  placeholder="Ex: Landing Page para Cliente X"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Briefing</label>
                  <button 
                    type="button"
                    onClick={handlePolish}
                    disabled={isPolishing || !newTask.title || !newTask.description}
                    className="flex items-center gap-2 text-[10px] font-black text-purple-400 hover:text-purple-300 disabled:opacity-20 transition-all uppercase tracking-[0.15em] bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20"
                  >
                    {isPolishing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Refinar com IA
                  </button>
                </div>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-medium leading-relaxed"
                  placeholder="O que precisa ser feito..."
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Urgência</label>
                <select 
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer font-bold"
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                >
                  <option value="BAIXA" className="bg-zinc-950">Prioridade Baixa</option>
                  <option value="MÉDIA" className="bg-zinc-950">Prioridade Média</option>
                  <option value="ALTA" className="bg-zinc-950">Prioridade Alta</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-6 rounded-3xl pixel-gradient text-white font-black text-xl pixel-shadow hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl mt-6 uppercase tracking-widest"
              >
                <CheckCircle2 size={28} />
                Lançar na Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean }> = ({ icon, label, active }) => (
  <button className={`w-full flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all duration-300 font-bold text-sm ${
    active 
      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
      : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03]'
  }`}>
    <span className={active ? 'text-purple-400' : 'text-zinc-700'}>{icon}</span>
    {label}
  </button>
);

export default App;
