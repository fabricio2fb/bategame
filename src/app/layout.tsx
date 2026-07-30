import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SocketBootstrap } from "@/components/SocketBootstrap";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"),
  applicationName: "BatePrimeiro",
  title: {
    default: "BatePrimeiro — Jogo Online de Perguntas e Respostas em Tempo Real",
    template: "%s | BatePrimeiro",
  },
  description: "Quem bater primeiro responde. Jogue BatePrimeiro com seus amigos em partidas rápidas, competitivas e em tempo real no navegador.",
  keywords: ["BatePrimeiro", "jogo quiz", "perguntas e respostas", "game show", "jogo de celular", "tempo real", "buzzer"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/bateprimeiro-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/bateprimeiro-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/bateprimeiro-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/bateprimeiro-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/bateprimeiro-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "BatePrimeiro",
    description: "Quem bater primeiro responde. Jogue BatePrimeiro com seus amigos em tempo real.",
    siteName: "BatePrimeiro",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-bateprimeiro.png",
        width: 1200,
        height: 630,
        alt: "BatePrimeiro - Quem bater primeiro responde.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BatePrimeiro",
    description: "Quem bater primeiro responde.",
    images: ["/og-bateprimeiro.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-[#7C4DFF] selection:text-white">
        <SocketBootstrap />
        {children}
      </body>
    </html>
  );
}
