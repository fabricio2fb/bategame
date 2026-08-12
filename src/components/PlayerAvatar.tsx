import React from 'react';
import { DEFAULT_AVATAR } from '@/lib/player-avatar';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
  textClassName?: string;
}

export function PlayerAvatar({ name, avatarUrl, className = 'h-9 w-9', textClassName = 'text-xs' }: PlayerAvatarProps) {
  const imageUrl = avatarUrl || DEFAULT_AVATAR;

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-white font-bold text-white shadow-sm ${className}`}
    >
      <img src={imageUrl} alt="" className="h-full w-full object-cover" draggable={false} />
    </span>
  );
}
