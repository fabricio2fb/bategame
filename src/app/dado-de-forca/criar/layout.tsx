import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function DadoDeForcaCriarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      {children}
    </>
  );
}
