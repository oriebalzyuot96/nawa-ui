/**
 * Deterministic, offline "describe it, see it" engine. No network, no model:
 *   1. normalize + tokenize the description (English and Arabic),
 *   2. match recipe / block / modifier keywords from recipes.ts,
 *   3. return an editable Understanding (shown as chips),
 *   4. generate() assembles a SpaceDoc from blocks.ts.
 */
import { BLOCKS, type BlockId, type BlockParams } from './blocks';
import {
  ACCENT_WORDS,
  ARABIC_WORDS,
  BLOCK_INTENTS,
  CAPTCHA_WORDS,
  CHART_KIND_WORDS,
  DENSITY_WORDS,
  MODE_WORDS,
  NUMBER_WORDS,
  PAGE_RECIPES,
  RTL_WORDS,
  SHAPE_WORDS,
  STOPWORDS,
  type BlockRef,
  type PageRecipe,
  type RecipeItem,
} from './recipes';
import { tpl } from './registry';
import { cloneFresh } from './tree';
import { DEFAULT_THEME, type Accent, type CanvasMode, type Density, type Lang, type Shape, type SpaceDoc, type SpaceNode } from './types';

export interface BlockMention {
  block: BlockId;
  count?: number;
  subject?: string;
  chartKind?: BlockParams['chartKind'];
}

export interface Understanding {
  page: string | null;
  /** Topic word, e.g. "sales" in "sales dashboard" or "invoices" in "empty state for invoices". */
  topic?: string;
  /** True when the topic came right before the page keyword (it then prefixes the page title). */
  topicBefore?: boolean;
  blocks: BlockMention[];
  mode?: Exclude<CanvasMode, 'page'>;
  accent?: Accent;
  shape?: Exclude<Shape, 'default'>;
  density?: Exclude<Density, 'comfortable'>;
  rtl: boolean;
  lang: Lang;
  captcha: boolean;
  /** True when nothing was recognised and a fallback was used. */
  fallback: boolean;
}

/* ---------------- Normalization ---------------- */

const ARABIC_RE = /[؀-ۿ]/;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[ً-ْـ]/g, '') // tashkeel + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9؀-ۿ]+/)
    .filter(Boolean);
}

const AR_PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب'];

