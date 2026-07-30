import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BatePrimeiro',
    short_name: 'BatePrimeiro',
    description: 'Quem bater primeiro responde.',
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
        src: '/icons/bateprimeiro-16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/icons/bateprimeiro-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icons/bateprimeiro-48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icons/bateprimeiro-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icons/bateprimeiro-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/bateprimeiro-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
