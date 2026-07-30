import React from 'react';

export const RoomCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/90 border-2 border-black/15 rounded-2xl p-5 animate-pulse flex flex-col sm:flex-row justify-between gap-4">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9]" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-[#F1F5F9] rounded w-1/3" />
            <div className="h-3 bg-[#F1F5F9] rounded w-1/4" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-3 bg-[#F1F5F9] rounded w-16" />
          <div className="h-3 bg-[#F1F5F9] rounded w-24" />
          <div className="h-3 bg-[#F1F5F9] rounded w-20" />
        </div>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
        <div className="h-5 bg-[#F1F5F9] rounded-full w-28" />
        <div className="h-9 bg-[#F1F5F9] rounded-lg w-20" />
      </div>
    </div>
  );
};
