import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock3, HelpCircle, Lightbulb, Link as LinkIcon, Play } from 'lucide-react';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { getAllBlogPosts, getBlogPost, getGameHref, getRelatedPosts, type BlogBlock } from '@/lib/blog';
import { GAME_REGISTRY } from '@/lib/game-registry';
import type { GameType } from '@/lib/types';
import type { ReactNode } from 'react';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const image = post.coverImage || '/og-tempale.png';
  return {
    title: `${post.title} | Tempale`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

function ConversionCta({ gameType }: { gameType: GameType | null }) {
  const game = gameType ? GAME_REGISTRY[gameType] : null;
  const accentColor = game?.accentColor || GAME_REGISTRY.bateprimeiro.accentColor;
  return (
    <aside
      className="my-9 rounded-[2rem] border border-white/72 p-5 shadow-[0_20px_54px_rgba(15,23,42,0.16)] sm:p-6"
      style={{
        backgroundImage: `linear-gradient(135deg, ${accentColor}22 0%, rgba(255,255,255,0.82) 58%, rgba(34,197,94,0.16) 100%)`,
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#64748B]">Teste na pratica</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0F172A]">
            {game ? `Jogue ${game.title} agora` : 'Escolha um jogo no Tempale'}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-[#475569]">
            Crie uma sala, compartilhe o codigo e transforme a ideia do post em partida.
          </p>
        </div>
        <Link
          href={gameType ? getGameHref(gameType) : '/'}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: accentColor }}
        >
          <Play className="h-4 w-4 fill-white" />
          {game ? 'Jogar agora' : 'Ver jogos'}
        </Link>
      </div>
    </aside>
  );
}

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [, label, href] = match;
    parts.push(
      href.startsWith('/') ? (
        <Link key={`${href}-${match.index}`} href={href} className="font-black text-[#2563EB] underline decoration-[#93C5FD] decoration-2 underline-offset-4 hover:text-[#1D4ED8]">
          {label}
        </Link>
      ) : (
        <a key={`${href}-${match.index}`} href={href} className="font-black text-[#2563EB] underline decoration-[#93C5FD] decoration-2 underline-offset-4 hover:text-[#1D4ED8]">
          {label}
        </a>
      ),
    );
    lastIndex = linkPattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : text;
}

function BlogContent({ blocks, relatedGame }: { blocks: BlogBlock[]; relatedGame: GameType | null }) {
  let insertedCta = false;

  return (
    <div className="text-[#334155]">
      {blocks.map((block, index) => {
        const next = (() => {
          if (block.type === 'heading') {
            const Heading = block.level === 2 ? 'h2' : 'h3';
            const sizeClass = block.level === 2 ? 'mt-12 text-3xl' : 'mt-8 text-2xl';
            const isComoJogar = block.level === 2 && block.text.toLowerCase() === 'como jogar';
            return (
              <Heading id={block.id} className={`${sizeClass} scroll-mt-28 font-black tracking-tight text-[#0F172A]`}>
                <a href={`#${block.id}`} className="group inline-flex items-center gap-2">
                  {block.text}
                  <LinkIcon className="h-4 w-4 text-[#94A3B8] opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
                {isComoJogar && null}
              </Heading>
            );
          }

          if (block.type === 'paragraph') {
            return <p className="mt-5 text-lg font-medium leading-8 text-[#334155]">{renderInline(block.text)}</p>;
          }

          if (block.type === 'ol') {
            return (
              <ol className="mt-5 list-decimal space-y-3 pl-6 text-base font-semibold leading-7 text-[#334155] marker:font-black marker:text-[#3B82F6]">
                {block.items.map((item) => <li key={item}>{renderInline(item)}</li>)}
              </ol>
            );
          }

          if (block.type === 'ul') {
            return (
              <ul className="mt-5 list-disc space-y-3 pl-6 text-base font-semibold leading-7 text-[#334155] marker:text-[#3B82F6]">
                {block.items.map((item) => <li key={item}>{renderInline(item)}</li>)}
              </ul>
            );
          }

          if (block.type === 'tip') {
            return (
              <aside className="mt-7 rounded-3xl border border-[#3B82F6]/20 bg-[#EFF6FF]/86 p-5 shadow-[0_16px_36px_rgba(59,130,246,0.12)]">
                <div className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#3B82F6] text-white">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[#2563EB]">Dica</p>
                    <p className="mt-1 text-base font-bold leading-7 text-[#1E3A8A]">{renderInline(block.text)}</p>
                  </div>
                </div>
              </aside>
            );
          }

          return null;
        })();

        const shouldInsertCta =
          !insertedCta &&
          block.type === 'heading' &&
          block.level === 2 &&
          block.text.toLowerCase() !== 'como jogar' &&
          blocks.slice(0, index).some((candidate) => candidate.type === 'heading' && candidate.level === 2 && candidate.text.toLowerCase() === 'como jogar');

        if (shouldInsertCta) {
          insertedCta = true;
          return (
            <div key={`${block.type}-${index}`}>
              <ConversionCta gameType={relatedGame} />
              {next}
            </div>
          );
        }

        return <div key={`${block.type}-${index}`}>{next}</div>;
      })}
      <ConversionCta gameType={relatedGame} />
    </div>
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);
  const showSummary = post.headings.filter((heading) => heading.level === 2).length > 3;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tempale.online';
  const shareUrl = `${siteUrl}/blog/${post.slug}`;

  return (
    <main
      className="min-h-screen text-[#0F172A]"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage:
          `radial-gradient(circle at 12% 8%, ${post.categoryColor}55, transparent 24rem), ` +
          'radial-gradient(circle at 88% 10%, rgba(34,197,94,0.28), transparent 25rem), ' +
          'radial-gradient(circle at 80% 78%, rgba(168,85,247,0.18), transparent 27rem), ' +
          'linear-gradient(135deg, rgba(248,250,252,0.76) 0%, rgba(226,232,240,0.42) 54%, rgba(248,250,252,0.78) 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-[#475569] transition-colors hover:text-[#0F172A]">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao blog
        </Link>

        <header className="pt-8">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-[#64748B]">
            <Link href="/blog" className="hover:text-[#0F172A]">Blog</Link>
            <span>/</span>
            <span style={{ color: post.categoryColor }}>{post.category}</span>
            <span>/</span>
            <span className="max-w-[16rem] truncate text-[#94A3B8] sm:max-w-md">{post.title}</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider text-white" style={{ backgroundColor: post.categoryColor }}>
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#64748B]">
              <Clock3 className="h-4 w-4" />
              {post.readTime}
            </span>
            <span className="text-sm font-bold text-[#64748B]">{post.displayDate}</span>
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-none tracking-tight text-[#0F172A] sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-relaxed text-[#475569]">
            {post.description}
          </p>

          <div className="mt-8">
            <BlogCoverImage src={post.coverImage} alt={`Capa do post ${post.title}`} color={post.categoryColor} />
          </div>
        </header>

        <div className="grid gap-10 pt-10 lg:grid-cols-12">
          <article className="lg:col-span-8">
            <div className="rounded-[2rem] border border-white/72 bg-white/62 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.13)] backdrop-blur-xl sm:p-8">
              <BlogContent blocks={post.blocks} relatedGame={post.relatedGame} />

              {post.faq.length > 0 && (
                <section className="mt-12 border-t border-[#CBD5E1] pt-8">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0F172A] text-white">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">FAQ</h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    {post.faq.map((item) => (
                      <details key={item.question} className="group rounded-2xl border border-[#CBD5E1] bg-white/72 p-5">
                        <summary className="cursor-pointer text-base font-black text-[#0F172A] marker:text-[#3B82F6]">
                          {item.question}
                        </summary>
                        <p className="mt-3 text-sm font-semibold leading-7 text-[#475569]">{item.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className="mt-8 rounded-[2rem] border border-white/72 bg-white/62 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
              <h2 className="text-xl font-black text-[#0F172A]">Compartilhe</h2>
              <div className="mt-4">
                <ShareButtons title={post.title} url={shareUrl} />
              </div>
            </footer>
          </article>

          <aside className="lg:col-span-4">
            {showSummary && (
              <div className="sticky top-6 rounded-[2rem] border border-white/72 bg-white/62 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <h2 className="text-sm font-black uppercase tracking-wider text-[#64748B]">Sumario</h2>
                <nav className="mt-4 space-y-2">
                  {post.headings.filter((heading) => heading.level === 2).map((heading) => (
                    <a key={heading.id} href={`#${heading.id}`} className="block rounded-2xl px-3 py-2 text-sm font-bold text-[#475569] transition-colors hover:bg-white/70 hover:text-[#0F172A]">
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#64748B]">Continue lendo</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-[#0F172A]">Posts relacionados</h2>
              </div>
              <Link href="/blog" className="text-sm font-black text-[#2563EB] hover:text-[#1D4ED8]">Voltar ao blog</Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {related.map((item) => <BlogPostCard key={item.slug} post={item} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
