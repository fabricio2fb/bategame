'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Users, X } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import type { GameType, PublicRoom } from '@/lib/types';

interface PublicRoomsModalProps {
  open: boolean;
  onClose: () => void;
  gameType: GameType;
  title: string;
  accentColor: string;
  onJoinRoom: (room: PublicRoom) => void;
}

type RoomsListResponse = {
  success: boolean;
  rooms?: PublicRoom[];
  error?: string;
};

function roomBelongsToGame(room: PublicRoom, gameType: GameType): boolean {
  const roomGameType = room.gameType || 'bateprimeiro';
  return roomGameType === gameType;
}

function getStatusLabel(room: PublicRoom): string {
  if (room.status === 'lobby') return 'Aguardando jogadores';
  return 'Em andamento';
}

export function PublicRoomsModal({ open, onClose, gameType, title, accentColor, onJoinRoom }: PublicRoomsModalProps) {
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => roomBelongsToGame(room, gameType)),
    [gameType, rooms]
  );

  const fetchRooms = useCallback(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    try {
      const socket = getSocket();
      socket.emit('rooms:list', {}, (response: RoomsListResponse) => {
        setLoading(false);

        if (!response?.success) {
          setError('Nao foi possivel carregar as salas agora.');
          return;
        }

        setRooms(response.rooms || []);
      });
    } catch {
      setLoading(false);
      setError('Conectando ao servidor de salas...');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    fetchRooms();

    try {
      const socket = getSocket();
      const handleRoomsUpdated = (updatedRooms: PublicRoom[]) => {
        setRooms(updatedRooms || []);
        setError(null);
      };

      socket.on('rooms:updated', handleRoomsUpdated);

      return () => {
        socket.off('rooms:updated', handleRoomsUpdated);
      };
    } catch {
      setError('Conectando ao servidor de salas...');
    }
  }, [fetchRooms, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/55 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/65 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.30)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748B]">Salas abertas</p>
            <h2 className="mt-1 text-2xl font-black text-[#0F172A]">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Partidas publicas rolando agora.</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={fetchRooms}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#CBD5E1] bg-white text-[#0F172A] transition-colors hover:border-[#94A3B8]"
              aria-label="Atualizar salas"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#CBD5E1] bg-white text-[#0F172A] transition-colors hover:border-[#94A3B8]"
              aria-label="Fechar salas"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {error && (
            <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm font-bold text-[#92400E]">
              {error}
            </div>
          )}

          {loading && filteredRooms.length === 0 && (
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-8 text-center text-sm font-bold text-[#64748B]">
              Carregando salas...
            </div>
          )}

          {!loading && !error && filteredRooms.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC]/80 px-4 py-10 text-center">
              <p className="text-base font-black text-[#0F172A]">Nenhuma sala aberta agora.</p>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">Crie uma sala para a galera entrar.</p>
            </div>
          )}

          {filteredRooms.length > 0 && (
            <div className="space-y-3">
              {filteredRooms.map((room) => {
                const isFull = room.playerCount >= room.settings.maxPlayers;

                return (
                  <article
                    key={room.code}
                    className="flex flex-col gap-4 rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-[#0F172A]">{room.name}</h3>
                        <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 font-mono text-xs font-black text-[#475569]">
                          {room.code}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#64748B]">
                        Host: <span className="text-[#0F172A]">{room.hostName}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#64748B]">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1">
                          <Users className="h-3.5 w-3.5" />
                          {room.playerCount}/{room.settings.maxPlayers} jogadores
                        </span>
                        <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1">
                          {getStatusLabel(room)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onJoinRoom(room)}
                      disabled={isFull}
                      className="inline-flex shrink-0 items-center justify-center rounded-2xl px-5 py-3 text-sm font-black text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)] transition-opacity disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#64748B]"
                      style={{ backgroundColor: isFull ? undefined : accentColor }}
                    >
                      {isFull ? 'Sala cheia' : 'Entrar'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
