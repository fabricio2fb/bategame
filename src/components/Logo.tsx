import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center">
        <img
          src="/LOGO-BATEPRIMEIRO.png"
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
      <span className="font-bold text-lg text-[#0F172A] tracking-tight">
        BatePrimeiro
      </span>
    </div>
  );
};
