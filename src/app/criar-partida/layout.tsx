import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function CriarPartidaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SocketBootstrap />
      {children}
    </>
  );
}
