import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function QualEAPalavraCriarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SocketBootstrap />
      {children}
    </>
  );
}
