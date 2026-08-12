import type { Metadata } from 'next';
import { RouteHeadIdentity } from '@/components/RouteHeadIdentity';
import { SocketBootstrap } from '@/components/SocketBootstrap';
import { buildGameMetadata } from '@/lib/seo';

export const metadata: Metadata = buildGameMetadata('bateprimeiro');

export default function BatePrimeiroLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <RouteHeadIdentity title="BatePrimeiro" icon="/bateprimeiro/icon.png" />
      <SocketBootstrap />
      {children}
    </>
  );
}
