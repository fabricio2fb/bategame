import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: '3 Letras',
  },
  icons: {
    icon: [{ url: '/partida/tres-letras/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function TresLetrasPartidaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="3 Letras" icon="/partida/tres-letras/icon.png" />
      {children}
    </>
  );
}
