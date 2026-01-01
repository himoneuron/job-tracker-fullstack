import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Trash2, ExternalLink, Download, Search, LayoutGrid, 
  Table as TableIcon, ChevronDown, Sparkles, MapPin, 
  Clock, ArrowRight, Save, Building2, Briefcase, 
  CheckCircle2, AlertCircle, XCircle, Info, RefreshCcw, DollarSign, Calendar,
  Link, FileText, Zap, MoreHorizontal, Layers
} from 'lucide-react';

// Connects to your Spring Boot Backend
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://job-tracker-fullstack-3m2s.onrender.com/api/applications";

const GEMINI_API_KEY = ""; 

// --- BOLD & VIBRANT COLOR SCHEMAS ---
const STATUS_CONFIG = {
  'Applied': { 
    gradient: 'from-blue-600 to-cyan-400', 
    bg: 'bg-blue-600', 
    lightBg: 'bg-blue-50',
    border: 'border-blue-500', 
    text: 'text-blue-700', 
    contrastText: 'text-white',
    iconColor: 'text-blue-500',
    shadow: 'shadow-blue-500/40',
    icon: CheckCircle2 
  },
  'Not Applied': { 
    gradient: 'from-rose-500 to-pink-500', 
    bg: 'bg-rose-600', 
    lightBg: 'bg-rose-50',
    border: 'border-rose-500', 
    text: 'text-rose-700', 
    contrastText: 'text-white',
    iconColor: 'text-rose-500',
    shadow: 'shadow-rose-500/40',
    icon: AlertCircle 
  },
  'Vacancy Not Available': { 
    gradient: 'from-amber-500 to-orange-500', 
    bg: 'bg-amber-600', 
    lightBg: 'bg-amber-50',
    border: 'border-amber-500', 
    text: 'text-amber-800', 
    contrastText: 'text-white',
    iconColor: 'text-amber-600',
    shadow: 'shadow-amber-500/40',
    icon: XCircle 
  },
  'Awaiting Results': { 
    gradient: 'from-violet-600 to-purple-600', 
    bg: 'bg-violet-600', 
    lightBg: 'bg-violet-50',
    border: 'border-violet-500', 
    text: 'text-violet-700', 
    contrastText: 'text-white',
    iconColor: 'text-violet-500',
    shadow: 'shadow-violet-500/40',
    icon: Clock 
  }
};

