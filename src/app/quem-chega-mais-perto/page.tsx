import type { Metadata } from 'next';
import { GenericGameHomePage } from '@/components/GenericGameHomePage';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbJsonLd, buildGameJsonLd, buildGameMetadata } from '@/lib/seo';

export const metadata: Metadata = buildGameMetadata('quem-chega-mais-perto');

export default function QuemChegaMaisPertoPage() {
  return (
    <>
      <JsonLd data={[buildGameJsonLd('quem-chega-mais-perto'), buildBreadcrumbJsonLd('quem-chega-mais-perto')]} />
      <GenericGameHomePage gameType="quem-chega-mais-perto" />
    </>
  );
}
