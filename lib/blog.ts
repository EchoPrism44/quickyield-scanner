import fs from 'node:fs'
import path from 'node:path'

export type BlogPost = {
  slug: string
  title: string
  date: string
  excerpt: string
  readMinutes: number
  body: string
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

/**
 * Minimal frontmatter parser — posts are markdown files starting with a
 * `---` block of `key: "value"` lines. Kept dependency-free on purpose.
 */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta: {}, body: raw }
  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    meta[key] = value
  }
  return { meta, body: raw.slice(match[0].length) }
}

function loadPost(file: string): BlogPost | null {
  const slug = file.replace(/\.mdx?$/, '')
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
  const { meta, body } = parseFrontmatter(raw)
  if (!meta.title || !meta.date) return null
  return {
    slug,
    title: meta.title,
    date: meta.date,
    excerpt: meta.excerpt ?? '',
    readMinutes: Number(meta.readMinutes) || Math.max(2, Math.round(body.split(/\s+/).length / 200)),
    body,
  }
}

/** All posts, newest first. Soft-empty when the directory doesn't exist. */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(loadPost)
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): BlogPost | null {
  if (!/^[\w-]+$/.test(slug)) return null
  for (const ext of ['.md', '.mdx']) {
    if (fs.existsSync(path.join(BLOG_DIR, `${slug}${ext}`))) return loadPost(`${slug}${ext}`)
  }
  return null
}
