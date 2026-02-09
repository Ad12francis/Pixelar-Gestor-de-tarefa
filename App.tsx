
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
  Menu
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('pixelar_v3_data');
    if (saved) return JSON.parse(saved);
    return { tasks: [] };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskStatus>('TODO');

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

  const columnStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  return (
    <div className="flex h-screen overflow-hidden bg-[#03000a] text-zinc-300">
      {/* Overlay para Sidebar Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 lg:relative lg:translate-x-0 z-50 transition-transform duration-300 glass
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 lg:p-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-14">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl pixel-gradient flex items-center justify-center font-black text-xl lg:text-2xl text-white shadow-lg pixel-shadow">P</div>
              <div>
                <span className="text-xl lg:text-2xl font-black text-white tracking-tighter block leading-none">Pixelar<span className="text-purple-500">.</span></span>
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">Operações</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem icon={<LayoutDashboard size={20} />} label="Board Principal" active />
            <NavItem icon={<Briefcase size={20} />} label="Projetos" />
            <NavItem icon={<Calendar size={20} />} label="Cronograma" />
            <NavItem icon={<Layers size={20} />} label="Recursos" />
            <NavItem icon={<Settings size={20} />} label="Definições" />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-zinc-400 font-bold">Operacional</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        {/* Header Superior */}
        <header className="h-20 lg:h-24 border-b border-white/5 flex items-center justify-between px-4 lg:px-12 glass z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex-1 max-w-xl relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/40 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 lg:px-8 lg:py-4 rounded-xl lg:rounded-2xl pixel-gradient text-white font-black text-xs lg:text-sm pixel-shadow hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nova Operação</span>
            <span className="sm:hidden">Nova</span>
          </button>
        </header>

        {/* Mobile Tab Selector - Apenas em ecrãs pequenos */}
        <div className="lg:hidden px-4 pt-6 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {columnStatuses.map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                  ${activeTab === status 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-white/5 text-zinc-500 border border-white/5'}
                `}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 overflow-x-auto p-4 lg:p-12 scroll-smooth">
          <div className={`flex gap-6 lg:gap-10 h-full ${
            // No mobile mostramos apenas uma coluna, no desktop as 4
            'flex-nowrap'
          }`}>
            {columnStatuses.map(status => (
              <div 
                key={status} 
                className={`
                  w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 lg:gap-8
                  ${activeTab === status ? 'flex' : 'hidden lg:flex'}
                `}
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
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

                {/* Lista de Tarefas */}
                <div className="flex flex-col gap-4 lg:gap-6 h-full overflow-y-auto pr-1 pb-12 custom-scrollbar">
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
                    <div className="border-2 border-dashed border-white/[0.03] rounded-[32px] py-16 lg:py-24 flex flex-col items-center justify-center text-zinc-800 gap-4">
                      <CheckCircle2 size={32} className="opacity-10" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center px-4">Sem Atividade</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Nova Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass w-full max-w-2xl rounded-[32px] lg:rounded-[48px] p-6 lg:p-12 border border-white/10 relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 lg:top-12 lg:right-12 text-zinc-600 hover:text-white transition-all duration-300"
            >
              {/* Fixed: Removed non-existent lg:size prop which caused a TypeScript error */}
              <X size={24} />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl lg:text-4xl font-black text-white mb-2 tracking-tighter">Lançar Tarefa</h2>
              <p className="text-zinc-500 font-medium text-sm lg:text-lg">Prazos e executores da operação.</p>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Autor / Criador</label>
                  <select 
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl lg:rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold appearance-none cursor-pointer text-sm"
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
                  <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Data Limite</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl lg:rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold text-sm"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Equipa Responsável</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl lg:rounded-2xl bg-white/[0.02] border border-white/5">
                  {TEAM_MEMBERS.map(member => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleExecutor(member)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        newTask.selectedExecutors.includes(member)
                          ? 'bg-purple-500 text-white pixel-shadow'
                          : 'bg-white/5 text-zinc-600'
                      }`}
                    >
                      {member}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Título</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl lg:rounded-2xl px-5 py-3.5 text-white placeholder:text-zinc-800 focus:outline-none focus:border-purple-500/50 transition-all font-bold text-sm"
                  placeholder="Nome da operação..."
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Briefing</label>
                  <button 
                    type="button"
                    onClick={handlePolish}
                    disabled={isPolishing || !newTask.title || !newTask.description}
                    className="flex items-center gap-2 text-[8px] font-black text-purple-400 hover:text-purple-300 disabled:opacity-20 transition-all uppercase bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20"
                  >
                    {isPolishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    IA Polish
                  </button>
                </div>
                <textarea 
                  required
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl lg:rounded-3xl px-5 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-medium leading-relaxed text-sm"
                  placeholder="Detalhes..."
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Prioridade</label>
                <select 
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl lg:rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer font-bold text-sm"
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                >
                  <option value="BAIXA" className="bg-zinc-950">Baixa</option>
                  <option value="MÉDIA" className="bg-zinc-950">Média</option>
                  <option value="ALTA" className="bg-zinc-950">Alta / Urgente</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-4 lg:py-6 rounded-2xl lg:rounded-3xl pixel-gradient text-white font-black text-sm lg:text-lg pixel-shadow hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl mt-4 uppercase tracking-widest"
              >
                <CheckCircle2 size={24} />
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
  <button className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${
    active 
      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg' 
      : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03]'
  }`}>
    <span className={active ? 'text-purple-400' : 'text-zinc-700'}>{icon}</span>
    {label}
  </button>
);

export default App;