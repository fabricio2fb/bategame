import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';

export const metadata: Metadata = {
  title: {
    absolute: 'Qual e a Palavra',
  },
  description: 'Crie uma sala e dispute quem decifra as letras embaralhadas primeiro.',
  icons: {
    icon: [{ url: '/qual-e-a-palavra/icon.png', sizes: 'any', type: 'image/png' }],
  },
};

export default function QualEAPalavraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteHeadIdentity title="Qual e a Palavra" icon="/qual-e-a-palavra/icon.png" />
      {children}
    </>
  );
}
