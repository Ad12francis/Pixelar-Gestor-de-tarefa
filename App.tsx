
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, AppData } from './types';
import { STATUS_LABELS, TEAM_MEMBERS } from './constants';
import { polishTaskDescription } from './services/geminiService';
import { syncToCloud, fetchFromCloud, generateTeamCode } from './services/syncService';
import TaskCard from './components/TaskCard';
import { 
  Plus, 
  Search, 
  LayoutDashboard, 
  CheckCircle2, 
  Sparkles,
  X,
  Loader2,
  Menu,
  Database,
  Share2,
  RefreshCw,
  Save,
  Users,
  Wifi,
  WifiOff,
  Settings,
  Copy
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ tasks: [] });
  const [teamCode, setTeamCode] = useState<string>(() => localStorage.getItem('pixelar_team_code') || 'local');
  const [isSyncing, setIsSyncing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    creator: TEAM_MEMBERS[0],
    selectedExecutors: [] as string[],
    priority: 'MÉDIA' as const,
    dueDate: ''
  });

  // 1. Carregamento Inicial
  useEffect(() => {
    const init = async () => {
      const localData = localStorage.getItem('pixelar_v3_database');
      if (localData) setData(JSON.parse(localData));

      if (teamCode !== 'local') {
        const cloudData = await fetchFromCloud(teamCode);
        if (cloudData) setData(cloudData);
      }
      setIsLoading(false);
    };
    init();
  }, [teamCode]);

  // 2. Sincronização Automática (Debounce para não sobrecarregar a API)
  useEffect(() => {
    if (isLoading || teamCode === 'local') return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      const success = await syncToCloud(teamCode, data);
      setOnlineStatus(!!success);
      setIsSyncing(false);
      localStorage.setItem('pixelar_v3_database', JSON.stringify(data));
    }, 1500);

    return () => clearTimeout(timer);
  }, [data, teamCode, isLoading]);

  // Função para mudar/entrar numa equipa
  const handleJoinTeam = (code: string) => {
    const cleanCode = code.trim();
    if (cleanCode) {
      setTeamCode(cleanCode);
      localStorage.setItem('pixelar_team_code', cleanCode);
      setIsSettingsOpen(false);
    }
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

  const updateTaskStatus = (id: string, newStatus: TaskStatus) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
    }));
  };

  const deleteTask = (id: string) => {
    if(confirm('Eliminar esta tarefa da base de dados da equipa?')) {
      setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    }
  };

  const filteredTasks = data.tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#03000a] gap-4">
      <Loader2 className="animate-spin text-purple-500" size={40} />
      <span className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Acedendo à Nuvem Pixelar...</span>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#03000a] text-zinc-300">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 lg:relative lg:translate-x-0 z-50 transition-transform duration-300 glass border-r border-white/5
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl pixel-gradient flex items-center justify-center font-black text-2xl text-white pixel-shadow">P</div>
            <div>
              <span className="text-xl font-black text-white tracking-tighter block leading-none">Pixelar<span className="text-purple-500">.</span></span>
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">Cloud Database</span>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1">
            <button className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-sm">
              <LayoutDashboard size={18} /> Board de Operações
            </button>
            
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
            >
              <Users size={18} /> Equipa & Sincronização
            </button>
            
            <button 
              onClick={async () => {
                setIsSyncing(true);
                const cloudData = await fetchFromCloud(teamCode);
                if (cloudData) setData(cloudData);
                setIsSyncing(false);
              }}
              className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
            >
              <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18} /> Atualizar Nuvem
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {onlineStatus ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-rose-500" />}
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{onlineStatus ? 'Ligado' : 'Offline'}</p>
                </div>
                {isSyncing && <Loader2 size={10} className="animate-spin text-purple-500" />}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-bold">ID Equipa</span>
                <span className="text-[10px] text-white font-black truncate max-w-[100px]">{teamCode}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 lg:h-24 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 glass z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-zinc-400">
              <Menu size={24} />
            </button>
            <div className="flex-1 max-w-xl relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar na base de dados global..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/40 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 rounded-2xl pixel-gradient text-white font-black text-xs lg:text-sm pixel-shadow hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
          >
            <Plus size={20} /> Nova Tarefa
          </button>
        </header>

        <div className="flex-1 overflow-x-auto p-6 lg:p-12">
          <div className="flex gap-8 h-full">
            {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map(status => (
              <div key={status} className="w-80 flex-shrink-0 flex flex-col gap-6">
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                      status === 'TODO' ? 'bg-zinc-600' : 
                      status === 'IN_PROGRESS' ? 'bg-blue-500 shadow-blue-500/50' : 
                      status === 'REVIEW' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
                    }`}></div>
                    <h3 className="font-black text-zinc-500 uppercase tracking-[0.25em] text-[10px]">{STATUS_LABELS[status]}</h3>
                  </div>
                </div>
                <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar pb-10">
                  {filteredTasks.filter(t => t.status === status).map(task => (
                    <TaskCard key={task.id} task={task} onDelete={deleteTask} onStatusChange={updateTaskStatus} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal de Configurações de Equipa (Onde o Aires e o Adão se ligam) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="glass w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Ligação de Equipa</h2>
              <button onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
            </div>
            
            <p className="text-zinc-500 text-sm mb-6 font-medium">
              Insira o código da equipa para sincronizar todas as tarefas entre dispositivos. Partilhe este código com o Adão ou o Aires.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Código Atual</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="team-code-input"
                    className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-xs"
                    defaultValue={teamCode}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('team-code-input') as HTMLInputElement;
                      handleJoinTeam(input.value);
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl font-black text-xs"
                  >
                    Ligar
                  </button>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <button 
                  onClick={() => {
                    const newCode = generateTeamCode();
                    handleJoinTeam(newCode);
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 font-bold text-xs hover:text-white transition-all"
                >
                  Criar Novo Código de Equipa
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(teamCode);
                    alert('Código copiado! Envie para a equipa.');
                  }}
                  className="w-full py-3 flex items-center justify-center gap-2 text-purple-400 font-bold text-xs"
                >
                  <Copy size={14} /> Copiar Código Atual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Tarefa - Mantido conforme anterior */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="glass w-full max-w-2xl rounded-[40px] p-8 lg:p-12 border border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X size={24} /></button>
            
            <div className="mb-10">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Nova Operação Pixelar</h2>
              <p className="text-zinc-500 text-sm">Esta tarefa será enviada imediatamente para a base de dados da equipa.</p>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Criador</label>
                  <select 
                    required 
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-sm appearance-none"
                    value={newTask.creator}
                    onChange={e => setNewTask({...newTask, creator: e.target.value})}
                  >
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Deadline</label>
                  <input 
                    required type="date" className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                    value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Equipa Assignada</label>
                <div className="flex flex-wrap gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  {TEAM_MEMBERS.map(m => (
                    <button 
                      key={m} type="button" 
                      onClick={() => setNewTask(prev => ({
                        ...prev,
                        selectedExecutors: prev.selectedExecutors.includes(m) ? prev.selectedExecutors.filter(x => x !== m) : [...prev.selectedExecutors, m]
                      }))}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                        newTask.selectedExecutors.includes(m) ? 'bg-purple-500 text-white' : 'bg-white/5 text-zinc-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Título</label>
                <input required type="text" className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-sm"
                  placeholder="Nome do projeto/tarefa..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">Briefing</label>
                  <button type="button" onClick={async () => {
                      setIsPolishing(true);
                      const res = await polishTaskDescription(newTask.title, newTask.description);
                      setNewTask(p => ({...p, description: res}));
                      setIsPolishing(false);
                    }} 
                    disabled={isPolishing || !newTask.description}
                    className="flex items-center gap-2 text-[8px] font-black text-purple-400 bg-purple-500/10 px-3 py-2 rounded-full border border-purple-500/20"
                  >
                    {isPolishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} IA POLISH
                  </button>
                </div>
                <textarea required rows={4} className="w-full bg-zinc-950 border border-white/10 rounded-[24px] px-6 py-5 text-white text-sm resize-none"
                  placeholder="Detalhes..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
              </div>

              <button type="submit" className="w-full py-5 rounded-3xl pixel-gradient text-white font-black text-sm lg:text-base pixel-shadow hover:scale-[1.01] transition-all flex items-center justify-center gap-4 uppercase tracking-widest mt-4">
                <Save size={20} /> Registar na Nuvem
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
