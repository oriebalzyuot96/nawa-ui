// Site-wide navigation, labels and the Pelagic icon used for each component category.
import type { IconName } from '@pelagic-ui/icons';
import type { Lang } from './packages';

export const repo = 'https://github.com/oriebalzyuot96/pelagic-ui';

/** Pelagic icon per component category (replaces emoji in the chrome). */
export const categoryIcon: Record<string, IconName> = {
  forms: 'edit',
  'advanced-forms': 'sliders',
  data: 'table',
  panels: 'columns',
  overlays: 'layers',
  menus: 'menu',
  media: 'image',
  feedback: 'bell',
  charts: 'chart-bar',
  '3d': 'orbit',
  motion: 'sparkles',
};

export interface NavItem {
  href: string;
  label: string;
  /** Section prefix that marks the item current. */
  match?: string;
}

export function mainNav(lang: Lang, base: string): NavItem[] {
  const ar = lang === 'ar';
  return [
    { href: `${base}/components/`, label: ar ? 'المكونات' : 'Components', match: `${base}/components/` },
    { href: ar ? `${base}/ar/packages/` : `${base}/packages/`, label: ar ? 'الحزم' : 'Packages' },
    { href: `${base}/themes/`, label: ar ? 'الثيمات' : 'Themes' },
    { href: `${base}/accessibility/`, label: ar ? 'إمكانية الوصول' : 'Accessibility', match: `${base}/accessibility` },
    { href: `${base}/space/`, label: ar ? 'المساحة' : 'Space' },
    { href: `${base}/getting-started/`, label: ar ? 'ابدأ' : 'Get started' },
  ];
}

export const accents = ['violet', 'teal', 'indigo', 'rose', 'amber', 'emerald', 'slate'] as const;

export const t = {
  en: {
    skip: 'Skip to content',
    home: 'Pelagic UI home',
    mainNav: 'Main',
    menu: 'Menu',
    search: 'Search',
    searchDocs: 'Search docs',
    appearance: 'Appearance',
    mode: 'Mode',
    modes: { system: 'System', light: 'Light', dark: 'Dark', hc: 'High contrast' },
    accent: 'Accent',
    shape: 'Shape',
    shapes: { sharp: 'Sharp', default: 'Default', round: 'Round' },
    animations: 'Animations',
    animOn: 'On',
    animPaused: 'Paused',
    a11y: 'Accessibility',
    otherLang: 'العربية',
    source: 'Source on GitHub',
    copy: 'Copy',
    copied: 'Copied',
    copiedSr: 'Copied to the clipboard',
    pm: 'Package manager',
  },
  ar: {
    skip: 'تخطَّ إلى المحتوى',
    home: 'الصفحة الرئيسية لبيلاجيك UI',
    mainNav: 'التنقل الرئيسي',
    menu: 'القائمة',
    search: 'بحث',
    searchDocs: 'ابحث في التوثيق',
    appearance: 'المظهر',
    mode: 'الوضع',
    modes: { system: 'النظام', light: 'فاتح', dark: 'داكن', hc: 'تباين عالٍ' },
    accent: 'اللون',
    shape: 'الشكل',
    shapes: { sharp: 'حاد', default: 'افتراضي', round: 'دائري' },
    animations: 'الحركة',
    animOn: 'تعمل',
    animPaused: 'متوقفة',
    a11y: 'إمكانية الوصول',
    otherLang: 'English',
    source: 'المصدر على GitHub',
    copy: 'نسخ',
    copied: 'تم النسخ',
    copiedSr: 'تم النسخ إلى الحافظة',
    pm: 'مدير الحزم',
  },
} as const;
