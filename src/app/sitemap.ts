import type { MetadataRoute } from 'next';
import { getPublishedBlogPosts } from '@/lib/blog';
import { absoluteUrl, buildSitemap } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const blogEntries = getPublishedBlogPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.date ? new Date(`${post.date}T12:00:00`) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...buildSitemap(), ...blogEntries];
}
