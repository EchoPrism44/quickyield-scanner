# How to publish a weekly blog post (solo, ~15 minutes)

Every Monday the grade snapshot Action commits a new `data/grades/<date>.json`.
This guide turns that into a published post **written by you** — no CMS, no
admin panel. A post is just a text file in this folder; the site rebuilds it
automatically when you push.

## Step 1 — Get the data

Open a terminal in the project folder and run:

```bash
npx tsx scripts/analyze-snapshot.ts
```

This prints the full week-over-week analysis: pools graded, grade distribution
shift, every notable upgrade/downgrade, biggest APY and TVL movers. Read it —
this is your research.

Want to compare two specific weeks instead of the latest two?

```bash
npx tsx scripts/analyze-snapshot.ts 2026-07-13 2026-07-20
```

## Step 2 — Create the draft

```bash
npx tsx scripts/analyze-snapshot.ts --draft
```

This writes `content/blog/<date>-weekly-grade-record.md` with the numbers,
tables, and top moves pre-filled, plus an **"Our read"** section left blank
for you. Nothing is published yet — it's just a file on your laptop.

## Step 3 — Write your part

Open the new `.md` file in any editor (VS Code, Notepad, anything) and:

1. Write the **"Our read"** section in your own words — why did pools move,
   is the market safer or riskier, what to watch next week. Delete the
   placeholder line.
2. Tweak the title/excerpt if you want. The block at the top between `---`
   lines controls how the post appears:

   ```
   ---
   title: "Weekly grade record — 2026-07-20"
   date: "2026-07-20"
   excerpt: "One-line summary shown on the blog index and in Google."
   author: "Vivek"
   readMinutes: 4
   ---
   ```

   Everything below the second `---` is normal Markdown (`##` headings,
   `**bold**`, tables, lists).

3. Preview it locally if you want: run `npm run dev`, open
   `http://localhost:3001/blog` — your draft is already there.

## Step 4 — Publish

Publishing = committing the file and pushing:

```bash
git add content/blog/
git commit -m "blog: weekly grade record 2026-07-20"
git push
```

Then merge to `main` (via PR as usual). Vercel redeploys and the post is live
at `/blog/<filename-without-.md>`, listed on `/blog`, and included in the
sitemap for Google. Done.

## Writing a non-weekly post

Just create any file in this folder, e.g. `content/blog/why-we-grade-in-public.md`,
starting with the same `---` frontmatter block (title, date, excerpt, author).
The filename becomes the URL slug, so keep it lowercase-with-dashes.

## Rules of thumb

- Never edit a published post's `date` — append a "Update:" section instead.
- The excerpt is what Google and X show; write it like a hook, one sentence.
- Keep the method-note + disclaimer at the bottom of weekly posts (compliance).
- The site never auto-publishes anything: no push, no post.
