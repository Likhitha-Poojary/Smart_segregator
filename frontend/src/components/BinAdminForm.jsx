import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, AlertTriangle } from 'lucide-react';

export default function BinAdminForm({ binToEdit, onSave, onClose }) {
  const isEditing = !!binToEdit;
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [lat, setLat] = useState(12.9716);
  const [lng, setLng] = useState(77.5946);
  const [threshold, setThreshold] = useState(85.0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (binToEdit) {
      setId(binToEdit.id);
      setName(binToEdit.name);
      setLat(binToEdit.location.lat);
      setLng(binToEdit.location.lng);
      setThreshold(binToEdit.threshold);
    } else {
      setId(`bin_${Math.random().toString(36).substr(2, 5)}`);
      setName('');
      setLat(12.9716 + (Math.random() - 0.5) * 0.01);
      setLng(77.5946 + (Math.random() - 0.5) * 0.01);
      setThreshold(85.0);
    }
  }, [binToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!id.trim() || !name.trim()) {
      setError('Bin ID and Bin Name are required.');
      return;
    }

    if (isNaN(lat) || isNaN(lng)) {
      setError('Latitude and Longitude must be valid numbers.');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Coordinates out of range. Lat: [-90, 90], Lng: [-180, 180]');
      return;
    }

    if (threshold < 10 || threshold > 100) {
      setError('Threshold must be between 10% and 100%.');
      return;
    }

    onSave({
      id: id.trim().toLowerCase(),
      name: name.trim(),
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      threshold: parseFloat(threshold)
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white flex justify-between items-center">
          <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
            {isEditing ? 'Edit Bin Parameters' : 'Add New Smart Bin'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-emerald-800 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-lg flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bin ID */}
          <div className="space-y-1">
            <label className="block text-slate-400">Bin Unique ID (MQTT Topic Key)</label>
            <input 
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={isEditing}
              placeholder="e.g. bin_e"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          {/* Bin Name */}
          <div className="space-y-1">
            <label className="block text-slate-400">Bin Display Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Science Lab Bin A"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Coordinates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-400">Latitude</label>
              <input 
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="12.9716"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-400">Longitude</label>
              <input 
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="77.5946"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="block text-slate-400">Alert Notification Threshold</label>
              <span className="text-emerald-700 font-bold">{threshold}%</span>
            </div>
            <input 
              type="range"
              min="10"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-colors font-bold"
            >
              <Save size={14} />
              Save Bin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
