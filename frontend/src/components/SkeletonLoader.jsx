import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-5 w-32 bg-slate-200 rounded-md mb-2"></div>
          <div className="h-3.5 w-44 bg-slate-100 rounded-md"></div>
        </div>
        <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full mb-3"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 w-20 bg-slate-100 rounded-md"></div>
        <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-slate-100 rounded-t-lg mb-2"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-slate-100">
          <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
          <div className="h-4 w-1/6 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/6 bg-slate-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-2xl">
      <div className="text-center text-slate-400">
        <div className="h-8 w-8 mx-auto mb-2 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm">Loading map tiles...</p>
      </div>
    </div>
  );
}
