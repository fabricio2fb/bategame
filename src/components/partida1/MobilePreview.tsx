'use client';

import React from 'react';

interface MobilePreviewProps {
  children: React.ReactNode;
  active: boolean;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({ children, active }) => {
  if (!active) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="relative w-[375px] h-[812px] bg-[#1E293B] rounded-[48px] shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 0 0 2px #334155, 0 30px 80px rgba(0,0,0,0.5)' }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-[#1E293B] rounded-b-2xl z-50">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#475569]" />
        </div>
        {/* Screen */}
        <div className="w-full h-full overflow-hidden rounded-[44px]">
          <div className="w-full h-full transform scale-[0.96] origin-top-left" style={{ width: 'calc(100% / 0.96)', height: 'calc(100% / 0.96)' }}>
            {children}
          </div>
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-white/20 z-50" />
      </div>
    </div>
  );
};
