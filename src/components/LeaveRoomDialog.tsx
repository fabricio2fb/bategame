'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface LeaveRoomDialogProps {
  isOpen: boolean;
  isHost: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LeaveRoomDialog: React.FC<LeaveRoomDialogProps> = ({ isOpen, isHost, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-2 border-black/15 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto">
                <LogOut className="w-5 h-5 text-[#EF4444]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Sair da sala</h3>
              <p className="text-sm text-[#64748B]">
                {isHost ? 'Se você sair, a sala será encerrada para todos.' : 'Deseja sair desta sala?'}
              </p>
              <div className="flex gap-2 pt-2">
                <button onClick={onClose}
                  className="flex-1 py-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] text-sm font-semibold rounded-lg transition-colors cursor-pointer">Cancelar</button>
                <button onClick={onConfirm}
                  className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">Sair da sala</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
