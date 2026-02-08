
import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, ShieldQuestion, History, Search, 
  AlertTriangle, ExternalLink, Loader2, Trash2, PieChart as PieChartIcon,
  MessageSquare, Image as ImageIcon, Terminal, Download, Settings,
  Zap, Globe, Shield, X, ChevronRight, Info, CheckCircle2
} from 'lucide-react';
import { Verdict, AnalysisResult, ScanStats, SystemLog, GroundingSource } from './types';
import { analyzeMessage } from './services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { validateImageData } from './utils/security';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepScan, setDeepScan] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'insights'>('scan');
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('scamshield_db');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scamshield_db', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (showLogs) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, showLogs]);

  const addLog = (message: string, type: SystemLog['type'] = 'info') => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      message,
      type
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const stats: ScanStats = history.reduce((acc, curr) => {
    acc.total++;
    if (curr.verdict === Verdict.SCAM) acc.scams++;
    else if (curr.verdict === Verdict.SUSPICIOUS) acc.suspicious++;
    else acc.safe++;
    return acc;
  }, { total: 0, scams: 0, suspicious: 0, safe: 0 });

  const handleAudit = async () => {
    if (!inputText.trim() && !imageFile) return;
    setIsAnalyzing(true);
    addLog(`Scanning input...`, 'info');
    
    try {
      const result = await analyzeMessage(imageFile || inputText, !!imageFile, deepScan);
      setCurrentResult(result);
      setHistory(prev => [result, ...prev].slice(0, 100));
      addLog(`Scan complete: ${result.verdict}`, 'success');
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictStyles = (verdict: Verdict) => {
    switch (verdict) {
      case Verdict.SCAM: return { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: <ShieldAlert className="w-8 h-8 text-rose-500" />, label: 'Definitely a Scam' };
      case Verdict.SUSPICIOUS: return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <ShieldQuestion className="w-8 h-8 text-amber-500" />, label: 'Look Out' };
      case Verdict.SAFE: return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />, label: 'Looks Safe' };
    }
  };

  const chartData = [
    { name: 'Scams', value: stats.scams, color: '#f43f5e' },
    { name: 'Suspicious', value: stats.suspicious, color: '#f59e0b' },
    { name: 'Safe', value: stats.safe, color: '#10b981' },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center">
      {/* Friendly Header */}
      <header className="w-full max-w-5xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              SCAMSHIELD <span className="gradient-text">PRO</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Your personal digital guardian</p>
          </div>
        </div>

        <nav className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
          {[
            { id: 'scan', label: 'Scanner', icon: Search },
            { id: 'history', label: 'History', icon: History },
            { id: 'insights', label: 'Insights', icon: PieChartIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-sm ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="w-full max-w-5xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
        {/* Main Interface */}
        <div className="lg:col-span-7 space-y-8">
          {activeTab === 'scan' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Check a Message</h2>
                      <p className="text-slate-500 text-xs">Paste text or upload a screenshot</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setDeepScan(!deepScan)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${deepScan ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >
                    <Zap className={`w-3 h-3 ${deepScan ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Expert Analysis</span>
                  </button>
                </div>

                {!imageFile ? (
                  <div className="relative group">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste a suspicious SMS, Email, or Link here..."
                      className="w-full h-56 bg-slate-950/50 border border-slate-800 rounded-3xl p-6 text-indigo-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none resize-none transition-all placeholder:text-slate-700 text-base leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-4">
                       <label className="cursor-pointer p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl transition-all block group-hover:scale-105">
                          <ImageIcon className="w-6 h-6" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = () => { if (validateImageData(r.result as string)) { setImageFile(r.result as string); setInputText(''); } };
                              r.readAsDataURL(f);
                            }
                          }} />
                       </label>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-black/40 h-56 flex items-center justify-center p-4">
                    <img src={imageFile} alt="Preview" className="h-full object-contain rounded-xl shadow-2xl" />
                    <button 
                      onClick={() => setImageFile(null)}
                      className="absolute top-4 right-4 p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={handleAudit}
                    disabled={isAnalyzing || (!inputText.trim() && !imageFile)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold py-5 px-8 rounded-3xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-4 text-lg active:scale-95"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-6 h-6" />
                        Check Safety
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-800/50 p-6 rounded-3xl flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                   <Globe className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-white uppercase tracking-wider">Privacy First</h4>
                   <p className="text-xs text-slate-500 leading-relaxed">Your data is processed securely and never sold. We only use it to protect you.</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extrabold text-white">Your Activity</h2>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <div className="py-20 text-center">
                    <History className="w-16 h-16 mx-auto mb-4 text-slate-800" />
                    <p className="text-slate-500 font-medium">No messages scanned yet.</p>
                  </div>
                ) : (
                  history.map((item) => {
                    const style = getVerdictStyles(item.verdict);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setCurrentResult(item)}
                        className="group p-5 bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-xl ${style.bg}`}>
                             {style.icon}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white line-clamp-1">{item.content}</p>
                              <span className="text-[10px] text-slate-500 font-medium">{new Date(item.timestamp).toLocaleDateString()}</span>
                           </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-indigo-500 transition-all" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
                  <h3 className="text-lg font-bold mb-6 text-white">Detection Summary</h3>
                  <div className="h-56 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                     {chartData.map(d => (
                       <div key={d.name} className="flex justify-between items-center px-4 py-2 rounded-xl bg-slate-950/50 border border-slate-800">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{d.name}</span>
                         <span className="text-sm font-bold text-white">{d.value}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-600/20">
                     <CheckCircle2 className="w-10 h-10 mb-4 text-indigo-200" />
                     <h3 className="text-xl font-bold mb-2">You're Protected</h3>
                     <p className="text-indigo-100 text-sm leading-relaxed">Our system has scanned {stats.total} messages for you. Keep checking suspicious links to stay one step ahead.</p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8">
                    <h3 className="font-bold mb-4 text-white">Security Checklist</h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 text-sm text-slate-400">
                         <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                         Never share OTPs
                       </div>
                       <div className="flex items-center gap-3 text-sm text-slate-400">
                         <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                         Check the full link URL
                       </div>
                       <div className="flex items-center gap-3 text-sm text-slate-400">
                         <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                         Don't trust urgent threats
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Results Sidebar */}
        <div className="lg:col-span-5">
          {currentResult ? (
            <div className={`sticky top-10 bg-slate-900 border-2 ${getVerdictStyles(currentResult.verdict).border} rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in duration-300`}>
              <div className="flex flex-col items-center text-center mb-8">
                <div className={`p-6 rounded-3xl mb-6 shadow-xl ${getVerdictStyles(currentResult.verdict).bg}`}>
                  {getVerdictStyles(currentResult.verdict).icon}
                </div>
                <h2 className={`text-3xl font-black mb-1 ${getVerdictStyles(currentResult.verdict).color}`}>
                  {getVerdictStyles(currentResult.verdict).label}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  Risk Level: {currentResult.riskScore}%
                </div>
              </div>

              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden mb-10 border border-slate-800/50 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    currentResult.riskScore > 70 ? 'bg-rose-500' : 
                    currentResult.riskScore > 30 ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${currentResult.riskScore}%` }}
                ></div>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" /> Our Analysis
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                    {currentResult.reasoning}
                  </p>
                </section>

                <section>
                  <h3 className="text-white text-sm font-bold mb-4">Warning Signs</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentResult.indicators.map((tag, i) => (
                      <div key={i} className="px-4 py-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold shadow-sm">
                        {tag}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
                  <h3 className="text-indigo-400 text-sm font-bold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Recommended Action
                  </h3>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed italic">
                    {currentResult.advice}
                  </p>
                </section>

                {currentResult.sources && (
                  <section>
                    <h3 className="text-white text-sm font-bold mb-4">Verification Sources</h3>
                    <div className="space-y-2">
                      {currentResult.sources.map((src, i) => (
                        <a 
                          key={i} href={src.uri} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all text-xs text-indigo-400 font-bold"
                        >
                          <span className="truncate mr-2">{src.title}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                <div className="pt-6 border-t border-slate-800">
                  <button 
                    onClick={() => setCurrentResult(null)}
                    className="w-full py-4 text-slate-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-all"
                  >
                    Close Results
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="sticky top-10 bg-slate-900/20 border-2 border-slate-800 border-dashed rounded-[3xl] p-16 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-slate-800">
                <ShieldQuestion className="w-10 h-10 text-slate-700" />
              </div>
              <h2 className="text-slate-500 font-bold text-lg mb-2 uppercase tracking-tight">Waiting for Scan</h2>
              <p className="text-slate-700 text-sm max-w-[240px] leading-relaxed font-medium">
                Paste a message or upload a photo on the left to start checking for scams.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-5xl px-6 py-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-600">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Protection Engine</span>
            <span className="text-xs font-bold text-slate-500">v4.2.0 (Stable)</span>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Status</span>
            <div className="flex items-center gap-2 text-emerald-500">
               <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
               <span className="text-[10px] font-bold uppercase tracking-widest">Active Guard</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowLogs(!showLogs)}
          className="text-[10px] font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors flex items-center gap-2"
        >
          <Terminal className="w-3 h-3" /> Technical Console
        </button>
      </footer>

      {/* Advanced Console (Hidden by default for simplicity) */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-[#050b1a] border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-3 text-indigo-400">
                  <Terminal className="w-5 h-5" /> Advanced System Console
                </h3>
                <button onClick={() => setShowLogs(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 h-[400px] overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
                 {logs.map(log => (
                   <div key={log.id} className="flex gap-4">
                     <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                     <span className={`uppercase font-bold ${log.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>[{log.type}]</span>
                     <span className="text-slate-300">{log.message}</span>
                   </div>
                 ))}
                 <div ref={logEndRef} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
