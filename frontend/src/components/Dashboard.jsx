import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import BinCard from './BinCard';
import BinMap from './BinMap';
import BinDetails from './BinDetails';
import ClassificationFeed from './ClassificationFeed';
import AlertLog from './AlertLog';
import BinAdminForm from './BinAdminForm';
import AnalyticsDashboard from './AnalyticsDashboard';
import ControlDashboard from './ControlDashboard';
import { CardSkeleton, MapSkeleton } from './SkeletonLoader';
import { 
  Plus, ShieldAlert, Layers, LayoutDashboard, BarChart3, 
  Terminal, ShieldCheck, HelpCircle, Activity, HardDrive
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live';

export default function Dashboard() {
  const [bins, setBins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  
  // Navigation tab state: 'operations' | 'analytics' | 'control'
  const [activeTab, setActiveTab] = useState('operations');
  
  // Admin form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [binToEdit, setBinToEdit] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Fetch all bins
  const fetchBins = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/bins`);
      if (res.ok) {
        const data = await res.json();
        setBins(data);
      }
    } catch (e) {
      console.error("Error fetching bins:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical alerts
  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error("Error fetching alerts:", e);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBins();
    fetchAlerts();
  }, []);

  // Handle incoming WebSocket updates
  const handleWebSocketMessage = useCallback((message) => {
    const { event, data } = message;
    
    if (event === 'bin_updated') {
      setBins((prevBins) => {
        const index = prevBins.findIndex((b) => b.id === data.id);
        if (index > -1) {
          const updated = [...prevBins];
          updated[index] = { ...updated[index], ...data };
          
          if (selectedBin && selectedBin.id === data.id) {
            setSelectedBin((prevSelected) => ({ ...prevSelected, ...data }));
          }
          return updated;
        } else {
          return [...prevBins, data];
        }
      });
    } 
    else if (event === 'alert_triggered') {
      setAlerts((prevAlerts) => [data, ...prevAlerts].slice(0, 100));
    } 
    else if (event === 'classification_event') {
      setClassifications((prevEvents) => [data, ...prevEvents].slice(0, 50));
    }
  }, [selectedBin]);

  const wsConnected = useWebSocket(WS_BASE_URL, handleWebSocketMessage);

  // CRUD actions
  const handleSaveBin = async (binData) => {
    const isEdit = bins.some((b) => b.id === binData.id);
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${API_BASE_URL}/bins/${binData.id}` : `${API_BASE_URL}/bins`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(binData)
      });
      if (res.ok) {
        await fetchBins();
        setIsFormOpen(false);
        setBinToEdit(null);
      } else {
        const err = await res.json();
        alert(`Failed to save bin: ${err.detail || 'Unknown error'}`);
      }
    } catch (e) {
      console.error("Error saving bin:", e);
      alert("Failed to connect to backend server.");
    }
  };

  const handleSelectBinById = (binId) => {
    const target = bins.find((b) => b.id === binId);
    if (target) {
      setSelectedBin(target);
    }
  };

  // Calculate high-level KPIs
  const totalBins = bins.length;
  const activeAlerts = bins.filter((b) => b.status === 'Alert sent').length;
  const watchCount = bins.filter((b) => b.status === 'Watching').length;
  const avgFillPct = totalBins > 0 
    ? bins.reduce((sum, b) => sum + b.fill_pct, 0) / totalBins 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      
      {/* 🖥️ Sidebar Navigation Container */}
      <aside className="w-full md:w-64 bg-emerald-950 text-white shrink-0 border-b md:border-b-0 md:border-r border-emerald-900 flex flex-col justify-between sticky top-0 z-[100] h-auto md:h-screen shadow-lg">
        
        <div>
          {/* Logo & Header */}
          <div className="p-5 border-b border-emerald-900/50 flex items-center gap-3">
            <div className="bg-emerald-800 p-2 rounded-xl border border-emerald-700">
              <Layers className="text-emerald-400" size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight leading-none text-emerald-50">Smart Segregator</h1>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block mt-1">Sanitation Dashboard</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('operations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'operations' 
                  ? 'bg-emerald-800/80 text-white border border-emerald-700 shadow-inner' 
                  : 'text-slate-300 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} className={activeTab === 'operations' ? 'text-emerald-400' : 'text-slate-400'} />
              Operations Monitor
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-emerald-800/80 text-white border border-emerald-700 shadow-inner' 
                  : 'text-slate-300 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <BarChart3 size={16} className={activeTab === 'analytics' ? 'text-emerald-400' : 'text-slate-400'} />
              Sustainability Analytics
            </button>

            <button
              onClick={() => setActiveTab('control')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'control' 
                  ? 'bg-emerald-800/80 text-white border border-emerald-700 shadow-inner' 
                  : 'text-slate-300 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <Terminal size={16} className={activeTab === 'control' ? 'text-emerald-400' : 'text-slate-400'} />
              Simulation Controls
            </button>
          </nav>
        </div>

        {/* Sidebar Footer / Connection Status */}
        <div className="p-4 border-t border-emerald-900/50 bg-emerald-950/40 space-y-4">
          
          {/* WS Status indicators */}
          <div className="bg-emerald-900/30 border border-emerald-800/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {wsConnected ? 'Telemetry Connected' : 'Telemetry Offline'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">
              {wsConnected 
                ? 'Subscribed to live MQTT broker topics. Updates stream instantly.' 
                : 'Lost connection to gateway. Reconnection sequence active.'}
            </p>
          </div>

          <button
            onClick={() => {
              setBinToEdit(null);
              setIsFormOpen(true);
            }}
            className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 hover:border-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all"
          >
            <Plus size={14} /> Add Smart Bin
          </button>
        </div>

      </aside>

      {/* 🚀 Main Workspace Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 capitalize tracking-tight leading-none">
              {activeTab === 'operations' ? 'Operations Dashboard' : activeTab === 'analytics' ? 'Sustainability analytics' : 'Simulation Control Center'}
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Smart IoT Waste Segregator System</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {/* KPI pill summaries */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-500">Nodes: <strong>{totalBins}</strong></span>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[10px] text-slate-500">Alerts: <strong>{activeAlerts}</strong></span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Work Container */}
        <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Render Tab Contents */}
          {activeTab === 'operations' && (
            <>
              {/* KPI Panel */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Smart Bins</span>
                    <p className="text-2xl font-black text-slate-800 leading-tight">{totalBins}</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100">
                    <HardDrive size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Average Fill Capacity</span>
                    <p className="text-2xl font-black text-slate-800 leading-tight">{avgFillPct.toFixed(1)}%</p>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    avgFillPct > 80 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    avgFillPct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    <Activity size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Active Alerts</span>
                    <p className={`text-2xl font-black leading-tight ${activeAlerts > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                      {activeAlerts}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${activeAlerts > 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    <ShieldAlert size={18} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Watching (60%+)</span>
                    <p className="text-2xl font-black text-slate-800 leading-tight">{watchCount}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${watchCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    <Activity size={18} />
                  </div>
                </div>
              </section>

              {/* Live Map & Feed Layout */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Map Column */}
                <div className="lg:col-span-2 h-[400px] flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Live Map Monitoring</h3>
                  {loading ? <MapSkeleton /> : (
                    <BinMap 
                      bins={bins} 
                      selectedBin={selectedBin} 
                      onSelectBin={(bin) => setSelectedBin(bin)} 
                    />
                  )}
                </div>

                {/* Classification Feed Column */}
                <div className="h-[400px] flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Live Classifications Feed</h3>
                  <ClassificationFeed 
                    events={classifications} 
                    onSelectBinById={handleSelectBinById} 
                  />
                </div>
              </section>

              {/* Grid of Bins */}
              <section className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Deployed Bin Status</h3>
                  <span className="text-xs text-slate-500 font-semibold bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-sm">
                    {bins.length} Active Nodes
                  </span>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : bins.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm text-center">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HelpCircle className="text-slate-400" size={24} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">No Smart Bins Configured</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                      Deploy and connect smart bin telemetry endpoints or use the simulator to generate mock nodes automatically.
                    </p>
                    <button 
                      onClick={() => setIsFormOpen(true)}
                      className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      Create a Bin
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bins.map((bin) => (
                      <BinCard 
                        key={bin.id} 
                        bin={bin} 
                        onSelect={(b) => setSelectedBin(b)}
                        onEdit={(b) => {
                          setBinToEdit(b);
                          setIsFormOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Alert Logs */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Alarm Logs</h3>
                <AlertLog alerts={alerts} loading={alertsLoading} />
              </section>
            </>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard bins={bins} />
          )}

          {activeTab === 'control' && (
            <ControlDashboard 
              bins={bins}
              onEdit={(bin) => {
                setBinToEdit(bin);
                setIsFormOpen(true);
              }}
              apiBaseUrl={API_BASE_URL}
            />
          )}

        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 shrink-0">
          <p>© 2026 Smart IoT Waste Segregation Portal. Moss Green design language.</p>
        </footer>

      </div>

      {/* Admin edit/create form modal */}
      {isFormOpen && (
        <BinAdminForm 
          binToEdit={binToEdit}
          onSave={handleSaveBin}
          onClose={() => {
            setIsFormOpen(false);
            setBinToEdit(null);
          }}
        />
      )}

      {/* Selected bin slide-over details panel */}
      {selectedBin && (
        <BinDetails 
          bin={selectedBin} 
          onClose={() => setSelectedBin(null)} 
          apiBaseUrl={API_BASE_URL}
        />
      )}

    </div>
  );
}
