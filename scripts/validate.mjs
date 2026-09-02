#!/usr/bin/env node
// Deterministic validation of the built NELOdev site.
// Node standard library only. No network, no randomness, no timestamps.
// Run after `npm run build`; inspects dist/.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const TITLE = 'NELOdev \u2014 Django and Python web development for business applications.';
const DESCRIPTION = 'Focused backend work, APIs, integrations, and data-focused web applications.';
const CANONICAL = 'https://nelodev.ee/';
const APPROVED_MAILTO = 'mailto:info@nelodev.ee?subject=NELOdev%20project%20enquiry';
const PLAIN_MAILTO = 'mailto:info@nelodev.ee';
const APPROVED_GITHUB = 'https://github.com/NELOdev-studio/slotbook';

const passed = [];
const failed = [];
function check(name, ok, detail = '') {
  (ok ? passed : failed).push(name);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` \u2014 ${detail}` : ''}`);
}

if (!existsSync(join(dist, 'index.html'))) {
  console.error('FAIL  dist/index.html missing \u2014 run the build first (npm run build).');
  process.exit(1);
}

const html = readFileSync(join(dist, 'index.html'), 'utf8');

// ---- Structure ----
const sectionIds = [...html.matchAll(/<section\b[^>]*\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
const sectionCount = (html.match(/<section\b/gi) || []).length;
check('exactly five section elements', sectionCount === 5, `count=${sectionCount}`);
check(
  'section ids in order: hero, services, work, about, contact',
  JSON.stringify(sectionIds) === JSON.stringify(['hero', 'services', 'work', 'about', 'contact']),
  sectionIds.join(',')
);

check('exactly one main landmark with id="main"', (html.match(/<main\b/gi) || []).length === 1 && /id="main"/.test(html));
check('semantic header present', /<header\b/i.test(html));
check('semantic nav present', /<nav\b/i.test(html));
check('semantic footer present', /<footer\b/i.test(html));
check('skip link targets #main', /href="#main"/.test(html));
check('html lang="en"', /<html\b[^>]*\blang="en"/i.test(html));
check('viewport meta present', /name="viewport"/.test(html));

const allIds = [...html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
const duplicateIds = [...new Set(allIds.filter((id, i) => allIds.indexOf(id) !== i))];
check('no duplicate id attributes', duplicateIds.length === 0, duplicateIds.join(', '));

for (const id of ['services', 'work', 'about', 'contact']) {
  check(`header nav links to #${id}`, html.includes(`href="#${id}"`));
}
check('wordmark links to #hero', html.includes('href="#hero"'));

// ---- Headings ----
const h1Count = (html.match(/<h1\b/gi) || []).length;
check('exactly one H1', h1Count === 1, `count=${h1Count}`);

const h1Text = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]?.trim() ?? '';
check('H1 uses exact approved copy', h1Text === 'Django and Python web development for business applications.', h1Text.slice(0, 60));

const h2Count = (html.match(/<h2\b/gi) || []).length;
check('exactly four H2 elements', h2Count === 4, `count=${h2Count}`);

const h2Texts = [...html.matchAll(/<h2\b[^>]*>([^<]*)<\/h2>/gi)].map((m) => m[1].trim());
check(
  'H2 texts in order: Services, SlotBook, About, contact question',
  JSON.stringify(h2Texts) === JSON.stringify(['Services', 'SlotBook: API engineering demonstrator', 'About', 'Have a Django or Python web project to discuss?']),
  JSON.stringify(h2Texts)
);

const h3Count = (html.match(/<h3\b/gi) || []).length;
check('exactly three H3 elements', h3Count === 3, `count=${h3Count}`);

const h3Texts = [...html.matchAll(/<h3\b[^>]*>([^<]*)<\/h3>/gi)].map((m) => m[1].trim());
check(
  'H3 service names exact and in order',
  JSON.stringify(h3Texts) === JSON.stringify(['Django backend development.', 'REST APIs and integrations.', 'Data-focused web applications.']),
  JSON.stringify(h3Texts)
);

const headingLevels = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((m) => Number(m[1]));
check('heading sequence starts with H1', headingLevels.length > 0 && headingLevels[0] === 1, headingLevels.join(','));
let headingSkip = false;
for (let i = 1; i < headingLevels.length; i++) {
  if (headingLevels[i] > headingLevels[i - 1] + 1) headingSkip = true;
}
check('heading levels never skip', !headingSkip, headingLevels.join(','));

