import { SocketBootstrap } from '@/components/SocketBootstrap';

export default function EntrarLayout({
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
