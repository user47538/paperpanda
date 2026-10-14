import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_ROOT = path.join(ROOT, "public", "language-vocabulary");
const LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"];
const LANGUAGES = {
  fr: { slug: "french", label: "French" },
  es: { slug: "spanish", label: "Spanish" }
};

function decodeHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseVocabularyPage(html, sourceUrl) {
  const listMatch = html.match(/<h2>The list \(([\d,]+) words\)<\/h2><ul>([\s\S]*?)<\/ul>/i);
  if (!listMatch) throw new Error(`Vocabulary list not found in ${sourceUrl}`);
  const declaredCount = Number(listMatch[1].replaceAll(",", ""));
  const entries = [...listMatch[2].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((match) => {
    const item = match[1];
    const word = decodeHtml(item.split(/<span>/i)[0]);
    const example = decodeHtml(item.match(/<q(?:\s[^>]*)?>([\s\S]*?)<\/q>/i)?.[1] || "");
    if (!word) throw new Error(`Empty vocabulary item in ${sourceUrl}`);
    return [word, example];
  });
  if (entries.length !== declaredCount) {
    throw new Error(`${sourceUrl} declares ${declaredCount} words but yielded ${entries.length}`);
  }
  return { declaredCount, entries };
}

for (const [languageId, language] of Object.entries(LANGUAGES)) {
  const languageDir = path.join(OUTPUT_ROOT, languageId);
  await mkdir(languageDir, { recursive: true });
  for (const level of LEVELS) {
    const sourceUrl = `https://minddory.com/${language.slug}-vocabulary-list/${level}`;
    const tempPath = `/tmp/paperpanda-minddory-${language.slug.slice(0, 2)}-${level}.html`;
    const html = await readFile(tempPath, "utf8");
    const { declaredCount, entries } = parseVocabularyPage(html, sourceUrl);
    const payload = {
      language: languageId,
      level: level.toUpperCase(),
      count: declaredCount,
      source: sourceUrl,
      attribution: `MindDory ${language.label} vocabulary list`,
      entries
    };
    await writeFile(path.join(languageDir, `${level}.json`), `${JSON.stringify(payload)}\n`, "utf8");
    console.log(`${languageId.toUpperCase()} ${level.toUpperCase()}: ${declaredCount}`);
  }
}
