/**
 * Verifies that every internal link in the docs resolves in the built site.
 *
 * Run after `astro build`. For each Markdown/MDX page under src/content/docs
 * it extracts root-relative links (`](/path)`) and same-page anchors
 * (`](#id)`), then checks that the target page exists in `dist` and, when a
 * fragment is present, that an element with that id exists on the page.
 * External links are ignored. Exits non-zero if anything is broken.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const DOCS_ROOT = "src/content/docs";
const DIST_ROOT = "dist";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(md|mdx)$/.test(name) ? [full] : [];
  });

/** Map a source file to the URL path Astro builds it at. */
const sourceToUrlPath = (file: string): string => {
  const rel = path
    .relative(DOCS_ROOT, file)
    .replace(/\.(md|mdx)$/, "")
    .replace(/(^|\/)index$/, "");
  return "/" + rel.split("/").map(slugifySegment).filter(Boolean).join("/");
};

/** Mirror Astro's per-segment slugification so title-cased dirs resolve. */
const slugifySegment = (segment: string): string =>
  segment
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");

const builtPage = (urlPath: string): string =>
  path.join(DIST_ROOT, urlPath, "index.html");

const idsCache = new Map<string, Set<string>>();
const idsIn = (htmlFile: string): Set<string> => {
  let ids = idsCache.get(htmlFile);
  if (!ids) {
    const html = readFileSync(htmlFile, "utf8");
    ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1] ?? ""));
    idsCache.set(htmlFile, ids);
  }
  return ids;
};

const LINK_PATTERN = /\]\(((?:\/|#)[^)\s]*)\)/g;

let checked = 0;
const broken: string[] = [];

for (const file of walk(DOCS_ROOT)) {
  const source = readFileSync(file, "utf8");
  const ownUrl = sourceToUrlPath(file);

  for (const match of source.matchAll(LINK_PATTERN)) {
    const target = match[1] ?? "";
    checked++;

    const [rawPath, fragment] = target.split("#");
    const urlPath = rawPath ? rawPath.replace(/\/$/, "") : ownUrl;
    const page = builtPage(urlPath);

    if (!existsSync(page)) {
      broken.push(`${file}: ${target} (no page at ${urlPath}/)`);
      continue;
    }
    if (fragment && !idsIn(page).has(fragment)) {
      broken.push(`${file}: ${target} (no #${fragment} on ${urlPath}/)`);
    }
  }
}

console.log(`check-links: ${checked} internal links checked`);
if (broken.length) {
  console.error(broken.join("\n"));
  process.exit(1);
}
console.log("check-links: all links resolve");
