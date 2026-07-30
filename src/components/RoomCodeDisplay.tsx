'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Share2, Link } from 'lucide-react';
import { getRoomPath } from '@/lib/room-code';

interface RoomCodeDisplayProps {
  code: string;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({ code }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  }, [code]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${getRoomPath(code)}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  }, [code]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Partida', url: `${window.location.origin}${getRoomPath(code)}` });
      } catch {}
    } else {
      handleCopyLink();
    }
  }, [code, handleCopyLink]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-[#3B82F6]/5 rounded-2xl blur-xl" />
        <div className="relative bg-white/90 backdrop-blur-sm border-2 border-[#3B82F6]/20 rounded-2xl px-8 py-6 text-center shadow-lg">
          <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-2">Código da sala</p>
          <div className="text-5xl sm:text-6xl font-mono font-bold tracking-[0.25em] text-[#3B82F6] select-all leading-none">
            {code}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 hover:bg-white text-[#0F172A] text-xs font-semibold rounded-xl border border-[#CBD5E1]/60 hover:border-[#3B82F6]/30 transition-all cursor-pointer">
          {copiedCode ? <><Check className="w-3.5 h-3.5 text-[#22C55E]" /><span>Copiado</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copiar código</span></>}
        </button>
        <button onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 hover:bg-white text-[#0F172A] text-xs font-semibold rounded-xl border border-[#CBD5E1]/60 hover:border-[#3B82F6]/30 transition-all cursor-pointer">
          {copiedLink ? <><Check className="w-3.5 h-3.5 text-[#22C55E]" /><span>Copiado</span></> : <><Link className="w-3.5 h-3.5" /><span>Copiar link</span></>}
        </button>
        <button onClick={handleShare}
          className="inline-flex items-center justify-center w-9 h-9 bg-white/80 hover:bg-white text-[#0F172A] rounded-xl border border-[#CBD5E1]/60 hover:border-[#3B82F6]/30 transition-all cursor-pointer">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
