'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StartCountdownProps {
  count: number;
}

export const StartCountdown: React.FC<StartCountdownProps> = ({ count }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
      role="alert" aria-live="assertive"
    >
      <motion.div
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="text-8xl sm:text-9xl font-bold text-white"
      >
        {count}
      </motion.div>
    </motion.div>
  );
};
