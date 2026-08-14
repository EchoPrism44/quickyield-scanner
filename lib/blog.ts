import fs from 'node:fs'
import path from 'node:path'

export type BlogPost = {
  slug: string
  title: string
  description: string
  excerpt: string
  date: string
  updated: string
  author: string
  category: string
  tags: string[]
  canonical: string
  ogImage: string
  noindex: boolean
  readMinutes: number
  snapshot: string
  related: string[]
  contentType: string
  body: string
}

/** Site default byline — used when a post has no `author:` in its frontmatter. */
export const DEFAULT_AUTHOR = 'Litmus Research'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

/**
 * Small dependency-free YAML subset for editorial frontmatter. It supports
 * quoted/scalar values plus simple `- item` arrays, which keeps Markdown
 * publishing portable without adding a YAML dependency to the app.
 */
function parseFrontmatter(raw: string): { meta: Record<string, string | string[]>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta: {}, body: raw }

  const meta: Record<string, string | string[]> = {}
  let arrayKey: string | null = null

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue
    const listMatch = line.match(/^\s*-\s+(.*)$/)
    if (listMatch && arrayKey) {
      const current = Array.isArray(meta[arrayKey]) ? meta[arrayKey] as string[] : []
      current.push(unquote(listMatch[1].trim()))
      meta[arrayKey] = current
      continue
    }

    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const rawValue = line.slice(idx + 1).trim()
    if (!rawValue) {
      meta[key] = []
      arrayKey = key
      continue
    }
    meta[key] = unquote(rawValue)
    arrayKey = null
  }

  return { meta, body: raw.slice(match[0].length) }
}

function unquote(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function scalar(meta: Record<string, string | string[]>, key: string, fallback = ''): string {
  const value = meta[key]
  return typeof value === 'string' ? value : fallback
}

function list(meta: Record<string, string | string[]>, key: string): string[] {
  const value = meta[key]
  return Array.isArray(value) ? value : value ? [value] : []
}

function bool(meta: Record<string, string | string[]>, key: string, fallback = false): boolean {
  const value = scalar(meta, key)
  if (!value) return fallback
  return value.toLowerCase() === 'true'
}

function contentTypeFromPath(relativePath: string, meta: Record<string, string | string[]>): string {
  const explicit = scalar(meta, 'type') || scalar(meta, 'contentType')
  if (explicit) return explicit
  const parent = path.dirname(relativePath)
  return parent !== '.' ? parent.split(path.sep)[0] : 'research'
}

function slugFromPath(file: string): string {
  return file.replace(/\\/g, '/').replace(/\.mdx?$/, '').replace(/^.*\//, '')
}

function walkMarkdown(dir: string, prefix = ''): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    if (entry.isDirectory()) return walkMarkdown(path.join(dir, entry.name), relative)
    return /\.mdx?$/.test(entry.name) ? [relative] : []
  })
}

function loadPost(file: string): BlogPost | null {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
  const { meta, body } = parseFrontmatter(raw)
  const slug = slugFromPath(file)
  const title = scalar(meta, 'title')
  const date = scalar(meta, 'date')
  if (!title || !date) return null

  const excerpt = scalar(meta, 'excerpt')
  const description = scalar(meta, 'description', excerpt)
  const updated = scalar(meta, 'updated', date)
  const readMinutes = Number(scalar(meta, 'readMinutes')) || Math.max(2, Math.round(body.split(/\s+/).filter(Boolean).length / 200))

  return {
    slug,
    title,
    description,
    excerpt,
    date,
    updated,
    author: scalar(meta, 'author', DEFAULT_AUTHOR),
    category: scalar(meta, 'category', contentTypeFromPath(file, meta)),
    tags: list(meta, 'tags'),
    canonical: scalar(meta, 'canonical'),
    ogImage: scalar(meta, 'ogImage'),
    noindex: bool(meta, 'noindex'),
    readMinutes,
    snapshot: scalar(meta, 'snapshot'),
    related: list(meta, 'related'),
    contentType: contentTypeFromPath(file, meta),
    body,
  }
}

/** All posts, newest first. Supports nested content-type directories. */
export function getAllPosts(): BlogPost[] {
  return walkMarkdown(BLOG_DIR)
    .map(loadPost)
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): BlogPost | null {
  if (!/^[\w-]+$/.test(slug)) return null
  return getAllPosts().find((post) => post.slug === slug) ?? null
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  return getAllPosts()
    .filter((candidate) => candidate.slug !== post.slug && !candidate.noindex)
    .map((candidate) => {
      const tagOverlap = candidate.tags.filter((tag) => post.tags.includes(tag)).length
      const categoryMatch = candidate.category === post.category ? 2 : 0
      const explicitMatch = post.related.includes(candidate.slug) ? 10 : 0
      return { candidate, score: explicitMatch + tagOverlap + categoryMatch }
    })
    .sort((a, b) => b.score - a.score || b.candidate.date.localeCompare(a.candidate.date))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
