import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: '3 Letras',
  },
  description: 'Crie respostas com tres letras sorteadas e vote com a galera.',
  icons: {
    icon: [{ url: '/tres-letras/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function TresLetrasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="3 Letras" icon="/tres-letras/icon.png" />
      {children}
    </>
  );
}
