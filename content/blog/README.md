# How to publish a weekly blog post (solo, ~15 minutes)

Every Monday the grade snapshot Action commits a new `data/grades/<date>.json`.
This guide turns that into a published post **written by you** — no CMS, no
admin panel. A post is just a text file in this folder; the site rebuilds it
automatically when you push.

## Step 1 — Get the data

Open a terminal and go to the project folder first — the commands fail from
anywhere else:

```bash
cd C:\Users\Vivek\projects\quickyield-scanner
npm run blog:data
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
npm run blog:draft
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

## Adding images (screenshots, charts, diagrams)

1. Save the image file into the `public/blog/` folder, e.g.
   `public/blog/2026-07-20-grade-shift.png`. Use lowercase-with-dashes names.
2. Reference it in your post with normal Markdown:

   ```
   ![Grade distribution shift, week over week](/blog/2026-07-20-grade-shift.png)
   ```

   The text in `[...]` is the alt text — describe the image in one phrase
   (Google reads it). The path always starts with `/blog/`.
3. Commit the image together with the post:

   ```bash
   git add content/blog/ public/blog/
   ```

Images are automatically styled (rounded corners, border, fits the column).
PNG or JPG under ~500 KB is ideal; screenshot tools' defaults are fine.

## Adding charts

Three ways, simplest first:

1. **Markdown table** — for small numeric comparisons this beats a chart.
   The draft already generates one (the grade distribution table). Syntax:

   ```
   | Grade | Last week | This week |
   |---|---|---|
   | A | 112 | 112 |
   ```

2. **Chart as an image** — make the chart anywhere (Excel, Google Sheets,
   TradingView screenshot, even a screenshot of the /proof charts), export
   or screenshot it as PNG, then follow the image steps above. This is the
   recommended way for weekly posts — fast and looks professional on the
   dark theme if you use a dark background.

3. **Live interactive chart** — the site's own recharts components (like the
   ones on /proof) can be embedded in a post, but that needs a code change
   per chart type (posts are plain Markdown, not React). If you find
   yourself wanting the same chart every week, ask Claude to build it once
   as a reusable component and wire it into the post template.

## What else works in Markdown

- **Links:** `[Basescan](https://basescan.org/...)` — external links open in the text.
- **Bold / italics:** `**bold**`, `*italics*`
- **Lists:** lines starting with `-` or `1.`
- **Quotes:** lines starting with `>` (rendered with a blue accent bar)
- **Code:** backticks for `inline`, triple backticks for blocks
- **Divider:** a line with only `---` (but NOT at the very top — the top
  `---` block is reserved for the title/date/author frontmatter)

Raw HTML (iframes, embedded tweets, YouTube players) is intentionally NOT
rendered, for security. To share a video, link to it; to quote a tweet,
screenshot it and include it as an image.
