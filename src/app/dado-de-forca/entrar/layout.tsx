import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function DadoDeForcaEntrarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      {children}
    </>
  );
}
