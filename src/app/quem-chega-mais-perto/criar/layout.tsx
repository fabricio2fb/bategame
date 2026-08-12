import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function QuemChegaMaisPertoCriarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      {children}
    </>
  );
}
