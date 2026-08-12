import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: 'Bate o Tempo',
  },
  description: 'Crie uma sala e dispute quem para o cronometro mais perto do tempo alvo.',
  icons: {
    icon: [{ url: '/bate-o-tempo/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function BateOTempoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="Bate o Tempo" icon="/bate-o-tempo/icon.png" />
      {children}
    </>
  );
}
