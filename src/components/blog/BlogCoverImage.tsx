'use client';

import { useState } from 'react';

interface BlogCoverImageProps {
  src?: string;
  alt: string;
  color: string;
}

function CoverPlaceholder({ color }: { color: string }) {
  return (
    <div
      className="h-full w-full"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color}E6 0%, rgba(34,197,94,0.72) 48%, rgba(168,85,247,0.62) 100%), radial-gradient(circle at 72% 22%, rgba(255,255,255,0.42), transparent 15rem), radial-gradient(circle at 18% 82%, rgba(255,255,255,0.24), transparent 18rem)`,
      }}
    />
  );
}

export function BlogCoverImage({ src, alt, color }: BlogCoverImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative h-64 overflow-hidden rounded-[2rem] border border-white/70 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:h-80">
      {(!showImage || !loaded) && <CoverPlaceholder color={color} />}
      {showImage && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
