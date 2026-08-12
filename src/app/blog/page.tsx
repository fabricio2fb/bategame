import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';
import { HubInfoPage } from '@/components/HubInfoPage';
import { GAME_REGISTRY } from '@/lib/game-registry';

export const metadata: Metadata = {
  title: 'Blog | Tempale',
  description: 'Postagens, novidades e bastidores dos jogos do hub Tempale.',
};

const posts = [
  {
    title: 'Como transformar uma rodada simples em disputa de verdade',
    excerpt: 'O que faz um jogo social funcionar melhor em sala: tempo curto, feedback claro e regras que todo mundo entende rapido.',
    category: 'Design de jogo',
    date: '10 ago 2026',
    readTime: '4 min',
    color: GAME_REGISTRY.bateprimeiro.accentColor,
    href: '#',
  },
  {
    title: 'Por que o lobby virou uma base multi-jogo',
    excerpt: 'Um resumo da arquitetura de salas compartilhadas para jogos diferentes sem misturar a regra de cada partida.',
    category: 'Tecnologia',
    date: '9 ago 2026',
    readTime: '6 min',
    color: GAME_REGISTRY['quem-chega-mais-perto'].accentColor,
    href: '#',
  },
  {
    title: 'Ideias para jogar Qual e a Palavra com listas personalizadas',
    excerpt: 'Sugestoes de listas por tema, festa, escola, familia ou trabalho para deixar o jogo com a cara da sua turma.',
    category: 'Guias',
    date: '8 ago 2026',
    readTime: '3 min',
    color: GAME_REGISTRY['qual-e-a-palavra'].accentColor,
    href: '#',
  },
  {
    title: 'O que vem depois do jogo BatePrimeiro',
    excerpt: '3 Letras, Bate o Tempo e novos modos de disputa ampliam o hub mantendo partidas rapidas e sociais.',
    category: 'Novidades',
    date: '7 ago 2026',
    readTime: '5 min',
    color: GAME_REGISTRY['tres-letras'].accentColor,
    href: '#',
  },
];

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <HubInfoPage
      eyebrow="Blog"
      title="Postagens sobre jogos, salas e partidas."
      description="Novidades do hub, notas de desenvolvimento e ideias para jogar melhor com a galera."
    >
      <div className="grid gap-5 lg:grid-cols-12">
        <Link
          href={featured.href}
          className="group block rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] lg:col-span-7"
        >
          <article
            className="flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22),0_0_60px_rgba(59,130,246,0.22)] backdrop-blur-xl transition-transform group-hover:-translate-y-1 sm:p-8"
            style={{
              backgroundImage: `linear-gradient(135deg, ${featured.color}E8 0%, rgba(34,197,94,0.72) 100%), radial-gradient(circle at 80% 15%, rgba(255,255,255,0.34), transparent 15rem)`,
            }}
          >
            <div>
              <span className="inline-flex rounded-full border border-white/40 bg-white/18 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                {featured.category}
              </span>
              <h2 className="mt-6 max-w-2xl text-3xl font-black leading-tight text-white sm:text-5xl">
                {featured.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-white/82 sm:text-base">
                {featured.excerpt}
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 text-sm font-bold text-white/82">
              <span>{featured.date}</span>
              <span className="inline-flex items-center gap-2">
                Ler postagem <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </article>
        </Link>

        <div className="grid gap-4 lg:col-span-5">
          {rest.map((post) => (
            <Link key={post.title} href={post.href} className="group block rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]">
              <article className="rounded-3xl border border-white/72 bg-white/48 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-transform group-hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: post.color }}>
                    {post.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-black leading-tight text-[#0F172A]">{post.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#475569]">{post.excerpt}</p>
                <p className="mt-4 text-xs font-bold text-[#64748B]">{post.date}</p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </HubInfoPage>
  );
}
