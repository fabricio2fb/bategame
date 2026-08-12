import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: 'Quem Chega Mais Perto',
  },
  icons: {
    icon: [{ url: '/partida/quem-chega-mais-perto/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function QuemChegaMaisPertoPartidaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="Quem Chega Mais Perto" icon="/partida/quem-chega-mais-perto/icon.png" />
      {children}
    </>
  );
}
