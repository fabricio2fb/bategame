import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  src?: string;
  text?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', src = '/tempale-mark.svg', text = 'Tempale' }) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center">
        <Image
          src={src}
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
      <span className="font-bold text-lg leading-none text-[#0F172A] tracking-tight">
        {text}
      </span>
    </div>
  );
};
