import type { Metadata } from 'next';
import { SocketBootstrap } from '@/components/SocketBootstrap';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function BateOTempoEntrarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      {children}
    </>
  );
}
