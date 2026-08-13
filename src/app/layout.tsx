import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Tempale",
  title: {
    default: "Tempale - Hub de Jogos Online",
    template: "%s | Tempale",
  },
  description: "Escolha jogos online do universo Tempale em um hub central preparado para partidas rapidas com amigos.",
  keywords: ["Tempale", "hub de jogos", "jogos online", "quiz", "perguntas e respostas", "multiplayer"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/tempale-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/tempale-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/tempale-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/tempale-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/tempale-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Tempale - Hub de Jogos Online",
    description: "Escolha jogos online do universo Tempale em um hub central.",
    siteName: "Tempale",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-tempale.png",
        width: 1200,
        height: 630,
        alt: "Tempale - Hub de jogos online.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tempale - Hub de Jogos Online",
    description: "Escolha jogos online do universo Tempale.",
    images: ["/og-tempale.png"],
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
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
