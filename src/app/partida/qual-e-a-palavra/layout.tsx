import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: 'Qual e a Palavra',
  },
  icons: {
    icon: [{ url: '/partida/qual-e-a-palavra/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function QualEAPalavraPartidaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="Qual e a Palavra" icon="/partida/qual-e-a-palavra/icon.png" />
      {children}
    </>
  );
}
