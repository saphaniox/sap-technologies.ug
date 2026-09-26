import { readFile } from "node:fs/promises";

const SITE_URL = "https://saptechug.com";
const INDEXNOW_API_URL = "https://api.indexnow.org/indexnow";
const KEY_FILE_NAME = "0bbbeda2370f85cb5fa45439cbebe8fd.txt";
const dryRun = process.argv.includes("--dry-run");

const decodeXml = (value) => value
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, "&");

const extractLocations = (xml) => [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
  .map((match) => decodeXml(match[1].trim()))
  .filter(Boolean);

const normalizeSiteUrl = (value) => {
  const url = new URL(value);
  if (url.origin !== SITE_URL) {
    throw new Error(`Refusing to submit a URL outside ${SITE_URL}: ${value}`);
  }
  return url.pathname === "/" && !url.search && !url.hash ? SITE_URL : url.href;
};

const responseOrThrow = async (response, label) => {
  if (response.ok) return response;
  const body = await response.text();
  throw new Error(`${label} failed (${response.status}): ${body.slice(0, 500)}`);
};

const localSitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const requiredStaticUrls = extractLocations(localSitemap).map(normalizeSiteUrl);
const publishedSitemapResponse = await responseOrThrow(
  await fetch(`${SITE_URL}/sitemap.xml`),
  "Published sitemap"
);
const urls = [...new Set(
  extractLocations(await publishedSitemapResponse.text()).map(normalizeSiteUrl)
)];

if (!urls.length) {
  throw new Error("The published sitemap did not contain any URLs.");
}

if (dryRun) {
  console.log(`Dry run: ${urls.length} URLs are ready for IndexNow.`);
  for (const value of urls) console.log(value);
  process.exit(0);
}

const key = (await readFile(new URL(`../public/${KEY_FILE_NAME}`, import.meta.url), "utf8")).trim();
const keyLocation = `${SITE_URL}/${KEY_FILE_NAME}`;
const keyResponse = await responseOrThrow(await fetch(keyLocation), "IndexNow key verification");
if ((await keyResponse.text()).trim() !== key) {
  throw new Error(`The deployed IndexNow key file does not match ${KEY_FILE_NAME}.`);
}

const publishedUrls = new Set(urls);
const missingUrls = requiredStaticUrls.filter((value) => !publishedUrls.has(value));
if (missingUrls.length) {
  throw new Error(`The published sitemap is missing ${missingUrls.length} URLs. Deploy the latest sitemap before submitting.`);
}

for (let offset = 0; offset < urls.length; offset += 10_000) {
  const urlList = urls.slice(offset, offset + 10_000);
  const response = await fetch(INDEXNOW_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation,
      urlList
    })
  });

  await responseOrThrow(response, "IndexNow submission");
  console.log(`IndexNow accepted ${urlList.length} URLs (HTTP ${response.status}).`);
}