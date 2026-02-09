
import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  Download,
  Upload,
  Database,
  Share2,
  Link as LinkIcon,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    // 1. Tentar carregar do URL se houver um hash de partilha
    const hash = window.location.hash;
    if (hash && hash.startsWith('#data:')) {
      try {
        const base64 = hash.split('data:')[1];
        const json = JSON.parse(atob(base64));
        if (json && Array.isArray(json.tasks)) {
          // Limpar hash após carregar para não sobrescrever no reload
          window.location.hash = '';
          return json;
        }
      } catch (e) {
        console.error("Erro ao carregar dados do link de partilha", e);
      }
    }

    // 2. Se não houver link, carregar do LocalStorage
    const saved = localStorage.getItem('pixelar_v3_data');
    if (saved) return JSON.parse(saved);
    return { tasks: [] };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskStatus>('TODO');
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Função para Gerar Link de Partilha (Permite que outros vejam em seus dispositivos)
  const shareBoardLink = () => {
    try {
      const base64Data = btoa(JSON.stringify(data));
      const shareUrl = `${window.location.origin}${window.location.pathname}#data:${base64Data}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      });
    } catch (e) {
      alert("Erro ao gerar link de partilha. Tente reduzir o número de tarefas.");
    }
  };

  const exportDatabase = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixelar_database_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (json && Array.isArray(json.tasks)) {
            if (confirm('Deseja substituir a sua board atual pela board deste arquivo JSON?')) {
              setData(json);
              alert('Base de dados sincronizada com sucesso!');
            }
          }
        } catch (err) {
          alert('Erro ao processar o arquivo JSON.');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Otimizada */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 lg:relative lg:translate-x-0 z-50 transition-transform duration-300 glass
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl pixel-gradient flex items-center justify-center font-black text-xl text-white shadow-lg pixel-shadow">P</div>
              <div>
                <span className="text-xl font-black text-white tracking-tighter block leading-none">Pixelar<span className="text-purple-500">.</span></span>
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">Gestão de Equipa</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-500">
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Board Principal" active />
            <NavItem icon={<Briefcase size={18} />} label="Ficheiros Partilhados" />
            
            <div className="pt-6 pb-2">
              <span className="px-5 text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Sincronização</span>
            </div>
            
            <button 
              onClick={shareBoardLink}
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all font-bold text-sm border ${
                copySuccess 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                  : 'text-purple-400 hover:bg-purple-500/5 border-transparent hover:border-purple-500/10'
              }`}
            >
              {copySuccess ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
              {copySuccess ? 'Link Copiado!' : 'Gerar Link de Equipa'}
            </button>
            
            <button 
              onClick={exportDatabase}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm border border-transparent"
            >
              <Download size={18} />
              Guardar JSON
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm border border-transparent"
            >
              <Upload size={18} />
              Abrir Ficheiro Equipa
            </button>
            <input type="file" ref={fileInputRef} onChange={importDatabase} accept=".json" className="hidden" />

            <NavItem icon={<Settings size={18} />} label="Configurações" />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-start gap-3 mb-2">
                <Info size={14} className="text-purple-500 mt-0.5" />
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Para o Adão e o Aires verem as mesmas tarefas, partilhe o <strong>Link de Equipa</strong> ou o ficheiro <strong>JSON</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 glass z-10">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-zinc-400">
              <Menu size={24} />
            </button>
            <div className="flex-1 max-w-xl relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar tarefas..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/40 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl pixel-gradient text-white font-black text-xs lg:text-sm pixel-shadow hover:scale-[1.03] transition-all shadow-xl"
          >
            <Plus size={18} />
            Nova Operação
          </button>
        </header>

        {/* Mobile Col Seletor */}
        <div className="lg:hidden px-4 pt-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {columnStatuses.map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === status ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/5 text-zinc-500'
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-4 lg:p-12 scroll-smooth">
          <div className="flex gap-6 lg:gap-10 h-full flex-nowrap">
            {columnStatuses.map(status => (
              <div key={status} className={`w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 ${activeTab === status ? 'flex' : 'hidden lg:flex'}`}>
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      status === 'TODO' ? 'bg-zinc-600' : status === 'IN_PROGRESS' ? 'bg-blue-500' : status === 'REVIEW' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></div>
                    <h3 className="font-black text-zinc-500 uppercase tracking-[0.25em] text-[10px]">{STATUS_LABELS[status]}</h3>
                  </div>
                  <div className="text-[10px] bg-white/5 px-2.5 py-1 rounded-lg text-zinc-400 font-black">
                    {filteredTasks.filter(t => t.status === status).length}
                  </div>
                </div>

                <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-12 custom-scrollbar">
                  {filteredTasks.filter(t => t.status === status).map(task => (
                    <TaskCard key={task.id} task={task} onDelete={deleteTask} onStatusChange={updateTaskStatus} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Nova Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass w-full max-w-2xl rounded-[32px] p-8 lg:p-12 relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={24} /></button>
            <div className="mb-8">
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2 tracking-tighter uppercase">Lançar Operação</h2>
              <p className="text-zinc-500 font-medium text-sm lg:text-base">Esta tarefa ficará disponível para todos no ficheiro JSON.</p>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Criador</label>
                  <select 
                    required 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white font-bold text-sm"
                    value={newTask.creator}
                    onChange={e => setNewTask({...newTask, creator: e.target.value})}
                  >
                    {TEAM_MEMBERS.map(member => <option key={member} value={member} className="bg-zinc-950">{member}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Data Limite</label>
                  <input required type="date" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white font-bold text-sm"
                    value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Executores (Pessoas na Tarefa)</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  {TEAM_MEMBERS.map(member => (
                    <button key={member} type="button" onClick={() => toggleExecutor(member)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                        newTask.selectedExecutors.includes(member) ? 'bg-purple-500 text-white' : 'bg-white/5 text-zinc-600'
                      }`}>{member}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Título</label>
                <input required type="text" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white font-bold text-sm"
                  placeholder="Nome da tarefa..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Briefing</label>
                  <button type="button" onClick={handlePolish} disabled={isPolishing || !newTask.title || !newTask.description}
                    className="flex items-center gap-2 text-[8px] font-black text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">
                    {isPolishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} IA Refinar
                  </button>
                </div>
                <textarea required rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm"
                  placeholder="Detalhes..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Urgência</label>
                <select className="w-full bg-zinc-950 border border-white/10 rounded-xl px-5 py-3.5 text-white font-bold text-sm"
                  value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})}>
                  <option value="BAIXA">Baixa</option>
                  <option value="MÉDIA">Média</option>
                  <option value="ALTA">Alta / Urgente</option>
                </select>
              </div>

              <button type="submit" className="w-full py-5 rounded-2xl pixel-gradient text-white font-black text-sm lg:text-base pixel-shadow hover:scale-[1.01] transition-all flex items-center justify-center gap-4 uppercase tracking-widest">
                <CheckCircle2 size={24} /> Criar Operação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean }> = ({ icon, label, active }) => (
  <button className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all font-bold text-sm ${
    active ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-zinc-600 hover:text-white'
  }`}>
    {icon} {label}
  </button>
);

export default App;
