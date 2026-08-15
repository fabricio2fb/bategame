import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { HubInfoPage } from '@/components/HubInfoPage';
import { getPublishedBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog | Tempale',
  description: 'Postagens, novidades e bastidores dos jogos do hub Tempale.',
};

const POSTS_PER_PAGE = 10;

interface BlogPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

function getPageHref(page: number) {
  return page === 1 ? '/blog' : `/blog?page=${page}`;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const posts = getPublishedBlogPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const requestedPage = Number(params?.page || '1');
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(Math.trunc(requestedPage), 1), totalPages)
    : 1;
  const pagePosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  const [featured, ...rest] = pagePosts;
  const sidePosts = rest.slice(0, 3);
  const morePosts = rest.slice(3);

  return (
    <HubInfoPage
      eyebrow="Blog"
      title="Postagens sobre jogos, salas e partidas."
      description="Novidades do hub, notas de desenvolvimento e ideias para jogar melhor com a galera."
    >
      <div className="grid items-stretch gap-5 lg:grid-cols-12">
        {featured && <BlogPostCard post={featured} featured />}

        <div className="grid min-w-0 auto-rows-fr gap-4 overflow-visible lg:col-span-5">
          {sidePosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>

      {morePosts.length > 0 && (
        <div className="mt-5 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
          {morePosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginas do blog" className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
            const isCurrent = page === currentPage;
            return (
              <Link
                key={page}
                href={getPageHref(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black transition-all ${
                  isCurrent
                    ? 'border-[#3B82F6] bg-[#3B82F6] text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)]'
                    : 'border-white/72 bg-white/58 text-[#475569] shadow-[0_10px_24px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 hover:text-[#0F172A]'
                }`}
              >
                {page}
              </Link>
            );
          })}
        </nav>
      )}
    </HubInfoPage>
  );
}
