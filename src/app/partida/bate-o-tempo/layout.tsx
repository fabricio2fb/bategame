import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: 'Bate o Tempo',
  },
  icons: {
    icon: [{ url: '/partida/bate-o-tempo/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function BateOTempoPartidaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="Bate o Tempo" icon="/partida/bate-o-tempo/icon.png" />
      {children}
    </>
  );
}
