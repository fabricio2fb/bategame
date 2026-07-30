import React from 'react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';

export const LobbySkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto h-full flex items-center"><Logo /></div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#F1F5F9] rounded w-1/3" />
          <div className="h-4 bg-[#F1F5F9] rounded w-1/4" />
          <div className="h-32 bg-[#F1F5F9] rounded-2xl" />
          <div className="h-20 bg-[#F1F5F9] rounded-2xl" />
          <div className="h-20 bg-[#F1F5F9] rounded-2xl" />
        </div>
      </main>
    </div>
  );
};
