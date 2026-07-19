import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Info, MapPin } from 'lucide-react';

// Custom component to handle dynamic map panning/centering
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.panTo(center);
    }
  }, [center, map]);
  return null;
}

export default function BinMap({ bins, selectedBin, onSelectBin }) {
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default center (Bangalore)
  const [zoom, setZoom] = useState(13);

  // Compute average center based on bins if available
  useEffect(() => {
    if (bins && bins.length > 0) {
      const avgLat = bins.reduce((sum, b) => sum + b.location.lat, 0) / bins.length;
      const avgLng = bins.reduce((sum, b) => sum + b.location.lng, 0) / bins.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [bins.length]); // recalculate only on list size change

  // Recenter map to selected bin if triggered from list
  useEffect(() => {
    if (selectedBin) {
      setMapCenter([selectedBin.location.lat, selectedBin.location.lng]);
    }
  }, [selectedBin]);

  // Generate CSS styled HTML markers representing bin urgency
  const getCustomMarkerIcon = (bin) => {
    const isOverThreshold = bin.fill_pct > bin.threshold;
    const isHigh = bin.fill_pct >= 60.0;
    
    let colorClass = 'bg-emerald-500 border-white';
    let ringClass = 'bg-emerald-400 border-emerald-500 animate-pulse';
    
    if (isOverThreshold) {
      colorClass = 'bg-rose-500 border-white';
      ringClass = 'bg-rose-400 border-rose-500 animate-ping';
    } else if (isHigh) {
      colorClass = 'bg-amber-500 border-white';
      ringClass = 'bg-amber-400 border-amber-500 animate-pulse';
    }

    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full border opacity-50 ${ringClass}"></div>
          <div class="w-4 h-4 rounded-full border-2 shadow-md ${colorClass}"></div>
        </div>
      `,
      className: 'custom-leaflet-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -10]
    });
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bins.map((bin) => (
          <Marker 
            key={bin.id} 
            position={[bin.location.lat, bin.location.lng]}
            icon={getCustomMarkerIcon(bin)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px] font-sans">
                <h4 className="font-bold text-slate-800 text-sm mb-1">{bin.name}</h4>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2">
                  <MapPin size={10} />
                  <span>Lat: {bin.location.lat.toFixed(4)}, Lng: {bin.location.lng.toFixed(4)}</span>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Fill Level:</span>
                    <span className={bin.fill_pct > bin.threshold ? 'text-rose-600' : bin.fill_pct >= 60.0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {bin.fill_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${bin.fill_pct > bin.threshold ? 'bg-rose-500' : bin.fill_pct >= 60.0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, bin.fill_pct)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t pt-2">
                  <span>Status: <strong className="text-slate-600">{bin.status}</strong></span>
                  <button 
                    onClick={() => onSelectBin(bin)}
                    className="flex items-center gap-0.5 text-emerald-700 font-semibold hover:underline"
                  >
                    <Info size={11} /> Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController center={mapCenter} />
      </MapContainer>
    </div>
  );
}
