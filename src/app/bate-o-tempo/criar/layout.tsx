import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function BateOTempoCriarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      {children}
    </>
  );
}
