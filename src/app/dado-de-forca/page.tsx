import type { Metadata } from 'next';
import { GenericGameHomePage } from '@/components/GenericGameHomePage';

export const metadata: Metadata = {
  title: {
    absolute: 'Dado de Forca',
  },
  description: 'Crie uma sala, carregue a forca e avance o dado pelo tabuleiro.',
};

export default function DadoDeForcaPage() {
  return <GenericGameHomePage gameType="dado-de-forca" />;
}
