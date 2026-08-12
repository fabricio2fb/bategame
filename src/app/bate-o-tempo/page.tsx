import type { Metadata } from 'next';
import { GenericGameHomePage } from '@/components/GenericGameHomePage';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbJsonLd, buildGameJsonLd, buildGameMetadata } from '@/lib/seo';

export const metadata: Metadata = buildGameMetadata('bate-o-tempo');

export default function BateOTempoPage() {
  return (
    <>
      <JsonLd data={[buildGameJsonLd('bate-o-tempo'), buildBreadcrumbJsonLd('bate-o-tempo')]} />
      <GenericGameHomePage gameType="bate-o-tempo" />
    </>
  );
}
