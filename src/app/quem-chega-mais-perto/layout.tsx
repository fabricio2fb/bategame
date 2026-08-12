import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: 'Quem Chega Mais Perto',
  },
  description: 'Crie uma sala e venca pelo palpite numerico mais preciso.',
  icons: {
    icon: [{ url: '/quem-chega-mais-perto/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function QuemChegaMaisPertoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="Quem Chega Mais Perto" icon="/quem-chega-mais-perto/icon.png" />
      {children}
    </>
  );
}
