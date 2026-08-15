'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const links = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    return {
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    };
  }, [title, url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#22C55E] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(34,197,94,0.28)] transition-transform hover:-translate-y-0.5"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
      <a
        href={links.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-2xl border border-[#CBD5E1] bg-white/70 px-5 py-3 text-sm font-black text-[#0F172A] transition-transform hover:-translate-y-0.5"
      >
        Twitter/X
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-white/70 px-5 py-3 text-sm font-black text-[#0F172A] transition-transform hover:-translate-y-0.5"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copiado' : 'Copiar link'}
      </button>
    </div>
  );
}
