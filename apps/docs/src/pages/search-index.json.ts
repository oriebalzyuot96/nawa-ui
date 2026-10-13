// Search index for the ⌘K command palette, generated at build time and fetched on first open.
import type { APIRoute } from 'astro';
import { categories } from '../data/catalog';
import { packages } from '../data/packages';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const clip = (s: string, n = 96) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export const GET: APIRoute = () => {
  const pages = [
    { t: 'Home', ta: 'الرئيسية', u: '/', d: 'Overview, live showcase and every package', da: 'نظرة عامة ومعاينة حية وكل الحزم' },
    { t: 'Home (Arabic)', ta: 'الصفحة الرئيسية بالعربية', u: '/ar/', d: 'العربية', da: 'العربية' },
    { t: 'Components', ta: 'المكونات', u: '/components/', d: 'Every component, grouped by category', da: 'كل المكونات مصنّفة' },
    { t: 'Packages', ta: 'الحزم', u: '/packages/', d: 'Install, imports, exports and sizes', da: 'التثبيت والاستيراد والتصدير والأحجام' },
    { t: 'Packages (Arabic)', ta: 'الحزم', u: '/ar/packages/', d: 'العربية', da: 'العربية' },
    { t: 'Get started', ta: 'ابدأ', u: '/getting-started/', d: 'Install and use your first component', da: 'ثبّت واستخدم أول مكوّن' },
    { t: 'Themes', ta: 'الثيمات', u: '/themes/', d: '21 themes, shapes and custom brand colors', da: '21 ثيماً وأشكال وألوان العلامة' },
    { t: 'Accessibility', ta: 'إمكانية الوصول', u: '/accessibility/', d: 'WCAG 2.2 AA commitment and checklist', da: 'الالتزام بـ WCAG 2.2 AA' },
    { t: 'Accessibility modes', ta: 'أوضاع إمكانية الوصول', u: '/accessibility-modes/', d: 'Contrast, color vision, text, reading and motion modes', da: 'أوضاع التباين والألوان والنص والقراءة والحركة' },
    { t: 'Pelagic Space', ta: 'بيلاجيك سبيس', u: '/space/', d: 'Drag-and-drop page builder', da: 'منشئ صفحات بالسحب والإفلات' },
  ].map((p) => ({ g: 'page', ...p, u: `${base}${p.u}` }));

  const cats = categories.map((c) => ({ g: 'category', t: c.h1, u: `${base}/components/${c.slug}/`, d: `${c.entries.length} components`, s: c.slug }));

  const comps = categories.flatMap((c) =>
    c.entries.map((e) => ({ g: 'component', t: e.name, u: `${base}/components/${c.slug}/#${e.id}`, d: clip(e.description), c: c.nav, s: c.slug })),
  );

  const pkgs = packages.map((p) => ({
    g: 'package',
    t: p.name,
    u: `${base}/packages/#${p.id}`,
    ua: `${base}/ar/packages/#${p.id}`,
    d: p.tagline.en,
    da: p.tagline.ar,
    k: p.mark,
  }));

  return new Response(JSON.stringify([...pages, ...pkgs, ...cats, ...comps]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
