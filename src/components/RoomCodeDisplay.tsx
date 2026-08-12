'use client';

import React, { useCallback, useState } from 'react';
import { Copy, Check, Share2, Link } from 'lucide-react';
import { getRoomPath } from '@/lib/room-code';

interface RoomCodeDisplayProps {
  code: string;
  accentColor?: string;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({ code, accentColor = '#3B82F6' }) => {
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
        <div className="absolute inset-0 rounded-2xl blur-xl" style={{ backgroundColor: `${accentColor}14` }} />
        <div
          className="relative rounded-2xl border-2 bg-white/90 px-8 py-6 text-center shadow-lg backdrop-blur-sm"
          style={{ borderColor: `${accentColor}33` }}
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#64748B]">Codigo da sala</p>
          <div
            className="select-all font-mono text-5xl font-bold leading-none tracking-[0.25em] sm:text-6xl"
            style={{ color: accentColor }}
          >
            {code}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1]/60 bg-white/80 px-4 py-2 text-xs font-semibold text-[#0F172A] transition-all hover:bg-white"
          style={{ borderColor: copiedCode ? `${accentColor}55` : undefined }}
        >
          {copiedCode ? <><Check className="h-3.5 w-3.5 text-[#22C55E]" /><span>Copiado</span></> : <><Copy className="h-3.5 w-3.5" /><span>Copiar codigo</span></>}
        </button>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#CBD5E1]/60 bg-white/80 px-4 py-2 text-xs font-semibold text-[#0F172A] transition-all hover:bg-white"
          style={{ borderColor: copiedLink ? `${accentColor}55` : undefined }}
        >
          {copiedLink ? <><Check className="h-3.5 w-3.5 text-[#22C55E]" /><span>Copiado</span></> : <><Link className="h-3.5 w-3.5" /><span>Copiar link</span></>}
        </button>
        <button
          onClick={handleShare}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#CBD5E1]/60 bg-white/80 text-[#0F172A] transition-all hover:bg-white"
          aria-label="Compartilhar"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