// ---- Approved copy ----
const serviceItems = (html.match(/class="service"/g) || []).length;
check('exactly three service items', serviceItems === 3, `count=${serviceItems}`);
const caseFigures = (html.match(/<figure\b/gi) || []).length;
check('exactly seven case figures', caseFigures === 7, `count=${caseFigures}`);
const caseImages = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
check('exactly seven case images', caseImages.length === 7, `count=${caseImages.length}`);
check('all case images have alt text', caseImages.every((image) => /\balt="[^"]+"/.test(image)));
const caseMediaFrames = (html.match(/class="[^"]*\bcase-gallery__media\b[^"]*"/g) || []).length;
check('five result screenshots use aligned media frames', caseMediaFrames === 5, `count=${caseMediaFrames}`);

const REQUIRED_STRINGS = [
  'Django and Python web development for business applications.',
  'Focused backend work, APIs, integrations, and data-focused web applications.',
  'Discuss a project',
  'Django backend development.',
  'Build and extend backend functionality for business web applications.',
  'REST APIs and integrations.',
  'Design and implement Python and Django APIs that connect services and support structured workflows.',
  'Data-focused web applications.',
  'Create Django-based interfaces for structured data, workflows, and internal tools.',
  'Selected engineering work',
  'SlotBook: API engineering demonstrator',
  'A self-initiated API-only reference implementation for appointment and service-slot booking, built with Django REST Framework.',
  'The demonstrated workflow covers Provider-owned services and time slots, Customer availability discovery, and capacity-one booking.',
  'OpenAPI and Swagger documentation make the API surface available for inspection.',
  'Demonstrated workflow: HTTP 201 success followed by HTTP 409 slot_already_booked conflict.',
  'A successful booking returns HTTP 201.',
  'A competing request for the same slot returns HTTP 409 with the error code slot_already_booked.',
  'SlotBook exposes a bounded API-only workflow through generated Swagger documentation.',
  'Provider service inspection returns the owned synthetic service.',
  'Customer availability discovery returns an available future slot.',
  'The first booking for an available slot is confirmed with HTTP 201.',
  'A competing request for the same slot is rejected deterministically.',
  'The local readiness endpoint reports the demonstrator is ready.',
  'All data shown in this demonstration is synthetic.',
  'This is a demonstrator, not client work or a production booking product.',
  'View the public SlotBook source repository',
  'NELOdev focuses on Django and Python web development for business applications.',
  'The offer is centered on backend functionality, APIs, integrations, and data-focused web applications.',
  'Have a Django or Python web project to discuss?',
  'Send a short note with what you are building, what is blocked, and what help you need.',
  'info@nelodev.ee',
];
for (const s of REQUIRED_STRINGS) {
  const short = s.length > 52 ? `${s.slice(0, 52)}\u2026` : s;
  check(`approved string present: ${short}`, html.includes(s));
}

const visibleText = html
  .replace(/<head\b[\s\S]*?<\/head>/gi, ' ')
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#(?:x27|39);/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();
const APPROVED_VISIBLE_TEXT = [
  'Skip to main content',
  'NELOdev',
  'Services',
  'Work',
  'About',
  'Contact',
  'Django and Python web development for business applications.',
  'Focused backend work, APIs, integrations, and data-focused web applications.',
  'Discuss a project',
  'Services',
  'Django backend development.',
  'Build and extend backend functionality for business web applications.',
  'REST APIs and integrations.',
  'Design and implement Python and Django APIs that connect services and support structured workflows.',
  'Data-focused web applications.',
  'Create Django-based interfaces for structured data, workflows, and internal tools.',
  'Selected engineering work',
  'SlotBook: API engineering demonstrator',
  'A self-initiated API-only reference implementation for appointment and service-slot booking, built with Django REST Framework.',
  'The demonstrated workflow covers Provider-owned services and time slots, Customer availability discovery, and capacity-one booking.',
  'OpenAPI and Swagger documentation make the API surface available for inspection.',
  'Demonstrated workflow: HTTP 201 success followed by HTTP 409 slot_already_booked conflict.',
  'A successful booking returns HTTP 201.',
  'A competing request for the same slot returns HTTP 409 with the error code slot_already_booked.',
  'SlotBook exposes a bounded API-only workflow through generated Swagger documentation.',
  'Provider service inspection returns the owned synthetic service.',
  'Customer availability discovery returns an available future slot.',
  'The first booking for an available slot is confirmed with HTTP 201.',
  'A competing request for the same slot is rejected deterministically.',
  'The local readiness endpoint reports the demonstrator is ready.',
  'All data shown in this demonstration is synthetic.',
  'This is a demonstrator, not client work or a production booking product.',
  'View the public SlotBook source repository',
  'About',
  'NELOdev focuses on Django and Python web development for business applications.',
  'The offer is centered on backend functionality, APIs, integrations, and data-focused web applications.',
  'Have a Django or Python web project to discuss?',
  'Send a short note with what you are building, what is blocked, and what help you need.',
  'Discuss a project',
  'info@nelodev.ee',
  'NELOdev',
  'info@nelodev.ee',
].join(' ');
check('all visible text exactly matches the approved copy', visibleText === APPROVED_VISIBLE_TEXT);
check('no visible copyright or \u00a9 symbol', !/(&copy;|&#169;|\u00a9|\bcopyright\b)/i.test(html));
check('no inline event handlers', !/\son[a-z]+\s*=/i.test(html));
check('no inline style attributes', !/\sstyle\s*=/i.test(html));

// ---- Contact route ----
const mailtos = [...html.matchAll(/href="(mailto:[^"]+)"/gi)].map((m) => m[1]);
const approvedMailtoCount = mailtos.filter((m) => m === APPROVED_MAILTO).length;
check('approved CTA mailto used exactly twice', approvedMailtoCount === 2, `count=${approvedMailtoCount}`);
check(
  'every mailto link is an approved target',
  mailtos.every((m) => m === APPROVED_MAILTO || m === PLAIN_MAILTO),
  [...new Set(mailtos)].join(' | ')
);
check('visible email fallback link present', mailtos.includes(PLAIN_MAILTO));

// ---- Metadata ----
const titleTag = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? '';
check('title exact approved', titleTag === TITLE, titleTag.slice(0, 70));

const descMatch = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html);
check('meta description exact approved', descMatch?.[1] === DESCRIPTION, (descMatch?.[1] ?? '').slice(0, 60));

const canonicalCount = (html.match(/rel="canonical"/gi) || []).length;
check('exactly one canonical link', canonicalCount === 1, `count=${canonicalCount}`);
check('canonical href is https://nelodev.ee/', /rel="canonical"\s+href="https:\/\/nelodev\.ee\/"/i.test(html));

function ogValue(prop) {
  return new RegExp(`<meta\\s+property="og:${prop}"\\s+content="([^"]*)"`, 'i').exec(html)?.[1] ?? '';
}
check('og:title', ogValue('title') === TITLE);
check('og:description', ogValue('description') === DESCRIPTION);
check('og:type website', ogValue('type') === 'website');
check('og:url', ogValue('url') === CANONICAL);
check('og:image points to local og-image.png', ogValue('image') === `${CANONICAL}og-image.png`);
check('og:site_name NELOdev', ogValue('site_name') === 'NELOdev');

check('favicon link present', /rel="icon"/.test(html));
check('public SlotBook repository link is exact', html.includes(`href="${APPROVED_GITHUB}"`));

// ---- Privacy: no forms, scripts, analytics, trackers ----
check('no form elements', !/<form\b/i.test(html));
check('no script elements', !/<script\b/i.test(html));
check('no iframe elements', !/<iframe\b/i.test(html));
check(
  'no analytics/tracker references',
  !/(analytics|gtag|googletagmanager|plausible|matomo|fathom|clarity|hotjar|facebook|segment|pixel|datadog|umami|posthog|adsbygoogle|doubleclick|sentry|cloudflareinsights|counter\.dev|hs-script)/i.test(html)
);
check('no cloudflare beacon script', !/cloudflare[^<>"\s]{0,80}beacon|beacon[^<>"\s]{0,80}cloudflare/i.test(html));

const hosts = [
  ...new Set(
    [...html.matchAll(/https?:\/\/([^/"'\s>)]+)/gi)].map((m) => m[1].toLowerCase()).filter((h) => !h.startsWith('nelodev.ee'))
  ),
];
const ALLOWED_EXTERNAL_HOSTS = new Set(['github.com']);
check('all absolute URLs use approved hosts', hosts.every((host) => ALLOWED_EXTERNAL_HOSTS.has(host)), hosts.join(', '));
check(
  'no private or live-demo references',
  !/(127\.0\.0\.1|localhost|slotbook-project|taltech|linkedin|password|secret|live demo|demo credentials|open source|MIT-licensed)/i.test(html)
);

// ---- Static crawl files ----
const robotsPath = join(dist, 'robots.txt');
const robots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8') : '';
check('robots.txt present in dist', existsSync(robotsPath));
check('robots.txt has allow-all policy', /User-agent:\s*\*/i.test(robots) && /Allow:\s*\/\s*$/m.test(robots));
check('robots.txt references sitemap', robots.includes(`${CANONICAL}sitemap.xml`));

const sitemapPath = join(dist, 'sitemap.xml');
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';
check('sitemap.xml present in dist', existsSync(sitemapPath));
check('sitemap lists https://nelodev.ee/', sitemap.includes(CANONICAL));

const faviconPath = join(dist, 'favicon.svg');
check('favicon.svg present in dist', existsSync(faviconPath) && statSync(faviconPath).size > 0);

const heroGridPath = join(dist, 'hero-grid.png');
check('hero-grid.png present in dist', existsSync(heroGridPath) && statSync(heroGridPath).size > 0);

const ogImagePath = join(dist, 'og-image.png');
check(
  'og-image.png present and non-trivial',
  existsSync(ogImagePath) && statSync(ogImagePath).size > 1000
);

const ogPng = existsSync(ogImagePath) ? readFileSync(ogImagePath) : Buffer.alloc(0);
const pngHeaderOk =
  ogPng.length > 24 &&
  ogPng.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) &&
  ogPng.subarray(12, 16).toString('ascii') === 'IHDR';
const pngWidth = pngHeaderOk ? ogPng.readUInt32BE(16) : 0;
const pngHeight = pngHeaderOk ? ogPng.readUInt32BE(20) : 0;
check('og-image.png has valid PNG header', pngHeaderOk);
check('og-image.png dimensions are 1200x630', pngWidth === 1200 && pngHeight === 630, `${pngWidth}x${pngHeight}`);

const CASE_ASSETS = [
  'slotbook/workflow_diagram.svg',
  'slotbook/01_swagger_overview.webp',
  'slotbook/02_provider_services.webp',
  'slotbook/03_availability_booking_201.webp',
  'slotbook/04_booking_conflict_409.webp',
  'slotbook/05_health_schema.webp',
  'slotbook/06_availability_discovery_200.webp',
];
for (const asset of CASE_ASSETS) {
  const assetPath = join(dist, asset);
  check(`case asset present: ${asset}`, existsSync(assetPath) && statSync(assetPath).size > 0);
}
const workflowSvgPath = join(dist, 'slotbook/workflow_diagram.svg');
const workflowSvg = existsSync(workflowSvgPath) ? readFileSync(workflowSvgPath, 'utf8') : '';
check('workflow diagram has accessible title and description', /<title\b/i.test(workflowSvg) && /<desc\b/i.test(workflowSvg));

// ---- Assets and payload ----
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = walk(dist);
const FONT_RE = /\.(woff2?|ttf|otf)$/i;
const nonFontFiles = files.filter((f) => !FONT_RE.test(f));
const fontFiles = files.filter((f) => FONT_RE.test(f));

const jsFiles = files.filter((f) => f.endsWith('.js'));
check('no JavaScript emitted in dist', jsFiles.length === 0, jsFiles.join(', '));

const nonFontBytes = nonFontFiles.reduce((s, f) => s + statSync(f).size, 0);
const fontBytes = fontFiles.reduce((s, f) => s + statSync(f).size, 0);
check(
  'payload < 200 KB excluding fonts',
  nonFontBytes < 200 * 1024,
  `${(nonFontBytes / 1024).toFixed(1)} KB (fonts excluded: ${(fontBytes / 1024).toFixed(1)} KB)`
);

const gzipBytes = nonFontFiles.reduce((s, f) => s + gzipSync(readFileSync(f)).length, 0);
check('gzip payload < 200 KB excluding fonts', gzipBytes < 200 * 1024, `${(gzipBytes / 1024).toFixed(1)} KB gzip`);

// ---- CSS constraints ----
const cssFiles = files.filter((f) => f.endsWith('.css'));
check('at least one CSS file emitted', cssFiles.length >= 1, `count=${cssFiles.length}`);
const css = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

const letterSpacingDecls = (css.match(/letter-spacing/g) || []).length;
const letterSpacingZero = (css.match(/letter-spacing\s*:\s*0\b/g) || []).length;
check(
  'letter-spacing is 0 everywhere',
  letterSpacingDecls === letterSpacingZero,
  `${letterSpacingDecls} declarations, ${letterSpacingZero} zero-valued`
);

check('no gradient() in CSS', !css.includes('gradient('));
check('no clamp() fluid type in CSS', !css.includes('clamp('));
check('no viewport-based font-size', !/font-size\s*:[^;}]*vw/i.test(css));
check('overflow-x protection present', /overflow-x\s*:\s*(clip|hidden)/.test(css));
check('prefers-reduced-motion handled', /prefers-reduced-motion/.test(css));
// Lightning CSS (Astro's minifier) rewrites `max-width` queries to `width<=Npx`; accept both.
check('breakpoint at 1024px present', /(max-width\s*:\s*1024px|width\s*<=\s*1024px)/.test(css));
check('breakpoint at 720px present', /(max-width\s*:\s*720px|width\s*<=\s*720px)/.test(css));
check('fonts self-hosted (no CDN font request)', css.includes('.woff2') && !/fonts\.(googleapis|gstatic)\.com/.test(css));

check('no @import in emitted CSS', !/@import/i.test(css));
const cssUrls = [...css.matchAll(/url\s*\(\s*["']?([^)"']+)["']?\s*\)/gi)].map((m) => m[1]);
const externalCssUrls = cssUrls.filter((u) => /^(https?:)?\/\//i.test(u) && !/(^\/\/|\/\/)nelodev\.ee\//i.test(u));
check('no external URLs in emitted CSS', externalCssUrls.length === 0, externalCssUrls.join(', '));
check('hero uses the local grid bitmap', cssUrls.some((url) => url.includes('hero-grid.png')));

check('skip link CSS present and hidden by default', /\.skip-link\{/.test(css) && /translateY\(-72px\)/.test(css));
check('skip link revealed on focus', /\.skip-link:focus-visible\{/.test(css) && /translateY\((?:0|0px)\)/.test(css));
check(
  ':focus-visible has visible outline',
  /:focus-visible[\s\S]{0,150}outline\s*:/.test(css) || /\.skip-link:focus-visible[\s\S]{0,150}outline\s*:/.test(css)
);

function paletteHex(name) {
  const m = new RegExp(`--color-${name}\\s*:\\s*#([0-9a-f]{6})`, 'i').exec(css);
  return m ? m[1] : null;
}
function luminance(hex) {
  const rgb = hex.match(/[0-9a-f]{2}/gi).map((v) => parseInt(v, 16) / 255);
  const lin = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WCAG_PAIRS = [
  ['ink', 'surface'],
  ['muted', 'surface'],
  ['blue', 'surface'],
  ['focus', 'surface'],
  ['ink', 'signal'],
];
for (const [fg, bg] of WCAG_PAIRS) {
  const fgHex = paletteHex(fg);
  const bgHex = paletteHex(bg);
  const missing = !fgHex ? fg : !bgHex ? bg : null;
  if (missing) {
    check(`WCAG contrast ${fg}/${bg} >= 4.5`, false, `--color-${missing} not found in CSS`);
    continue;
  }
  const ratio = contrastRatio(fgHex, bgHex);
  check(`WCAG contrast ${fg}/${bg} >= 4.5`, ratio >= 4.5, `${ratio.toFixed(3)}:1`);
}

// ---- Summary ----
console.log(`\n${passed.length} passed, ${failed.length} failed.`);
process.exitCode = failed.length === 0 ? 0 : 1;
