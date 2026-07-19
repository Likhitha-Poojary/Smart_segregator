import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Leaf, Award, Recycle, Trash2, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

export default function AnalyticsDashboard({ bins }) {
  
  // 1. Calculate cumulative metrics
  const totalBins = bins.length;
  
  // Mock cumulative weights for realistic metrics
  const averageFill = totalBins > 0 
    ? bins.reduce((sum, b) => sum + b.fill_pct, 0) / totalBins 
    : 0;

  // Let's assume each bin holds 120kg max.
  const estimatedTotalKg = bins.reduce((sum, b) => sum + (b.fill_pct / 100) * 120, 0);
  
  // Calculate mock environmental metrics based on filled weight
  const co2Offset = estimatedTotalKg * 1.62; // 1.62 kg CO2 per kg recycled
  const treesSaved = estimatedTotalKg * 0.012; // fraction of tree per kg paper/cardboard
  const energySaved = estimatedTotalKg * 5.4; // kWh saved per kg plastic/metal

  // 2. Chamber distribution aggregates
  // In a real app we aggregate readings. Let's make an approximation based on active bins
  const recyclableKg = estimatedTotalKg * 0.38;
  const wetKg = estimatedTotalKg * 0.35;
  const dryKg = estimatedTotalKg * 0.27;

  const compositionData = [
    { name: 'Recyclable', value: recyclableKg, color: '#10b981' }, // emerald-500
    { name: 'Wet / Organic', value: wetKg, color: '#f59e0b' },    // amber-500
    { name: 'Dry Waste', value: dryKg, color: '#3b82f6' }        // blue-500
  ];

  // 3. Node accuracy comparisons (Mock rates for bins)
  const nodeAccuracyData = bins.map((bin, idx) => {
    // Generate a stable seed based on bin name
    const seed = bin.name.charCodeAt(0) + bin.name.charCodeAt(bin.name.length - 1);
    const accuracy = 88 + (seed % 11.5); // ranges from 88% to 99.5%
    return {
      name: bin.name.split(' (')[0], // Clean name
      'Classification Accuracy (%)': parseFloat(accuracy.toFixed(1)),
      'Fill Level (%)': parseFloat(bin.fill_pct.toFixed(1))
    };
  });

  // 4. Cumulative timeline trends
  // Construct a realistic 7-hour timeline showing cumulative segregation volume
  const timelineData = Array.from({ length: 7 }).map((_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (6 - i));
    const timeStr = hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Scale weights progressively
    const factor = (i + 1) * 0.85;
    return {
      time: timeStr,
      Recyclable: parseFloat((recyclableKg * 0.5 * factor).toFixed(1)),
      'Wet / Organic': parseFloat((wetKg * 0.53 * factor).toFixed(1)),
      'Dry Waste': parseFloat((dryKg * 0.47 * factor).toFixed(1)),
    };
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Environmental Impact Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: CO2 Offset */}
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 bg-emerald-50 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform"></div>
          <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-2xl border border-emerald-100 shrink-0">
            <Leaf size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">CO₂ Emission Prevented</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {co2Offset.toFixed(1)} <span className="text-xs font-semibold text-slate-400">kg</span>
            </span>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">Equivalent to offset of { (co2Offset / 21).toFixed(2) } mature trees</p>
          </div>
        </div>

        {/* Card 2: Trees Saved */}
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 bg-teal-50 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform"></div>
          <div className="bg-teal-50 text-teal-700 p-3.5 rounded-2xl border border-teal-100 shrink-0">
            <Recycle size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Estimated Wood Saved</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {treesSaved.toFixed(2)} <span className="text-xs font-semibold text-slate-400">Trees</span>
            </span>
            <p className="text-[10px] text-teal-600 font-medium mt-1">Diverted from pulping & landfills</p>
          </div>
        </div>

        {/* Card 3: Energy Saved */}
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 bg-blue-50 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform"></div>
          <div className="bg-blue-50 text-blue-700 p-3.5 rounded-2xl border border-blue-100 shrink-0">
            <Award size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Cumulative Energy Savings</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {energySaved.toFixed(1)} <span className="text-xs font-semibold text-slate-400">kWh</span>
            </span>
            <p className="text-[10px] text-blue-600 font-medium mt-1">Saves equivalent of {(energySaved / 30).toFixed(1)} days of home power</p>
          </div>
        </div>

      </div>

      {/* Main Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: Cumulative Volume Stacked Area */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <TrendingUp className="text-emerald-700" size={16} />
              Segregation Trends (Cumulative Volume)
            </h3>
            <p className="text-[11px] text-slate-400">Track accumulation of wet, dry, and recyclable chambers over the operational period</p>
          </div>
          
          <div className="h-64 w-full -ml-4">
            {totalBins === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No active bin nodes to compile chart trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="Recyclable" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Wet / Organic" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Dry Waste" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Pie Chart Composition */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="text-emerald-700" size={16} />
              Waste Stream Composition
            </h3>
            <p className="text-[11px] text-slate-400">Proportional breakdown of total collected waste weight</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {estimatedTotalKg === 0 ? (
              <p className="text-slate-400 text-xs italic">Bins are currently empty.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val.toFixed(1)} kg`} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Custom Legends */}
          <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-50 text-[10px] text-center font-bold">
            {compositionData.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <span className="block w-2.5 h-2.5 mx-auto rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="block text-slate-500 font-semibold truncate">{item.name}</span>
                <span className="block text-slate-800">
                  {estimatedTotalKg > 0 ? ((item.value / estimatedTotalKg) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Accuracy & Efficiency Comparisons Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-4">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            <ShieldCheck className="text-emerald-700" size={16} />
            Node-Level Classification Accuracy
          </h3>
          <p className="text-[11px] text-slate-400">Comparison of local camera edge model verification vs manual fallbacks per physical bin</p>
        </div>

        <div className="h-64 w-full -ml-4">
          {totalBins === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              No deployed bins.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nodeAccuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis domain={[70, 100]} stroke="#94a3b8" fontSize={9} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Classification Accuracy (%)" fill="#065f46" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="Fill Level (%)" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
