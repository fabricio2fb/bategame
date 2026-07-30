'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { PageHeader } from '@/components/PageHeader';
import { RoomCard } from '@/components/RoomCard';
import { RoomCardSkeleton } from '@/components/RoomCardSkeleton';
import { EmptyRoomsState } from '@/components/EmptyRoomsState';
import { SidebarPanels } from '@/components/SidebarPanels';
import { MobileActionBar } from '@/components/MobileActionBar';
import { Footer } from '@/components/Footer';
import { getSocket } from '@/lib/socket';
import { PublicRoom } from '@/lib/types';
import { getRoomPath } from '@/lib/room-code';
import { useSocketRoom } from '@/hooks/useSocketRoom';

export default function Home() {
  const router = useRouter();
  const { joinRoom } = useSocketRoom();
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    let sock;
    try {
      sock = getSocket();
    } catch {
      setLoading(false);
      return;
    }

    const handleRoomsList = (response: any) => {
      if (response.success) {
        setRooms(response.rooms || []);
        const total = (response.rooms || []).reduce((acc: number, r: PublicRoom) => acc + r.playerCount, 0);
        setOnlineCount(total);
      }
      setLoading(false);
    };

    const handleRoomsUpdated = (data: PublicRoom[]) => {
      setRooms(data || []);
      const total = (data || []).reduce((acc: number, r: PublicRoom) => acc + r.playerCount, 0);
      setOnlineCount(total);
      setLoading(false);
    };

    sock.on('rooms:updated', handleRoomsUpdated);

    // Initial request
    if (sock.connected) {
      sock.emit('rooms:list', {}, handleRoomsList);
    } else {
      sock.on('connect', () => {
        sock.emit('rooms:list', {}, handleRoomsList);
      });
    }

    return () => {
      sock.off('rooms:updated', handleRoomsUpdated);
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    let sock;
    try {
      sock = getSocket();
    } catch {
      setLoading(false);
      return;
    }
    sock.emit('rooms:list', {}, (response: any) => {
      if (response.success) {
        setRooms(response.rooms || []);
      }
      setLoading(false);
    });
  };

  const handleCardJoin = (room: PublicRoom) => {
    router.push(getRoomPath(room.code));
  };

  const handleJoinByCodeQuick = async (code: string, playerName: string) => {
    const result = await joinRoom(code, playerName);
    if (result.success) {
      router.push(getRoomPath(code));
    }
    return result;
  };

  const visibleRooms = rooms.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
      {/* Top Application Bar */}
      <AppHeader
        onOpenCreate={() => router.push('/criar-partida')}
        onOpenJoin={() => router.push('/entrar')}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 flex-1">
        {/* Page Title & Status */}
        <PageHeader onlineCount={onlineCount} onRefresh={handleRefresh} />

        {/* Feed & Sidebar 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Main Feed Column (8 cols desktop) */}
          <div className="lg:col-span-8 space-y-3.5">
            {loading ? (
              <>
                <RoomCardSkeleton />
                <RoomCardSkeleton />
                <RoomCardSkeleton />
              </>
            ) : visibleRooms.length > 0 ? (
              <>
                {visibleRooms.map((room) => (
                  <RoomCard key={room.code} room={room} onJoin={handleCardJoin} />
                ))}

                {/* Load More Button */}
                {visibleCount < rooms.length && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 4)}
                      className="px-6 py-3 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] font-medium text-xs sm:text-sm rounded-full transition-all cursor-pointer"
                    >
                      Carregar mais partidas ({rooms.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyRoomsState onOpenCreate={() => router.push('/criar-partida')} />
            )}
          </div>

          {/* Right Sidebar Column (4 cols desktop) */}
          <div className="hidden lg:block lg:col-span-4">
            <SidebarPanels
              onOpenCreate={() => router.push('/criar-partida')}
              onJoinCode={handleJoinByCodeQuick}
            />
          </div>
        </div>
      </main>

      {/* Footer component */}
      <Footer />

      {/* Mobile Sticky Bottom Action Bar */}
      <MobileActionBar
        onOpenCreate={() => router.push('/criar-partida')}
        onOpenJoin={() => router.push('/entrar')}
      />
    </div>
  );
}
