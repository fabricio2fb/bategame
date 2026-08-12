import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: 'Dado de Forca',
  },
  description: 'Crie uma sala e dispute avancos de forca no tabuleiro.',
  icons: {
    icon: [{ url: '/dado-de-forca/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function DadoDeForcaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="Dado de Forca" icon="/dado-de-forca/icon.png" />
      {children}
    </>
  );
}
