import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, Clock, AlertTriangle, CheckCircle, Brain, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

export default function BinDetails({ bin, onClose, apiBaseUrl }) {
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24); // default 24 hours

  const fetchBinDetails = async () => {
    setLoading(true);
    try {
      // Fetch history
      const historyRes = await fetch(`${apiBaseUrl}/bins/${bin.id}/history?hours=${timeRange}`);
      const historyData = await historyRes.json();
      setHistory(historyData);

      // Fetch classification events
      const eventsRes = await fetch(`${apiBaseUrl}/bins/${bin.id}/events`);
      const eventsData = await eventsRes.json();
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching bin details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bin) {
      fetchBinDetails();
    }
  }, [bin, timeRange]);

  if (!bin) return null;

  // Formatting timestamp for XAxis
  const chartData = history.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    'Fill Level (%)': item.fill_pct,
  }));

  // Chamber breakdown values from the bin or the latest history item
  const latestChamber = history.length > 0 
    ? history[history.length - 1].chamber_breakdown 
    : { wet: 33.3, dry: 33.3, recyclable: 33.4 };

  const getUrgencyColor = (pct) => {
    if (pct > bin.threshold) return '#f43f5e'; // rose-500
    if (pct >= 60) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-slate-50 shadow-2xl border-l border-slate-200 z-[9999] flex flex-col transition-all duration-300 animate-slide-in">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="text-emerald-700" size={20} />
            {bin.name} Details
          </h2>
          <p className="text-xs text-slate-400">ID: {bin.id}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">Fill Status</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-800">{bin.fill_pct.toFixed(1)}%</span>
              <span className="text-xs text-slate-400">filled</span>
            </div>
            <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${bin.fill_pct}%`,
                  backgroundColor: getUrgencyColor(bin.fill_pct)
                }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-medium">System Alert Status</span>
            <div className="mt-2 flex items-center gap-2">
              {bin.status === "Alert sent" ? (
                <>
                  <ShieldAlert className="text-rose-500 shrink-0" size={22} />
                  <span className="text-sm font-bold text-rose-600">Alert Active</span>
                </>
              ) : bin.status === "Watching" ? (
                <>
                  <AlertTriangle className="text-amber-500 shrink-0" size={22} />
                  <span className="text-sm font-bold text-amber-600">Watching (60%+)</span>
                </>
              ) : (
                <>
                  <CheckCircle className="text-emerald-600 shrink-0" size={22} />
                  <span className="text-sm font-bold text-emerald-600">Normal</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Triggers Webhook above {bin.threshold}%
            </span>
          </div>
        </div>

        {/* 24 Hour History Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
              <Clock size={16} className="text-slate-400" />
              Fill Level History
            </h3>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:border-emerald-600"
            >
              <option value={12}>Last 12 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={48}>Last 48 Hours</option>
            </select>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              <RefreshCw className="animate-spin mr-2" size={16} /> Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs italic">
              No historical data recorded yet.
            </div>
          ) : (
            <div className="h-48 w-full -ml-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getUrgencyColor(bin.fill_pct)} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={getUrgencyColor(bin.fill_pct)} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={9} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="Fill Level (%)" 
                    stroke={getUrgencyColor(bin.fill_pct)} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorFill)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chamber Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">
            Chamber Breakdown (Latest reading)
          </h3>
          <div className="space-y-3">
            {/* Recyclable Chamber */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-700">Recyclable Waste</span>
                <span className="text-slate-600">{latestChamber.recyclable.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${latestChamber.recyclable}%` }}
                />
              </div>
            </div>

            {/* Dry Chamber */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-700">Dry Waste</span>
                <span className="text-slate-600">{latestChamber.dry.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${latestChamber.dry}%` }}
                />
              </div>
            </div>

            {/* Wet Chamber */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-700">Wet / Organic Waste</span>
                <span className="text-slate-600">{latestChamber.wet.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${latestChamber.wet}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Localized Classification Feed */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">
            Recent Classifications
          </h3>
          {loading ? (
            <div className="text-slate-400 text-xs text-center py-4">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <p className="text-slate-400 text-xs italic text-center py-4">
              No recent segregation events logged.
            </p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {events.map((event, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded-[4px] font-bold text-[10px] ${
                        event.category === "Recyclable" ? "bg-emerald-50 text-emerald-700" :
                        event.category === "Wet" ? "bg-amber-50 text-amber-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {event.category}
                      </span>
                      <span className="font-semibold text-slate-700">{event.confidence}% confidence</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {event.escalated_to_llm && (
                    <div className="flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded-[4px]" title="AI Fallback Verification invoked">
                      <Brain size={12} className="animate-pulse" />
                      <span className="text-[9px] font-semibold">AI FALLBACK</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
