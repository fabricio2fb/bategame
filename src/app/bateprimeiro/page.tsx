'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Pencil, X } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { AppHeader } from '@/components/AppHeader';
import { MobileActionBar } from '@/components/MobileActionBar';
import { Footer } from '@/components/Footer';
import { PublicRoomsModal } from '@/components/PublicRoomsModal';
import { getRoomPath, isValidRoomCode, sanitizeRoomCodeInput } from '@/lib/room-code';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { GAME_REGISTRY } from '@/lib/game-registry';
import { DEFAULT_AVATAR, PRESET_AVATARS, readAvatarFile, saveStoredAvatarUrl } from '@/lib/player-avatar';
import { buildBreadcrumbJsonLd, buildGameJsonLd, GAME_SEO } from '@/lib/seo';

const game = GAME_REGISTRY.bateprimeiro;
const seo = GAME_SEO.bateprimeiro;

export default function Home() {
  const router = useRouter();
  const { joinRoom } = useSocketRoom();
  const [playerName, setPlayerName] = useState('');
  const [quickRoomCode, setQuickRoomCode] = useState('');
  const [heroError, setHeroError] = useState<string | null>(null);
  const [isJoiningHero, setIsJoiningHero] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const normalizedPlayerName = playerName.trim().replace(/\s+/g, ' ');
  const canHeroJoin = normalizedPlayerName.length >= 2 && isValidRoomCode(quickRoomCode) && !isJoiningHero;

  const handleHeroJoin = async () => {
    if (isJoiningHero) return;

    setHeroError(null);

    if (normalizedPlayerName.length < 2) {
      setHeroError('Informe seu nome para entrar na sala.');
      return;
    }

    if (!isValidRoomCode(quickRoomCode)) {
      setHeroError('Digite um codigo de sala valido com 5 caracteres.');
      return;
    }

    const code = quickRoomCode;
    setIsJoiningHero(true);
    const result = await joinRoom(code, playerName, avatarPreview || DEFAULT_AVATAR);
    setIsJoiningHero(false);

    if (!result.success) {
      setHeroError(result.error || 'Nao foi possivel entrar na sala.');
      return;
    }

    router.push(getRoomPath(code));
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const avatarUrl = await readAvatarFile(file);
      setAvatarPreview(avatarUrl);
      saveStoredAvatarUrl(avatarUrl);
      setIsAvatarModalOpen(false);
    } catch {
      setHeroError('Nao foi possivel carregar esta imagem.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
      <JsonLd data={[buildGameJsonLd('bateprimeiro'), buildBreadcrumbJsonLd('bateprimeiro')]} />
      {/* Top Application Bar */}
      <AppHeader
        lobbyHref="/bateprimeiro"
        logoSrc={game.icon}
        logoText={game.title}
        onOpenCreate={() => router.push('/criar-partida')}
        onOpenJoin={() => router.push('/entrar')}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 flex-1">
        <section
          className="grid w-full min-w-0 grid-cols-1 items-stretch overflow-hidden rounded-[3rem] border shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:grid-cols-2"
          style={{
            backgroundColor: 'rgba(248,250,252,0.42)',
            borderColor: 'rgba(255,255,255,0.72)',
          }}
        >
          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:min-h-[620px] lg:p-10">
            <div className="mx-auto flex w-full max-w-full flex-col items-center sm:max-w-md">
              <div className="relative">
                <div
                  className="grid h-44 w-44 place-items-center rounded-full border-[10px] shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur sm:h-56 sm:w-56"
                  style={{ borderColor: 'rgba(255,255,255,0.72)', backgroundColor: 'rgba(255,255,255,0.38)' }}
                >
                  <div
                    className="grid h-32 w-32 place-items-center overflow-hidden rounded-full border border-white/70 text-5xl font-black sm:h-40 sm:w-40 sm:text-6xl"
                    style={{
                      background:
                        'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.95), rgba(248,250,252,0.58) 38%, rgba(59,130,246,0.20) 100%)',
                      color: game.accentColor,
                    }}
                  >
                    <Image
                      src={avatarPreview || DEFAULT_AVATAR}
                      alt={avatarPreview ? 'Avatar escolhido' : 'Avatar azul'}
                      width={160}
                      height={160}
                      unoptimized={Boolean(avatarPreview)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-[#0F172A] text-white shadow-[0_10px_24px_rgba(15,23,42,0.25)] transition-transform hover:-translate-y-0.5"
                  aria-label="Trocar imagem do avatar"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-8 text-center">
                <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
                  {seo.title}
                </h1>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-[#475569]">
                  {seo.description}
                </p>
              </div>

              <label className="mt-6 block w-full">
                <span className="sr-only">Nome do jogador</span>
                <input
                  value={playerName}
                  onChange={(event) => {
                    setPlayerName(event.target.value);
                    setHeroError(null);
                  }}
                  maxLength={20}
                  placeholder="Nome do jogador"
                  className="w-full rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-5 py-4 text-center text-lg font-black text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3B82F6] sm:text-xl"
                />
              </label>

              <label className="mt-4 block w-full">
                <span className="sr-only">Codigo da sala</span>
                <input
                  value={quickRoomCode}
                  onChange={(event) => {
                    setQuickRoomCode(sanitizeRoomCodeInput(event.target.value));
                    setHeroError(null);
                  }}
                  maxLength={5}
                  placeholder="EX: B7K9P"
                  className="w-full rounded-2xl border-2 border-[#CBD5E1] bg-white px-5 py-4 text-center font-mono text-xl font-black uppercase tracking-[0.25em] text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3B82F6]"
                />
              </label>

              <button
                type="button"
                onClick={handleHeroJoin}
                disabled={!canHeroJoin}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border-2 border-[#CBD5E1] bg-white px-5 py-4 text-base font-black text-[#0F172A] transition-colors hover:border-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isJoiningHero ? 'Entrando...' : 'Entrar na sala'}
              </button>

              {heroError && (
                <p className="mt-4 w-full rounded-2xl bg-[#FEF2F2] px-4 py-3 text-center text-sm font-semibold text-[#B91C1C]">
                  {heroError}
                </p>
              )}

              <div className="mt-5 grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/criar-partida')}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-4 text-base font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.2)] transition-opacity"
                  style={{ backgroundColor: game.accentColor }}
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoomsModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-5 py-4 text-base font-black text-[#0F172A] transition-colors hover:border-[#3B82F6] hover:bg-white"
                >
                  Salas
                </button>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 p-4 sm:p-5 lg:min-h-[620px]">
            <div className="relative min-h-[420px] w-full min-w-0 overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/20 shadow-[0_22px_60px_rgba(15,23,42,0.18)] lg:min-h-full">
              <Image
                src={game.exampleImage}
                alt={`Exemplo visual do jogo ${game.title}`}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="absolute inset-0 h-full w-full rounded-[2.5rem] object-cover"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer component */}
      <Footer
        lobbyHref="/bateprimeiro"
        logoSrc={game.icon}
        logoText={game.title}
        tagline="Quem bater primeiro responde."
        copyrightName={game.title}
      />

      {/* Mobile Sticky Bottom Action Bar */}
      <MobileActionBar
        onOpenCreate={() => router.push('/criar-partida')}
        onOpenJoin={() => router.push('/entrar')}
      />

      <PublicRoomsModal
        open={isRoomsModalOpen}
        onClose={() => setIsRoomsModalOpen(false)}
        gameType="bateprimeiro"
        title={game.title}
        accentColor={game.accentColor}
        onJoinRoom={(room) => {
          setIsRoomsModalOpen(false);
          router.push(getRoomPath(room.code));
        }}
      />

      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0F172A]/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/60 bg-white/88 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#0F172A]">Trocar avatar</h2>
                <p className="mt-1 text-sm font-semibold text-[#64748B]">Escolha um avatar ou envie uma imagem.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#CBD5E1] bg-white text-[#0F172A]"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.src}
                  type="button"
                  onClick={() => {
                    setAvatarPreview(avatar.src);
                    saveStoredAvatarUrl(avatar.src);
                    setIsAvatarModalOpen(false);
                  }}
                  className="group rounded-2xl border-2 border-[#CBD5E1] bg-white/75 p-2 transition-colors hover:border-[#3B82F6]"
                >
                  <span className="block overflow-hidden rounded-xl bg-[#F8FAFC]">
                    <Image src={avatar.src} alt={`Avatar ${avatar.name}`} width={112} height={112} className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                  </span>
                  <span className="mt-2 block text-xs font-black text-[#0F172A]">{avatar.name}</span>
                </button>
              ))}
            </div>

            <label className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-white/70 px-5 py-8 text-center transition-colors hover:border-[#3B82F6]">
              <span className="block text-sm font-black text-[#0F172A]">Selecionar imagem</span>
              <span className="mt-1 block text-xs font-semibold text-[#64748B]">PNG, JPG ou WEBP</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="sr-only" />
            </label>

            {avatarPreview && (
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview(null);
                  saveStoredAvatarUrl(DEFAULT_AVATAR);
                  setIsAvatarModalOpen(false);
                }}
                className="mt-3 w-full rounded-2xl border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-black text-[#0F172A]"
              >
                Usar avatar padrao
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
