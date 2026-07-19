import React from 'react';
import { Trash2, Edit2, MapPin, Clock, Info } from 'lucide-react';

export default function BinCard({ bin, onSelect, onEdit, onDelete }) {
  const { id, name, location, threshold, fill_pct, status, last_updated } = bin;

  // Determine colors based on fill percentage
  const getUrgencyColors = (fill) => {
    if (fill > threshold) {
      return {
        bar: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        text: 'text-rose-600',
        border: 'border-rose-100 hover:border-rose-300'
      };
    }
    if (fill >= 60.0) {
      return {
        bar: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        text: 'text-amber-600',
        border: 'border-amber-100 hover:border-amber-300'
      };
    }
    return {
      bar: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      text: 'text-emerald-600',
      border: 'border-emerald-100 hover:border-emerald-300'
    };
  };

  const colors = getUrgencyColors(fill_pct);
  const formattedTime = last_updated
    ? new Date(last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'No readings';

  return (
    <div 
      className={`group relative bg-white/80 backdrop-blur-md p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${colors.border}`}
      onClick={() => onSelect(bin)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-slate-800 text-base tracking-tight group-hover:text-emerald-950 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <MapPin size={12} className="shrink-0" />
            <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        </div>
        
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colors.badge}`}>
          {status}
        </span>
      </div>

      {/* Fill Level Info */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-medium text-slate-400">Fill Level</span>
          <span className={`text-lg font-bold tracking-tight ${colors.text}`}>{fill_pct.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
            style={{ width: `${Math.min(100, fill_pct)}%` }}
          />
        </div>
      </div>

      {/* Footer / Meta info */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>Updated {formattedTime}</span>
        </div>
        <span className="font-medium bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">
          Threshold: {threshold}%
        </span>
      </div>

      {/* Hover action overlay icons */}
      <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-100 shadow-sm transition-all" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(bin)}
          className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-md transition-colors"
          title="Edit parameters"
        >
          <Edit2 size={13} />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md transition-colors"
            title="Delete bin"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
