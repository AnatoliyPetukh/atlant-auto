import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((items, value, index, values) => {
    if (value.startsWith("--")) items.push([value.slice(2), values[index + 1]]);
    return items;
  }, []),
);

const baseUrl = new URL(args.url || "https://atlantauto.pl/");
const outputRoot = path.resolve(args.out || "_backups/atlantauto-tilda");
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AtlantAutoBackup/1.0";
const pageUrls = new Set();
const assetQueue = [];
const queuedAssets = new Set();
const downloadedAssets = new Map();
const failures = [];

const htmlEntities = (value) =>
  value.replaceAll("&amp;", "&").replaceAll("&#38;", "&");

function safeSegment(value) {
  return decodeURIComponent(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\.+$/g, "_")
    .slice(0, 160);
}

function addQueryHash(filePath, search) {
  if (!search) return filePath;
  const parsed = path.parse(filePath);
  const hash = createHash("sha1").update(search).digest("hex").slice(0, 10);
  return path.join(parsed.dir, `${parsed.name}__${hash}${parsed.ext}`);
}

function localAssetPath(url) {
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map(safeSegment);
  let relativePath = path.join("assets", safeSegment(url.hostname), ...segments);
  if (url.pathname.endsWith("/") || segments.length === 0) {
    relativePath = path.join(relativePath, "index");
  }
  return addQueryHash(relativePath, url.search);
}

function localPagePath(url) {
  const clean = url.pathname.replace(/^\/+|\/+$/g, "");
  return clean ? path.join(clean, "index.html") : "index.html";
}

function normalizeUrl(raw, parentUrl) {
  const value = htmlEntities(String(raw || "").trim())
    .replace(/^['"]|['"]$/g, "")
    .trim();
  if (
    !value ||
    value.startsWith("#") ||
    /^(data|blob|javascript|mailto|tel):/i.test(value)
  ) {
    return null;
  }
  try {
    const url = new URL(value, parentUrl);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function enqueueAsset(raw, parentUrl) {
  const url = normalizeUrl(raw, parentUrl);
  if (!url || queuedAssets.has(url.href)) return;
  queuedAssets.add(url.href);
  assetQueue.push(url);
}

function extractCssUrls(css, parentUrl) {
  for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    enqueueAsset(match[2], parentUrl);
  }
  for (const match of css.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/gi)) {
    enqueueAsset(match[1], parentUrl);
  }
}

function extractHtmlAssets(html, parentUrl) {
  const attributePattern =
    /\b(?:src|poster|data-original|data-img-zoom-url|data-content-cover-bg|data-bg|data-src)\s*=\s*(['"])(.*?)\1/gi;
  for (const match of html.matchAll(attributePattern)) {
    enqueueAsset(match[2], parentUrl);
  }

  for (const match of html.matchAll(/\bsrcset\s*=\s*(['"])(.*?)\1/gi)) {
    for (const candidate of match[2].split(",")) {
      enqueueAsset(candidate.trim().split(/\s+/)[0], parentUrl);
    }
  }

  for (const match of html.matchAll(
    /<link\b[^>]*\b(?:href)\s*=\s*(['"])(.*?)\1[^>]*>/gi,
  )) {
    const tag = match[0];
    if (
      /\brel\s*=\s*(['"])(?:stylesheet|icon|preload|prefetch|manifest|apple-touch-icon)[^'"]*\1/i.test(
        tag,
      )
    ) {
      enqueueAsset(match[2], parentUrl);
    }
  }

  extractCssUrls(html, parentUrl);

  const staticUrlPattern =
    /(?:https?:)?\/\/[^\s"'<>\\)]+?\.(?:css|js|mjs|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|mp4|webm|pdf)(?:\?[^\s"'<>\\)]*)?/gi;
  for (const match of html.matchAll(staticUrlPattern)) {
    enqueueAsset(match[0], parentUrl);
  }
}

function contentExtension(contentType) {
  const type = String(contentType || "").split(";")[0].trim().toLowerCase();
  return (
    {
      "text/css": ".css",
      "application/javascript": ".js",
      "text/javascript": ".js",
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "font/woff": ".woff",
      "font/woff2": ".woff2",
      "application/pdf": ".pdf",
    }[type] || ""
  );
}

async function fetchResource(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": userAgent },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response;
}

async function discoverPages() {
  for (const name of ["robots.txt", "sitemap.xml"]) {
    const url = new URL(name, baseUrl);
    try {
      const response = await fetchResource(url);
      const text = await response.text();
      await writeFile(path.join(outputRoot, name), text, "utf8");
      if (name === "sitemap.xml") {
        for (const match of text.matchAll(/<loc>(.*?)<\/loc>/gi)) {
          const pageUrl = normalizeUrl(match[1], baseUrl);
          if (pageUrl && pageUrl.hostname === baseUrl.hostname) {
            pageUrl.protocol = baseUrl.protocol;
            pageUrls.add(pageUrl.href);
          }
        }
      }
    } catch (error) {
      failures.push({ url: url.href, error: String(error.message || error) });
    }
  }
  pageUrls.add(baseUrl.href);
}

async function downloadPages() {
  for (const href of pageUrls) {
    const url = new URL(href);
    try {
      const response = await fetchResource(url);
      const html = await response.text();
      const relativePath = localPagePath(url);
      const absolutePath = path.join(outputRoot, relativePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, html, "utf8");
      extractHtmlAssets(html, response.url || url.href);
    } catch (error) {
      failures.push({ url: href, error: String(error.message || error) });
    }
  }
}

async function downloadAssets() {
  for (let index = 0; index < assetQueue.length; index += 1) {
    const requestedUrl = assetQueue[index];
    try {
      const response = await fetchResource(requestedUrl);
      const finalUrl = new URL(response.url || requestedUrl.href);
      let relativePath = localAssetPath(finalUrl);
      if (!path.extname(relativePath)) {
        relativePath += contentExtension(response.headers.get("content-type"));
      }
      const absolutePath = path.join(outputRoot, relativePath);
      const bytes = Buffer.from(await response.arrayBuffer());
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, bytes);
      downloadedAssets.set(requestedUrl.href, {
        finalUrl: finalUrl.href,
        path: relativePath.replaceAll("\\", "/"),
        bytes: bytes.length,
        contentType: response.headers.get("content-type") || "",
      });
      if (
        /text\/css/i.test(response.headers.get("content-type") || "") ||
        finalUrl.pathname.toLowerCase().endsWith(".css")
      ) {
        extractCssUrls(bytes.toString("utf8"), finalUrl);
      }
    } catch (error) {
      failures.push({
        url: requestedUrl.href,
        error: String(error.message || error),
      });
    }
  }
}

await mkdir(outputRoot, { recursive: true });
await discoverPages();
await downloadPages();
await downloadAssets();

const manifest = {
  createdAt: new Date().toISOString(),
  source: baseUrl.href,
  note:
    "Static snapshot of the public Tilda site. The original HTML is preserved; downloaded resources are stored under assets/.",
  pages: [...pageUrls],
  assets: Object.fromEntries(downloadedAssets),
  failures,
};
await writeFile(
  path.join(outputRoot, "backup-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  JSON.stringify(
    {
      outputRoot,
      pages: pageUrls.size,
      assets: downloadedAssets.size,
      failures: failures.length,
    },
    null,
    2,
  ),
);
