'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CouchGameRuntime } from '@/components/couch/CouchGameRuntime';
import { loadCouchMatchConfig } from '@/lib/couch-match-storage';
import type { CouchStartOptions } from '@/hooks/useCouchGame';

export default function PartidaSofaPage() {
  const router = useRouter();
  const [config, setConfig] = useState<CouchStartOptions | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const storedConfig = loadCouchMatchConfig();
    if (!storedConfig) {
      router.replace('/criar-partida');
      return;
    }

    setConfig(storedConfig);
    setIsLoadingConfig(false);
  }, [router]);

  const handleMissingConfig = useCallback(() => {
    router.replace('/criar-partida');
  }, [router]);

  const handleExit = useCallback(() => {
    router.push('/criar-partida');
  }, [router]);

  return (
    <div
      className="flex h-screen h-[100dvh] min-h-screen min-h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628] text-white"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <main className="min-h-0 w-full flex-1">
        {isLoadingConfig && (
          <div className="grid h-full min-h-[100dvh] place-items-center px-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center shadow-xl backdrop-blur-sm">
              <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-white/50 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-white">Carregando partida local...</p>
            </div>
          </div>
        )}

        {!isLoadingConfig && config && (
          <CouchGameRuntime
            autoStart
            initialOptions={config}
            onMissingConfig={handleMissingConfig}
            onExit={handleExit}
          />
        )}
      </main>
    </div>
  );
}
