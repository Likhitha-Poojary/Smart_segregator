import React from 'react';
import { ShieldAlert, BellRing, Check, AlertCircle } from 'lucide-react';

export default function AlertLog({ alerts, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-rose-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-rose-600 shrink-0" size={18} />
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">System Alert logs</h3>
        </div>
        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">
          {alerts.length} Total
        </span>
      </div>

      {/* Alert Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[300px]">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Loading alert history...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No alerts triggered. Bins are currently within threshold limits.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-4">Bin</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Fill Level</th>
                <th className="py-2.5 px-4">Notification status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {alerts.map((alert, index) => {
                const date = new Date(alert.timestamp);
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                  ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700">{alert.bin_name}</td>
                    <td className="py-3 px-4 text-slate-400">{formattedTime}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      {alert.fill_pct_at_alert.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      {alert.notified ? (
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <Check size={10} />
                          <span>Sent via {alert.channel}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <AlertCircle size={10} />
                          <span>Failed (webhook config)</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
