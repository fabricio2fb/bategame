import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function PartidaSofaLayout({
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
