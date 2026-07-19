import React from 'react';
import { Brain, Cpu, Database, Eye } from 'lucide-react';

export default function ClassificationFeed({ events, onSelectBinById }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-950 to-emerald-900 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Cpu className="text-emerald-400 shrink-0" size={18} />
          <h3 className="font-bold text-sm tracking-tight">Real-Time Classification Feed</h3>
        </div>
        <span className="text-[10px] uppercase font-semibold bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded">
          Live
        </span>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
            <Database className="stroke-[1.5] mb-2 text-slate-300" size={32} />
            <p className="text-xs italic">Waiting for MQTT classification events...</p>
          </div>
        ) : (
          events.map((event, index) => {
            const time = new Date(event.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            });
            
            return (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl transition-all duration-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400">{time}</span>
                    <button 
                      onClick={() => onSelectBinById(event.bin_id)}
                      className="text-xs font-bold text-emerald-800 hover:underline hover:text-emerald-950"
                    >
                      {event.bin_name}
                    </button>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      event.category === 'Recyclable' ? 'bg-emerald-100 text-emerald-700' :
                      event.category === 'Wet' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {event.category}
                    </span>
                  </div>
                  
                  <div className="text-xs font-semibold text-slate-600">
                    Confidence: <span className="text-slate-900 font-bold">{event.confidence}%</span>
                  </div>
                </div>

                {/* AI Escalation Badge */}
                {event.escalated_to_llm ? (
                  <div 
                    className="flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-100 px-2 py-1 rounded-lg text-[9px] font-bold shadow-[0_0_8px_rgba(139,92,246,0.15)] animate-pulse"
                    title="Escalated to local LLM for verification"
                  >
                    <Brain size={12} className="shrink-0 text-violet-600" />
                    <span>AI FALLBACK</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium bg-white px-2 py-0.5 rounded border border-slate-100">
                    Edge Model
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