/** Reduce a token to a comparable stem: strips Arabic prefixes/plural suffix and English plurals. */
export function stem(token: string): string {
  let t = token;
  if (ARABIC_RE.test(t)) {
    for (const p of AR_PREFIXES) {
      if (t.startsWith(p) && t.length - p.length >= 3) {
        t = t.slice(p.length);
        break;
      }
    }
    if (t.length > 4 && t.endsWith('ات')) t = t.slice(0, -2);
    return t;
  }
  if (t.length > 4 && t.endsWith('ies')) return `${t.slice(0, -3)}y`;
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

interface Hit {
  start: number;
  end: number; // exclusive
  length: number;
}

/** All positions where `phrase` (one or more words) occurs in the stemmed token list. */
function findPhrase(stems: string[], phrase: string): Hit[] {
  const words = tokenize(phrase).map(stem);
  if (!words.length) return [];
  const hits: Hit[] = [];
  for (let i = 0; i + words.length <= stems.length; i++) {
    if (words.every((w, k) => stems[i + k] === w)) hits.push({ start: i, end: i + words.length, length: words.join(' ').length });
  }
  return hits;
}

function bestHit(stems: string[], phrases: string[]): Hit | null {
  let best: Hit | null = null;
  for (const p of phrases) {
    for (const h of findPhrase(stems, p)) if (!best || h.length > best.length) best = h;
  }
  return best;
}

function parseNumber(token: string | undefined): number | undefined {
  if (!token) return undefined;
  if (/^\d{1,2}$/.test(token)) return Number(token);
  const n = NUMBER_WORDS[token] ?? NUMBER_WORDS[stem(token)];
  return n;
}

const STOP = new Set(STOPWORDS.map((w) => normalize(w)));

function isTopicWord(token: string | undefined, keywordStems: Set<string>): token is string {
  if (!token) return false;
  if (STOP.has(token) || keywordStems.has(stem(token))) return false;
  if (parseNumber(token) !== undefined) return false;
  return token.length > 2;
}

/* ---------------- Understanding ---------------- */

export function understand(text: string): Understanding {
  const tokens = tokenize(text);
  const stems = tokens.map(stem);
  const arabicInput = ARABIC_RE.test(text);
  const allKeywordStems = new Set(
    [
      ...PAGE_RECIPES.flatMap((r) => r.keywords),
      ...BLOCK_INTENTS.flatMap((b) => b.keywords),
      ...CAPTCHA_WORDS,
      ...[MODE_WORDS, ACCENT_WORDS, SHAPE_WORDS, DENSITY_WORDS, CHART_KIND_WORDS].flatMap((m) => Object.values(m).flat()),
      ...ARABIC_WORDS,
      ...RTL_WORDS,
    ].flatMap((k) => tokenize(k).map(stem)),
  );

  // Page type: the recipe with the longest keyword match wins.
  let page: PageRecipe | null = null;
  let pageHit: Hit | null = null;
  for (const r of PAGE_RECIPES) {
    const h = bestHit(stems, r.keywords);
    if (h && (!pageHit || h.length > pageHit.length)) {
      page = r;
      pageHit = h;
    }
  }
  let topic: string | undefined;
  let topicBefore = false;
  if (page && pageHit) {
    const prev = tokens[pageHit.start - 1];
    if (!ARABIC_RE.test(prev ?? '') && isTopicWord(prev, allKeywordStems)) {
      topic = prev;
      topicBefore = true;
    }
  }
  // "… for invoices" / "… of products" names the subject of the page.
  if (!topic) {
    const at = tokens.findIndex((t, i) => (t === 'for' || t === 'of') && isTopicWord(tokens[i + 1], allKeywordStems));
    if (at >= 0) topic = tokens[at + 1];
  }

  // Block mentions with counts and topic words.
  const blocks: BlockMention[] = [];
  const used = new Set<number>();
  if (pageHit) for (let i = pageHit.start; i < pageHit.end; i++) used.add(i);
  for (const intent of BLOCK_INTENTS) {
    const hits = intent.keywords.flatMap((k) => findPhrase(stems, k)).filter((h) => !used.has(h.start));
    const countHits = (intent.countNouns ?? []).flatMap((k) => findPhrase(stems, k));
    if (!hits.length) continue;
    const h = hits.sort((a, b) => b.length - a.length)[0];
    for (let i = h.start; i < h.end; i++) used.add(i);
    const mention: BlockMention = { block: intent.block };
    // Count: a number up to 3 tokens before the keyword (or before a count noun).
    for (const anchor of [h, ...countHits]) {
      for (let back = 1; back <= 3 && mention.count === undefined; back++) mention.count = parseNumber(tokens[anchor.start - back]);
      if (mention.count !== undefined) break;
    }
    // Topic: English puts it before the noun ("revenue chart"), Arabic after ("جدول الطلبات").
    const kwArabic = ARABIC_RE.test(tokens[h.start] ?? '');
    const candidate = kwArabic ? tokens[h.end] : tokens[h.start - 1];
    if (isTopicWord(candidate, allKeywordStems) && !Object.values(CHART_KIND_WORDS).flat().includes(candidate)) {
      mention.subject = kwArabic ? candidate.replace(/^(ال|لل)/, '') : candidate;
      if (kwArabic) mention.subject = tokensOriginal(text, candidate) ?? mention.subject;
    }
    if (intent.block === 'chart') {
      for (const [kind, words] of Object.entries(CHART_KIND_WORDS)) {
        if (bestHit(stems, words)) {
          mention.chartKind = kind as BlockMention['chartKind'];
          break;
        }
      }
    }
    blocks.push(mention);
  }

  const pick = <K extends string>(map: Record<K, string[]>): K | undefined => {
    let best: { k: K; len: number } | undefined;
    for (const [k, words] of Object.entries(map) as Array<[K, string[]]>) {
      const h = bestHit(stems, words);
      if (h && (!best || h.length > best.len)) best = { k, len: h.length };
    }
    return best?.k;
  };

  const arabicWord = Boolean(bestHit(stems, ARABIC_WORDS));
  const lang: Lang = arabicInput || arabicWord ? 'ar' : 'en';
  const rtl = lang === 'ar' || Boolean(bestHit(stems, RTL_WORDS));
  const captcha = Boolean(bestHit(stems, CAPTCHA_WORDS));
  const fallback = !page && !blocks.length;

  return {
    page: page?.id ?? (fallback ? 'landing' : null),
    topic,
    topicBefore,
    blocks,
    mode: pick(MODE_WORDS),
    accent: pick(ACCENT_WORDS),
    shape: pick(SHAPE_WORDS),
    density: pick(DENSITY_WORDS),
    rtl,
    lang,
    captcha,
    fallback,
  };
}

/** Recover the original (non-normalized) spelling of an Arabic word for display. */
function tokensOriginal(text: string, normalizedToken: string): string | undefined {
  const raw = text.split(/[^\p{L}\p{N}]+/u).find((w) => normalize(w) === normalizedToken);
  return raw;
}

/* ---------------- Generation ---------------- */

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function recipeById(id: string | null): PageRecipe | undefined {
  return PAGE_RECIPES.find((r) => r.id === id);
}

function isRow(item: RecipeItem): item is { row: BlockRef[] } {
  return 'row' in item;
}

export function generate(u: Understanding): SpaceDoc {
  const recipe = recipeById(u.page);
  const lang = u.lang;
  const title = recipe ? (u.topic && u.topicBefore ? `${cap(u.topic)} ${recipe.title.en.toLowerCase()}` : u.topic && lang === 'en' ? `${recipe.title.en} · ${cap(u.topic)}` : recipe.title[lang]) : undefined;
  const items: RecipeItem[] = recipe ? structuredClone(recipe.items) : [];
  const allRefs = () => items.flatMap((i) => (isRow(i) ? i.row : [i]));

  for (const m of u.blocks) {
    const existing = allRefs().find((r) => r.block === m.block);
    const params: Partial<BlockParams> = {
      ...(m.count !== undefined ? { count: m.count } : {}),
      ...(m.subject ? { subject: m.subject } : {}),
      ...(m.chartKind ? { chartKind: m.chartKind } : {}),
    };
    if (existing) existing.params = { ...existing.params, ...params };
    else {
      const footerAt = items.findIndex((i) => !isRow(i) && i.block === 'footer');
      const ref: BlockRef = { block: m.block, params };
      if (footerAt >= 0) items.splice(footerAt, 0, ref);
      else items.push(ref);
    }
  }

  if (u.captcha) {
    const forms = allRefs().filter((r) => r.block === 'login' || r.block === 'signup' || r.block === 'contact');
    if (forms.length) forms.forEach((f) => (f.params = { ...f.params, captcha: true }));
    else items.push({ block: 'contact', params: { captcha: true } });
  }
  if (!items.length) items.push({ block: 'hero' });

  const build = (ref: BlockRef): SpaceNode[] =>
    BLOCKS[ref.block].build({ lang, ...(ref.block === 'pageHeader' ? { title } : {}), ...(ref.block === 'empty' && u.topic ? { subject: u.topic } : {}), ...ref.params });

  let nodes: SpaceNode[] = items.flatMap((item) => {
    if (!isRow(item)) return build(item);
    return [tpl('grid', { columns: item.row.length, gap: 'lg', align: 'start' }, item.row.map((r) => {
      const built = build(r);
      return built.length === 1 ? built[0] : tpl('stack', { gap: 'md' }, built);
    }))];
  });

  if (recipe?.layout === 'app') nodes = [tpl('section', { padding: 'sm', width: 'wide', gap: 'lg' }, nodes)];

  return {
    version: 1,
    name: title ?? recipe?.label ?? 'Generated page',
    theme: {
      mode: u.mode ?? DEFAULT_THEME.mode,
      accent: u.accent ?? DEFAULT_THEME.accent,
      shape: u.shape ?? DEFAULT_THEME.shape,
      density: u.density ?? DEFAULT_THEME.density,
    },
    rtl: u.rtl,
    lang,
    nodes: nodes.map(cloneFresh),
  };
}
