'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  id: number;
  text: string;
  timestamp: number;
}

interface LobbyActivityFeedProps {
  playersCount: number;
}

export const LobbyActivityFeed: React.FC<LobbyActivityFeedProps> = ({ playersCount }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    setActivities(prev => {
      const filtered = prev.filter(a => now - a.timestamp < 15000);
      return filtered;
    });
  }, [playersCount]);

  if (activities.length === 0) return null;

  return (
    <div className="bg-white/40 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider shrink-0">Atividade</span>
        <div className="h-3 w-px bg-white/10" />
        <AnimatePresence mode="popLayout">
          {activities.slice(-3).reverse().map(a => (
            <motion.span key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] text-white/70 truncate">
              {a.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
