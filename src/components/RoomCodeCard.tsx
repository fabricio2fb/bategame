'use client';

import React, { useCallback, useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { getRoomPath } from '@/lib/room-code';

interface RoomCodeCardProps {
  code: string;
}

export const RoomCodeCard: React.FC<RoomCodeCardProps> = ({ code }) => {
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
        await navigator.share({ title: `Partida`, url: `${window.location.origin}${getRoomPath(code)}` });
      } catch {}
    } else {
      handleCopyLink();
    }
  }, [code, handleCopyLink]);

  return (
    <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Código da sala</h2>
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.2em] text-[#3B82F6] select-all">{code}</div>
        <p className="text-xs text-[#64748B] mt-1">Envie este código para seus amigos entrarem.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={handleCopyCode}
          className="flex-1 py-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          {copiedCode ? <><Check className="w-3.5 h-3.5 text-[#22C55E]" /><span>Copiado</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copiar código</span></>}
        </button>
        <button onClick={handleCopyLink}
          className="flex-1 py-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
          {copiedLink ? <><Check className="w-3.5 h-3.5 text-[#22C55E]" /><span>Copiado</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copiar link</span></>}
        </button>
        <button onClick={handleShare}
          className="p-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] rounded-lg transition-colors cursor-pointer" aria-label="Compartilhar">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
