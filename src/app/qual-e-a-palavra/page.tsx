import type { Metadata } from 'next';
import { GenericGameHomePage } from '@/components/GenericGameHomePage';
import { JsonLd } from '@/components/JsonLd';
import { buildBreadcrumbJsonLd, buildGameJsonLd, buildGameMetadata } from '@/lib/seo';

export const metadata: Metadata = buildGameMetadata('qual-e-a-palavra');

export default function QualEAPalavraPage() {
  return (
    <>
      <JsonLd data={[buildGameJsonLd('qual-e-a-palavra'), buildBreadcrumbJsonLd('qual-e-a-palavra')]} />
      <GenericGameHomePage gameType="qual-e-a-palavra" />
    </>
  );
}
