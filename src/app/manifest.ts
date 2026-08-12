import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tempale',
    short_name: 'Tempale',
    description: 'Jogos online multiplayer para jogar com amigos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#3B82F6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icons/tempale-16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/icons/tempale-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icons/tempale-48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icons/tempale-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icons/tempale-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/tempale-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
