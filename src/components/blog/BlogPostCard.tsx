import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock3 } from 'lucide-react';
import type { BlogPostMeta } from '@/lib/blog';

interface BlogPostCardProps {
  post: BlogPostMeta;
  featured?: boolean;
}

export function BlogPostCard({ post, featured = false }: BlogPostCardProps) {
  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block h-full rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] lg:col-span-7"
      >
        <article
          className="flex h-full min-h-[360px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22),0_0_60px_rgba(59,130,246,0.22)] backdrop-blur-xl transition-transform group-hover:-translate-y-1 sm:min-h-[420px] sm:p-8"
          style={{
            backgroundImage: `linear-gradient(135deg, ${post.categoryColor}E8 0%, rgba(34,197,94,0.72) 100%), radial-gradient(circle at 80% 15%, rgba(255,255,255,0.34), transparent 15rem)`,
          }}
        >
          <div>
            <span className="inline-flex rounded-full border border-white/40 bg-white/18 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              {post.category}
            </span>
            <h2 className="mt-6 max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl">
              {post.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-white/82 sm:text-base">
              {post.description}
            </p>
          </div>

          {post.coverImage && (
            <div className="mt-8 hidden h-48 overflow-hidden rounded-3xl border border-white/25 bg-white/16 shadow-[0_18px_46px_rgba(15,23,42,0.22)] lg:block">
              <Image
                src={post.coverImage}
                alt={`Capa do post ${post.title}`}
                width={1200}
                height={675}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(min-width: 1024px) 58vw, 0px"
                priority
              />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-4 text-sm font-bold text-white/82">
            <span>{post.displayDate}</span>
            <span className="inline-flex items-center gap-2">
              Ler postagem <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]">
      <article className="h-full rounded-3xl border border-white/72 bg-white/48 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-transform group-hover:-translate-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: post.categoryColor }}>
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
            <Clock3 className="h-3.5 w-3.5" />
            {post.readTime}
          </span>
        </div>
        <h2 className="mt-4 text-xl font-black leading-tight text-[#0F172A]">{post.title}</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#475569]">{post.description}</p>
        <p className="mt-4 text-xs font-bold text-[#64748B]">{post.displayDate}</p>
      </article>
    </Link>
  );
}
