import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/sala/',
        '/partida/',
        '/api/',
        '/entrar',
        '/qual-e-a-palavra/entrar',
        '/bate-o-tempo/entrar',
        '/quem-chega-mais-perto/entrar',
        '/tres-letras/entrar',
        '/criar-quiz',
        '/partida-sofa',
        '/partida1',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
