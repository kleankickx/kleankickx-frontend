// Vite plugin: after the build, write a real HTML file for every public route with
// its own title, description, canonical, Open Graph tags, JSON-LD and readable
// content inside #root. Crawlers get a full page; React replaces #root when it loads,
// so the app, cart and checkout behave exactly as before. Also writes sitemap.xml.
import fs from 'node:fs';
import path from 'node:path';
import { PAGES, SITE_URL, SITE_NAME, OG_IMAGE, canonicalFor, schemaFor } from '../src/seo/site.js';

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const STATIC_CSS = '<style id="kk-static">#root>.kk-static{max-width:960px;margin:0 auto;padding:32px 20px;font:16px/1.6 system-ui,sans-serif;color:#0A0B0A}#root>.kk-static h1{font-size:40px;line-height:1.05;margin:24px 0 12px}#root>.kk-static ul{padding-left:18px}</style>';

export default function prerender() {
  let outDir = 'dist';
  return {
    name: 'kleankickx-prerender',
    apply: 'build',
    configResolved(config) { outDir = path.resolve(config.root, config.build.outDir); },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      for (const [route, page] of Object.entries(PAGES)) {
        const url = canonicalFor(route);
        const head = [
          `<title>${attr(page.title)}</title>`,
          `<meta name="description" content="${attr(page.description)}" />`,
          `<link rel="canonical" href="${url}" />`,
          '<meta name="robots" content="index,follow,max-image-preview:large" />',
          `<meta property="og:type" content="website" />`,
          `<meta property="og:site_name" content="${SITE_NAME}" />`,
          `<meta property="og:title" content="${attr(page.title)}" />`,
          `<meta property="og:description" content="${attr(page.description)}" />`,
          `<meta property="og:url" content="${url}" />`,
          `<meta property="og:image" content="${OG_IMAGE}" />`,
          '<meta property="og:locale" content="en_GH" />',
          '<meta name="twitter:card" content="summary_large_image" />',
          ...schemaFor(route).map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`),
          STATIC_CSS,
        ].join('\n    ');
        const html = template
          .replace(/<title>[\s\S]*?<\/title>/, '')
          .replace(/\s*<meta name="description"[^>]*>/, '')
          .replace('</head>', `    ${head}\n  </head>`)
          .replace('<div id="root"></div>', `<div id="root"><div class="kk-static">${page.body()}</div></div>`);
        const file = route === '/' ? path.join(outDir, 'index.html') : path.join(outDir, route.slice(1), 'index.html');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, html);
      }
      // Old About page: the host has no redirect rules (netlify.toml only works on Netlify),
      // so serve an instant meta refresh, which search engines treat as a permanent redirect.
      const studio = canonicalFor('/studio');
      fs.mkdirSync(path.join(outDir, 'about-us'), { recursive: true });
      fs.writeFileSync(path.join(outDir, 'about-us', 'index.html'),
        `<!doctype html><html lang="en-GH"><head><meta charset="UTF-8"><title>Moved to Studio | ${SITE_NAME}</title>`
        + `<link rel="canonical" href="${studio}"><meta name="robots" content="noindex,follow">`
        + `<meta http-equiv="refresh" content="0; url=${studio}"></head>`
        + `<body><p>This page has moved to <a href="${studio}">${studio}</a>.</p></body></html>\n`);

      const today = new Date().toISOString().slice(0, 10);
      const urls = Object.keys(PAGES).map((r) => `  <url><loc>${canonicalFor(r)}</loc><lastmod>${today}</lastmod></url>`).join('\n');
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
      console.log(`[prerender] wrote ${Object.keys(PAGES).length} pages + sitemap.xml for ${SITE_URL}`);
    },
  };
}
