# Litmus headless WordPress CMS

Litmus remains a Next.js website. WordPress is used only as the editorial backend; readers continue to visit the Litmus domain.

## How it works

- Editors write and publish posts in WordPress.
- The Next.js server reads public posts from the WordPress REST API.
- The article index and article pages cache CMS responses for five minutes.
- Published posts use the existing Litmus article layout, metadata, canonical URLs and Article JSON-LD.
- Existing Markdown posts remain as a fallback until WordPress is configured or if the API is temporarily unavailable.

## WordPress setup

1. Create a free WordPress.com site. A free `*.wordpress.com` address is sufficient; do not map the Litmus domain to WordPress.
2. Publish one test post and make sure it is publicly visible.
3. Check that this endpoint returns JSON in a browser:

   `https://YOUR-SITE.wordpress.com/wp-json/wp/v2/posts?per_page=1&_embed=1`

4. Add the following environment variables to the Litmus deployment and local `.env.local`:

   ```dotenv
   WORDPRESS_SITE_URL=https://YOUR-SITE.wordpress.com
   NEXT_PUBLIC_SITE_URL=https://www.getlitmus.xyz
   ```

   Use the WordPress site root only. Do not add `/wp-json` to the value.

5. Redeploy Litmus. Published posts should appear at `/blog` and `/blog/your-post-slug`.

The integration reads public published posts only. It does not need a WordPress password, application password, plugin or paid WordPress plan. Draft previews and authenticated editing are not part of this first integration.

## Editorial fields

Use the WordPress post title, excerpt, body, author, categories, tags and featured image. The first assigned category is used as the article category. The featured image becomes the Open Graph image. Use a concise excerpt because it is also used as the page description.

## Cloudflare deployment

The application is still a full Next.js 16 application, not a static export. Deploy it to **Cloudflare Workers**, not a Pages static-site project.

Cloudflare's current Next.js guide recommends vinext for new deployments; its OpenNext adapter remains a documented option for existing Next.js apps. Before migrating this repository, run the compatibility check and a preview deployment against the complete app (including Clerk, database access, scheduled jobs and API routes). Do not switch the production domain until the Worker preview passes.

For the existing Next.js application, evaluate the OpenNext Cloudflare adapter first:

```bash
npm install --save-dev @opennextjs/cloudflare wrangler
npx @opennextjs/cloudflare migrate
npm run preview
```

Review the generated Wrangler and OpenNext configuration, run the full type-check and tests, and verify all authenticated and database-backed routes in the Workers preview before deploying. Cloudflare Workers deployment is not completed merely by adding the CMS URL.

Official guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
OpenNext guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
