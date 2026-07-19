import React, { useState } from 'react';
import { 
  Play, RefreshCw, AlertTriangle, ShieldCheck, 
  Trash2, Edit2, Sliders, Brain, RefreshCcw, Send, Settings, Terminal
} from 'lucide-react';

export default function ControlDashboard({ bins, onEdit, apiBaseUrl }) {
  const [selectedCategories, setSelectedCategories] = useState({});
  const [loadingBinId, setLoadingBinId] = useState(null);
  const [escalatedStates, setEscalatedStates] = useState({});

  const handleAction = async (binId, endpoint, body = null) => {
    setLoadingBinId(binId);
    try {
      const url = body 
        ? `${apiBaseUrl}/bins/${binId}/${endpoint}?${new URLSearchParams(body).toString()}`
        : `${apiBaseUrl}/bins/${binId}/${endpoint}`;
        
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        console.error("Action trigger failed");
      }
    } catch (e) {
      console.error("Network connection error during simulator trigger:", e);
    } finally {
      setLoadingBinId(null);
    }
  };

  const triggerClassification = (binId) => {
    const category = selectedCategories[binId] || 'Recyclable';
    const isEscalated = !!escalatedStates[binId];
    
    // Choose random confidence based on escalation
    const confidence = isEscalated
      ? parseFloat((50 + Math.random() * 22).toFixed(1))
      : parseFloat((85 + Math.random() * 14.5).toFixed(1));

    handleAction(binId, 'classify', {
      category,
      confidence,
      escalated: isEscalated
    });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Simulation Instructions Banner */}
      <div className="bg-emerald-950 text-white p-5 rounded-2xl border border-emerald-900 shadow-sm relative overflow-hidden flex items-start gap-4">
        <div className="bg-emerald-800 p-2.5 rounded-xl border border-emerald-700 shrink-0">
          <Terminal className="text-emerald-400" size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm tracking-tight">Interactive Simulation Panel</h4>
          <p className="text-[11px] text-emerald-300 leading-relaxed max-w-2xl">
            This screen allows you to remotely control bin sensors in Mock Mode. Trigger fill alerts, truck cleanups, or AI classifications. Watch your commands sync instantly across the Operations Map and Analytics charts.
          </p>
        </div>
      </div>

      {/* Nodes list */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Deployed Bin Controllers</h3>

        <div className="grid grid-cols-1 gap-4">
          {bins.map((bin) => {
            const isLoading = loadingBinId === bin.id;
            
            return (
              <div 
                key={bin.id}
                className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-all"
              >
                {/* Node info summary */}
                <div className="min-w-[200px] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 animate-pulse" />
                    <h4 className="font-bold text-slate-800 text-sm tracking-tight">{bin.name}</h4>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono-jb space-x-2">
                    <span>ID: {bin.id}</span>
                    <span>•</span>
                    <span>Thresh: {bin.threshold}%</span>
                  </div>
                  
                  {/* Status pills */}
                  <div className="flex gap-1.5 pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 border text-slate-500 font-mono-jb">
                      Level: {bin.fill_pct.toFixed(1)}%
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      bin.status === 'Alert sent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      bin.status === 'Watching' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {bin.status}
                    </span>
                  </div>
                </div>

                {/* Simulation controls */}
                <div className="flex flex-wrap items-center gap-4 lg:border-l lg:border-slate-100 lg:pl-6 flex-1 justify-end">
                  
                  {/* Telemetry quick changes */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(bin.id, 'empty')}
                      disabled={isLoading}
                      className="flex items-center gap-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-600 hover:text-emerald-700 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                      title="Force bin empty event"
                    >
                      <RefreshCcw size={13} className={isLoading ? 'animate-spin' : ''} />
                      Empty Bin
                    </button>
                    
                    <button
                      onClick={() => handleAction(bin.id, 'fill')}
                      disabled={isLoading}
                      className="flex items-center gap-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                      title="Force bin alert overfill"
                    >
                      <AlertTriangle size={13} />
                      Overfill Bin
                    </button>
                  </div>

                  {/* Classification manual generator */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
                    <select
                      value={selectedCategories[bin.id] || 'Recyclable'}
                      onChange={(e) => setSelectedCategories({
                        ...selectedCategories,
                        [bin.id]: e.target.value
                      })}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 focus:outline-none"
                    >
                      <option value="Recyclable">Recyclable</option>
                      <option value="Wet">Wet / Organic</option>
                      <option value="Dry">Dry Waste</option>
                    </select>

                    {/* AI fallback check */}
                    <label className="flex items-center gap-1 cursor-pointer select-none px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:text-violet-700">
                      <input 
                        type="checkbox"
                        checked={!!escalatedStates[bin.id]}
                        onChange={(e) => setEscalatedStates({
                          ...escalatedStates,
                          [bin.id]: e.target.checked
                        })}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-3 h-3 cursor-pointer"
                      />
                      <Brain size={12} className={escalatedStates[bin.id] ? 'text-violet-600 animate-pulse' : ''} />
                      <span>AI Fallback</span>
                    </label>

                    <button
                      onClick={() => triggerClassification(bin.id)}
                      disabled={isLoading}
                      className="bg-emerald-800 hover:bg-emerald-950 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center"
                      title="Generate item classification event"
                    >
                      <Send size={12} />
                    </button>
                  </div>

                  {/* Standard parameters settings */}
                  <button
                    onClick={() => onEdit(bin)}
                    className="p-2 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    title="Edit bin configuration"
                  >
                    <Settings size={15} />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
