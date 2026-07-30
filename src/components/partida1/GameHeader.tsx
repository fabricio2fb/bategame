'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, LogOut, Menu, Settings, Users, Volume2, VolumeX, Wifi, X, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface GameHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  category: string;
  timer: number;
  soundOn: boolean;
  isHost?: boolean;
  players?: Array<{ id: string; name: string; score: number }>;
  settingsSummary?: string;
  compact?: boolean;
  confirmLeaveOnExit?: boolean;
  leaveDescription?: string;
  onToggleSound: () => void;
  onLeave?: () => void;
  onViewPlayers?: () => void;
  onViewSettings?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  questionNumber,
  totalQuestions,
  category,
  timer,
  soundOn,
  isHost = false,
  compact = false,
  confirmLeaveOnExit = true,
  leaveDescription,
  onToggleSound,
  onLeave,
  onViewPlayers,
  onViewSettings,
}) => {
  const progress = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousOverflowRef = useRef('');

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenuOpen(false);
    document.body.style.overflow = previousOverflowRef.current;
    if (restoreFocus) {
      window.setTimeout(() => menuButtonRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflowRef.current;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMenu, menuOpen]);

  const openHowToPlay = () => {
    closeMenu(false);
    window.open('/como-jogar', '_blank', 'noopener,noreferrer');
  };

  const menuItems = (
    <>
      <button onClick={() => { closeMenu(false); if (confirmLeaveOnExit) setConfirmLeave(true); else onLeave?.(); }}
        className="w-full min-h-12 rounded-xl px-3 py-2 text-left text-sm font-bold text-[#FCA5A5] hover:bg-white/10 flex items-center gap-3 cursor-pointer">
        <LogOut className="h-4 w-4" />
        Sair da partida
      </button>
      <button onClick={() => { closeMenu(false); onViewPlayers?.(); }}
        className="w-full min-h-12 rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/80 hover:bg-white/10 flex items-center gap-3 cursor-pointer">
        <Users className="h-4 w-4" />
        Ver jogadores
      </button>
      <button onClick={() => { closeMenu(false); onViewSettings?.(); }}
        className="w-full min-h-12 rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/80 hover:bg-white/10 flex items-center gap-3 cursor-pointer">
        <Settings className="h-4 w-4" />
        Ver configuracoes da sala
      </button>
      <button onClick={() => { onToggleSound(); closeMenu(false); }}
        className="w-full min-h-12 rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/80 hover:bg-white/10 flex items-center gap-3 cursor-pointer">
        {soundOn ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {soundOn ? 'Desativar som' : 'Ativar som'}
      </button>
      <button onClick={openHowToPlay}
        className="w-full min-h-12 rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/80 hover:bg-white/10 flex items-center gap-3 cursor-pointer">
        <BookOpen className="h-4 w-4" />
        Como jogar
      </button>
    </>
  );

  return (
    <header className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className={`max-w-7xl mx-auto ${compact ? 'h-10 px-2 sm:h-11 sm:px-3' : 'h-12 px-4'} flex items-center justify-between gap-3 sm:gap-4`}>
        <div className="flex items-center gap-3 min-w-0">
          <Logo className="[&>div]:h-7 [&>div]:w-7 [&>span]:hidden md:[&>span]:inline [&>span]:text-sm [&>span]:text-white" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white/70 whitespace-nowrap">
              Pergunta <span className="text-white">{questionNumber}</span>/{totalQuestions}
            </span>
            <div className="hidden sm:block w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#3B82F6] rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-medium text-[#93C5FD] bg-[#3B82F6]/15 px-2 py-0.5 rounded-full">
            {category}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full">
            <Zap className={`w-3 h-3 ${timer <= 5 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`} />
            <span className={`text-xs font-bold tabular-nums ${timer <= 5 ? 'text-[#EF4444]' : 'text-white/80'}`}>
              {timer}s
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full">
            <Wifi className="w-3 h-3 text-[#22C55E]" />
            <span className="text-[10px] text-white/50">12ms</span>
          </div>
          <button onClick={onToggleSound}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer">
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div ref={menuRef}>
            <button
              ref={menuButtonRef}
              onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)}
              aria-label="Abrir menu da partida"
              aria-controls="game-menu"
              aria-expanded={menuOpen}
              className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="sm:hidden h-0.5 bg-white/5">
        <motion.div className="h-full bg-[#3B82F6]" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu da partida"
            onClick={() => closeMenu()}
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px] cursor-default"
          />
          <div
            id="game-menu"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="fixed right-0 top-0 z-[80] h-[100dvh] w-[85vw] max-w-sm border-l border-white/10 bg-[#0F172A] p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-2xl pointer-events-auto sm:right-4 sm:top-14 sm:h-auto sm:w-72 sm:rounded-2xl sm:border sm:p-2 sm:pt-2 sm:bg-[#0F172A]/95 sm:backdrop-blur-xl"
          >
            <div className="mb-3 flex min-h-11 items-center justify-between gap-3 border-b border-white/10 pb-3 sm:hidden">
              <span className="text-sm font-bold text-white/80">Menu</span>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Fechar menu"
                onClick={() => closeMenu()}
                className="grid min-h-11 min-w-11 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 cursor-pointer pointer-events-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {menuItems}
          </div>
        </>
      )}

      {confirmLeave && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F172A]">Tem certeza de que deseja sair da partida?</h2>
            <p className="mt-2 text-sm text-[#64748B]">
              {leaveDescription || (isHost
                ? 'A lideranca sera transferida para outro jogador conectado. Se nao houver outro jogador, a sala sera encerrada.'
                : 'Voce sera removido da sala e voltara para a pagina inicial.')}
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmLeave(false)}
                className="flex-1 rounded-xl bg-[#F1F5F9] py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-[#CBD5E1] cursor-pointer">
                Cancelar
              </button>
              <button onClick={() => { setConfirmLeave(false); onLeave?.(); }}
                className="flex-1 rounded-xl bg-[#EF4444] py-2.5 text-sm font-semibold text-white hover:bg-[#DC2626] cursor-pointer">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