const STAGES = ['Not Started', 'Screening', 'Technical Interview', 'Behavioral Interview', 'Final Round', 'Offer', 'Rejected'];

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- AUTOMATIC STYLE INJECTION (Fixes Missing Tailwind) ---
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  // --- API OPERATIONS ---
  const fetchApps = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Backend not reachable");
      const data = await response.json();
      setApplications(data);
      if (data.length > 0 && !selectedAppId) setSelectedAppId(data[0].id);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("using the backedn data to load from render");
      setLoading(false);
    }
  }, [selectedAppId]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const addApplication = async () => {
    const newApp = {
      role: 'New Opportunity',
      company: 'Target Company',
      location: 'Remote',
      status: 'Not Applied',
      stage: 'Not Started',
      dateApplied: new Date().toISOString().split('T')[0],
      salary: '', link: '', description: '', notes: '', aiInsights: ''
    };
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      });
      const saved = await res.json();
      setApplications([saved, ...applications]);
      setSelectedAppId(saved.id);
    } catch (err) { console.error("Add failed", err); }
  };

  const updateApplication = async (id, field, value) => {
    setIsSaving(true);
    const target = applications.find(a => a.id === id);
    const updated = { ...target, [field]: value };
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) setApplications(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) { console.error("Update failed", err); } 
    finally { setTimeout(() => setIsSaving(false), 600); }
  };

  const deleteApplication = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      const filtered = applications.filter(a => a.id !== id);
      setApplications(filtered);
      if (selectedAppId === id) setSelectedAppId(filtered[0]?.id || null);
    } catch (err) { console.error("Delete failed", err); }
  };

  const analyzeJD = async (id, jd) => {
    if (!jd || jd.length < 20 || !GEMINI_API_KEY) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this Job Description. Extract: 1. Top 3 required skills. 2. Interview strategy. 3. Two potential questions.\n\nJD: ${jd}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "You are a hiring expert. Be concise and use bullet points." }] }
        })
      });
      const result = await res.json();
      const insights = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (insights) updateApplication(id, 'aiInsights', insights);
    } catch (err) { console.error("AI Analysis failed", err); } 
    finally { setIsAnalyzing(false); }
  };

  const filteredApps = useMemo(() => {
    return applications.filter(a => 
      a.role?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.company?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
  }, [applications, searchTerm]);

  const currentApp = applications.find(a => a.id === selectedAppId);
  // Dynamic color theme based on selected app
  const activeTheme = currentApp ? STATUS_CONFIG[currentApp.status] : STATUS_CONFIG['Applied'];

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 gap-8">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
        <RefreshCcw className="w-16 h-16 text-blue-400 animate-spin relative z-10" />
      </div>
      <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Loading Workspace...</p>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-800 font-sans flex overflow-hidden">
      
      {/* SIDEBAR: Dynamic Multi-Color Theme */}
      <aside className={`hidden lg:flex flex-col w-80 bg-gradient-to-b from-slate-900 to-black border-r border-slate-800 shadow-2xl z-30 transition-colors duration-500`}>
        <div className="p-8 flex items-center justify-between relative overflow-hidden">
          {/* Subtle colored glow based on active selection */}
          <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r ${activeTheme.gradient} opacity-10`}></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeTheme.gradient} flex items-center justify-center shadow-lg border border-white/10`}>
              <Zap className="text-white" size={24} fill="currentColor" />
            </div>
            <h2 className="font-black text-white tracking-wider text-2xl">HUNT<span className={`bg-clip-text text-transparent bg-gradient-to-r ${activeTheme.gradient}`}>.IO</span></h2>
          </div>
          <button onClick={addApplication} className={`p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all shadow-lg backdrop-blur-md relative z-10`}>
            <Plus size={20} />
          </button>
        </div>
        
        <div className="px-8 pb-6">
          <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Search..." 
               className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all text-slate-200 placeholder:text-slate-600 font-medium"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 custom-scrollbar">
          {filteredApps.map(app => {
            const config = STATUS_CONFIG[app.status];
            const isSelected = selectedAppId === app.id;
            return (
              <button
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all relative group flex flex-col gap-1 ${
                  isSelected 
                  ? `bg-slate-800/80 border-slate-600 shadow-2xl shadow-black/50 ring-1 ring-white/10` 
                  : 'bg-transparent border-transparent hover:bg-white/5'
                }`}
              >
                {/* Left Active Indicator Bar */}
                {isSelected && <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b ${config.gradient}`}></div>}
                
                <div className="flex items-center justify-between w-full pl-3">
                  <span className={`font-bold truncate text-sm ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{app.role}</span>
                  {isSelected && <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient} shadow-[0_0_15px_currentColor]`}></div>}
                </div>
                <div className="flex items-center justify-between mt-1 pl-3">
                   <span className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
                     <Building2 size={12} /> {app.company}
                   </span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
        {/* Dynamic Background Mesh - Stronger Opacity for Multi-Color Effect */}
        <div className={`absolute top-0 left-0 w-full h-[30rem] bg-gradient-to-b ${activeTheme.gradient} opacity-15 blur-[100px] pointer-events-none transition-all duration-700 ease-in-out`}></div>

        <header className="px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 z-20">
          <div className="flex bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-white/50">
            <button onClick={() => setViewMode('table')} className={`px-8 py-3 text-xs font-black rounded-xl flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-900'}`}>
              <TableIcon size={16}/> LIST
            </button>
            <button onClick={() => setViewMode('board')} className={`px-8 py-3 text-xs font-black rounded-xl flex items-center gap-2 transition-all ${viewMode === 'board' ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-900'}`}>
              <LayoutGrid size={16}/> BOARD
            </button>
          </div>
          
          {isSaving && (
             <div className="flex items-center gap-2 px-6 py-2 bg-white rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest shadow-lg border border-emerald-100 animate-in fade-in slide-in-from-top-2">
               <RefreshCcw size={14} className="animate-spin" /> SYNCING...
             </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:px-10 md:pb-10 relative z-10">
          {error && <div className="mb-8 p-6 bg-red-100 text-red-700 rounded-3xl font-bold flex items-center gap-4 border border-red-200"><AlertCircle size={24}/> {error}</div>}
          
          {viewMode === 'table' && currentApp ? (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              
              {/* PRIMARY DETAIL CARD - Massive Visual Update */}
              <div className={`bg-white/90 backdrop-blur rounded-[2.5rem] p-12 shadow-2xl shadow-slate-300/50 border-t-[12px] ${activeTheme.border} space-y-12 relative overflow-hidden transition-all duration-500`}>
                
                <div className="flex flex-col xl:flex-row gap-16 justify-between">
                  <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Role Title</label>
                      <input 
                        className="text-6xl font-black text-slate-900 w-full bg-transparent focus:outline-none placeholder:text-slate-200 tracking-tighter" 
                        value={currentApp.role} onChange={e => updateApplication(currentApp.id, 'role', e.target.value)} 
                      />
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="p-4 bg-slate-100 rounded-2xl text-slate-400"><Building2 size={28}/></div>
                      <input 
                        className="text-3xl font-bold text-slate-500 w-full bg-transparent focus:outline-none" 
                        value={currentApp.company} onChange={e => updateApplication(currentApp.id, 'company', e.target.value)} 
                        placeholder="Company Name"
                      />
                    </div>
                  </div>

                  <div className="w-full xl:w-[28rem] space-y-8">
                    <div className="relative group">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block ml-1">Current Status</label>
                       <select 
                         className={`w-full appearance-none px-8 py-6 rounded-3xl text-lg font-black cursor-pointer shadow-xl transition-all text-white bg-gradient-to-r ${activeTheme.gradient} hover:scale-[1.02] active:scale-95 border-4 border-white ring-4 ring-transparent focus:ring-slate-200`}
                         value={currentApp.status} onChange={e => updateApplication(currentApp.id, 'status', e.target.value)}
                       >
                         {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s} className="text-slate-900 bg-white">{s}</option>)}
                       </select>
                       <ChevronDown className="absolute right-8 top-[3.5rem] text-white/80 pointer-events-none" size={24} />
                    </div>
                    <div className="relative">
                       <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block ml-1">Pipeline Stage</label>
                       <select 
                         className="w-full appearance-none bg-slate-50 px-8 py-6 rounded-3xl text-sm font-bold text-slate-600 border-2 border-slate-100 focus:border-slate-300 focus:outline-none transition-all hover:bg-white"
                         value={currentApp.stage} onChange={e => updateApplication(currentApp.id, 'stage', e.target.value)}
                       >
                         {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                       <ChevronDown className="absolute right-8 top-[3.5rem] text-slate-400 pointer-events-none" size={24} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-slate-100/50">
                   {[
                     { icon: MapPin, val: currentApp.location, field: 'location', ph: 'Remote' },
                     { icon: Calendar, val: currentApp.dateApplied, field: 'dateApplied', type: 'date' },
                     { icon: DollarSign, val: currentApp.salary, field: 'salary', ph: '$0k' },
                     { icon: Link, val: currentApp.link, field: 'link', ph: 'URL...' }
                   ].map((item, i) => (
                     <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all group hover:-translate-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <item.icon size={14} className={`group-hover:${activeTheme.text} transition-colors`}/> {item.field}
                        </label>
                        <input 
                          type={item.type || 'text'}
                          className={`w-full bg-transparent font-black text-lg text-slate-700 outline-none ${item.field === 'link' ? 'text-blue-500 underline' : ''}`}
                          value={item.val} onChange={e => updateApplication(currentApp.id, item.field, e.target.value)}
                          placeholder={item.ph}
                        />
                     </div>
                   ))}
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col gap-8">
                   <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4"><FileText size={20}/> Job Requirements</h3>
                     <button 
                       onClick={() => analyzeJD(currentApp.id, currentApp.description)}
                       disabled={isAnalyzing || !GEMINI_API_KEY}
                       className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl hover:scale-105 ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-black'}`}
                     >
                       <Sparkles size={16} /> {isAnalyzing ? 'Processing...' : 'Analyze with AI'}
                     </button>
                   </div>
                   <textarea 
                     className="flex-1 w-full h-[30rem] bg-slate-50/50 rounded-3xl p-8 text-lg text-slate-600 outline-none resize-none border-2 border-transparent focus:bg-white focus:border-slate-100 transition-all leading-loose"
                     value={currentApp.description} onChange={e => updateApplication(currentApp.id, 'description', e.target.value)}
                     placeholder="Paste JD here..."
                   />
                </div>

                <div className="flex flex-col gap-8">
                  <div className={`rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden bg-gradient-to-br ${activeTheme.gradient}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12 scale-150"><Sparkles size={150} /></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-6 relative z-10 flex items-center gap-3"><Zap size={16}/> AI Strategy Coach</h3>
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-sm font-medium leading-loose border border-white/20 min-h-[250px] relative z-10 shadow-inner">
                      {currentApp.aiInsights || "Unlock interview superpowers. Paste the JD and click Analyze."}
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-lg flex-1 flex flex-col gap-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Quick Notes</h3>
                    <textarea 
                      className="flex-1 w-full bg-slate-50 rounded-3xl p-6 text-sm font-medium text-slate-600 outline-none resize-none"
                      value={currentApp.notes} onChange={e => updateApplication(currentApp.id, 'notes', e.target.value)}
                      placeholder="Thoughts..."
                    />
                  </div>
                  
                  <button onClick={() => deleteApplication(currentApp.id)} className="w-full py-8 bg-red-50 text-red-500 rounded-[2.5rem] text-xs font-black uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all shadow-md group">
                    <span className="group-hover:hidden">REMOVE ENTRY</span>
                    <span className="hidden group-hover:inline flex items-center justify-center gap-2"><Trash2 size={16}/> CONFIRM?</span>
                  </button>
                </div>
              </div>
            </div>
          ) : viewMode === 'board' ? (
            <div className="flex gap-10 overflow-x-auto pb-12 h-full">
              {Object.keys(STATUS_CONFIG).map(status => {
                const config = STATUS_CONFIG[status];
                return (
                  <div key={status} className="w-[26rem] flex-shrink-0 flex flex-col gap-8">
                    <div className="flex items-center justify-between px-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${config.gradient} ring-4 ring-white shadow-lg`}></div>
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{status}</h3>
                      </div>
                      <span className="bg-white border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-black text-slate-600 shadow-sm">
                        {applications.filter(a => a.status === status).length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-6 pb-20">
                      {applications.filter(a => a.status === status).map(app => (
                        <div 
                          key={app.id} 
                          onClick={() => { setSelectedAppId(app.id); setViewMode('table'); }} 
                          className="bg-white p-8 rounded-[2.5rem] border-l-[6px] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                          style={{ borderColor: config.iconColor.replace('text-', '') }} 
                        >
                          <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 opacity-5 group-hover:opacity-10 transition-opacity ${config.bg} rounded-full blur-xl`}></div>
                          <div className="mb-6 relative z-10">
                             <div className="font-black text-xl text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{app.role}</div>
                             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-2">
                               <Building2 size={12}/> {app.company}
                             </div>
                          </div>
                          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50 relative z-10">
                             <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${config.lightBg} ${config.text}`}>{app.stage}</span>
                             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><ArrowRight size={16}/></div>
                          </div>
                        </div>
                      ))}
                      <button onClick={addApplication} className="w-full py-8 border-4 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all opacity-60 hover:opacity-100">
                        + Quick Add
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 space-y-12 animate-in zoom-in duration-500">
               <div className="relative group">
                 <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                 <Layers size={120} className="text-slate-300 relative z-10" />
               </div>
               <div className="text-center space-y-4 max-w-lg">
                 <h1 className="text-5xl font-black text-slate-800 uppercase tracking-tighter">Your Pipeline</h1>
                 <p className="text-slate-400 font-bold text-lg">Select a job from the sidebar or start fresh to begin tracking your career journey.</p>
               </div>
               <button onClick={addApplication} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all hover:shadow-indigo-500/30">
                 Create New Entry
               </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;