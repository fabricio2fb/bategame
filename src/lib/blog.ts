import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { GAME_REGISTRY } from '@/lib/game-registry';
import type { GameType } from '@/lib/types';

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  readTime: string;
  date: string;
  displayDate: string;
  coverImage?: string;
  relatedGame: GameType | null;
  published: boolean;
  faq: BlogFaqItem[];
}

export interface BlogHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export type BlogBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; id: string; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'tip'; text: string };

export interface BlogPost extends BlogPostMeta {
  blocks: BlogBlock[];
  headings: BlogHeading[];
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date).replace('.', '');
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('Blog post sem frontmatter valido.');

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2].trim() };
}

function parseFaq(value: string | undefined): BlogFaqItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as BlogFaqItem[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.question && item?.answer)
      : [];
  } catch {
    return [];
  }
}

function parseMarkdown(body: string) {
  const blocks: BlogBlock[] = [];
  const headings: BlogHeading[] = [];
  const lines = body.split(/\r?\n/);
  let index = 0;

  const flushParagraph = (items: string[]) => {
    if (items.length) blocks.push({ type: 'paragraph', text: items.join(' ') });
  };

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line === ':::tip') {
      index += 1;
      const tipLines: string[] = [];
      while (index < lines.length && lines[index].trim() !== ':::') {
        tipLines.push(lines[index].trim());
        index += 1;
      }
      blocks.push({ type: 'tip', text: tipLines.join(' ') });
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(##|###)\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 2 | 3;
      const text = headingMatch[2].trim();
      const baseId = slugify(text);
      let id = baseId;
      let suffix = 2;
      while (headings.some((heading) => heading.id === id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      blocks.push({ type: 'heading', level, id, text });
      headings.push({ level, id, text });
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current || current.startsWith('##') || current === ':::tip' || /^\d+\.\s+/.test(current) || /^[-*]\s+/.test(current)) break;
      paragraph.push(current);
      index += 1;
    }
    flushParagraph(paragraph);
  }

  return { blocks, headings };
}

function readBlogPost(fileName: string): BlogPost {
  const slug = fileName.replace(/\.mdx$/, '');
  const raw = fs.readFileSync(path.join(BLOG_DIR, fileName), 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  const relatedGame = frontmatter.relatedGame === 'null' ? null : (frontmatter.relatedGame || 'bateprimeiro') as GameType;
  const { blocks, headings } = parseMarkdown(body);

  return {
    slug,
    title: frontmatter.title || slug,
    description: frontmatter.description || '',
    category: frontmatter.category || 'Blog',
    categoryColor: frontmatter.categoryColor || (relatedGame ? GAME_REGISTRY[relatedGame]?.accentColor : undefined) || GAME_REGISTRY.bateprimeiro.accentColor,
    readTime: frontmatter.readTime || '3 min',
    date: frontmatter.date || '',
    displayDate: formatDate(frontmatter.date || ''),
    coverImage: frontmatter.coverImage || undefined,
    relatedGame,
    published: frontmatter.published !== 'false',
    faq: parseFaq(frontmatter.faq),
    blocks,
    headings,
  };
}

export const getAllBlogPosts = cache(() => {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map(readBlogPost)
    .sort((a, b) => b.date.localeCompare(a.date));
});

export const getPublishedBlogPosts = cache(() => getAllBlogPosts().filter((post) => post.published));

export function getBlogPost(slug: string) {
  return getAllBlogPosts().find((post) => post.slug === slug) || null;
}

export function getRelatedPosts(post: BlogPost, limit = 3) {
  const posts = getPublishedBlogPosts().filter((candidate) => candidate.slug !== post.slug);
  const sameGame = post.relatedGame ? posts.filter((candidate) => candidate.relatedGame === post.relatedGame) : [];
  const sameCategory = posts.filter((candidate) => candidate.category === post.category && !sameGame.some((item) => item.slug === candidate.slug));
  const rest = posts.filter((candidate) => !sameGame.some((item) => item.slug === candidate.slug) && !sameCategory.some((item) => item.slug === candidate.slug));
  return [...sameGame, ...sameCategory, ...rest].slice(0, limit);
}

export function getGameHref(gameType: GameType) {
  return GAME_REGISTRY[gameType]?.gameType === 'bateprimeiro' ? '/bateprimeiro' : `/${gameType}`;
}
