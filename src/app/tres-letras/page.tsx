import type { Metadata } from 'next';
import { GenericGameHomePage } from '@/components/GenericGameHomePage';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbJsonLd, buildGameJsonLd, buildGameMetadata } from '@/lib/seo';

export const metadata: Metadata = buildGameMetadata('tres-letras');

export default function TresLetrasPage() {
  return (
    <>
      <JsonLd data={[buildGameJsonLd('tres-letras'), buildBreadcrumbJsonLd('tres-letras')]} />
      <GenericGameHomePage gameType="tres-letras" />
    </>
  );
}
