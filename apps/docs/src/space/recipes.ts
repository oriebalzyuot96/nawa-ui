/**
 * Recipe data for "Describe what you need". Pure data: the engine (engine.ts) tokenizes a description,
 * matches the keywords below (English and Arabic), and assembles blocks from blocks.ts.
 *
 * To add a page type: append a PageRecipe to PAGE_RECIPES.
 * To teach a new section word: append keywords to an entry of BLOCK_INTENTS (or add an entry).
 * Keywords are matched after normalization (lowercase, Arabic letter folding, plural/prefix stripping),
 * so list the singular / simplest form; multi-word phrases are fine.
 */
import type { BlockId, BlockParams } from './blocks';
import type { Accent, CanvasMode, Density, Shape } from './types';

export interface BlockRef {
  block: BlockId;
  params?: Partial<BlockParams>;
}

/** A row places two blocks side by side on wide screens. */
export type RecipeItem = BlockRef | { row: BlockRef[] };

export interface PageRecipe {
  id: string;
  label: string;
  labelAr: string;
  icon: string;
  keywords: string[];
  title: { en: string; ar: string };
  /** 'app' wraps everything in one padded section (dashboards, settings); 'site' stacks full-width sections. */
  layout: 'site' | 'app';
  items: RecipeItem[];
}

export interface BlockIntent {
  block: BlockId;
  keywords: string[];
  /** Words that carry a count for this block ("3 plans", "10 rows"). The keywords themselves always do. */
  countNouns?: string[];
}

export const PAGE_RECIPES: PageRecipe[] = [
  {
    id: 'login',
    label: 'Login page',
    labelAr: 'صفحة تسجيل الدخول',
    icon: 'login',
    keywords: ['login', 'log in', 'sign in', 'signin', 'authentication', 'auth page', 'تسجيل دخول', 'تسجيل الدخول', 'دخول'],
    title: { en: 'Sign in', ar: 'تسجيل الدخول' },
    layout: 'site',
    items: [{ block: 'login', params: { captcha: false } }],
  },
  {
    id: 'signup',
    label: 'Sign-up page',
    labelAr: 'صفحة إنشاء حساب',
    icon: 'login',
    keywords: ['signup', 'sign up', 'register', 'registration', 'create account', 'انشاء حساب', 'حساب جديد', 'تسجيل'],
    title: { en: 'Create account', ar: 'إنشاء حساب' },
    layout: 'site',
    items: [{ block: 'signup' }],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelAr: 'لوحة تحكم',
    icon: 'kpis',
    keywords: ['dashboard', 'admin', 'admin panel', 'analytics', 'overview', 'report', 'control panel', 'لوحه تحكم', 'لوحه القياده', 'لوحه', 'تحليلات', 'تقرير'],
    title: { en: 'Dashboard', ar: 'لوحة التحكم' },
    layout: 'app',
    items: [{ block: 'pageHeader' }, { block: 'kpis' }, { row: [{ block: 'chart' }, { block: 'activity' }] }, { block: 'table' }],
  },
  {
    id: 'pricing',
    label: 'Pricing page',
    labelAr: 'صفحة الأسعار',
    icon: 'pricing',
    keywords: ['pricing', 'price', 'subscription', 'billing plans', 'اسعار', 'سعر', 'اشتراك'],
    title: { en: 'Pricing', ar: 'الأسعار' },
    layout: 'site',
    items: [{ block: 'navbar' }, { block: 'pricing' }, { block: 'faq' }, { block: 'cta' }, { block: 'footer' }],
  },
  {
    id: 'settings',
    label: 'Settings page',
    labelAr: 'صفحة الإعدادات',
    icon: 'settings',
    keywords: ['settings', 'preferences', 'account settings', 'profile settings', 'configuration', 'اعدادات', 'تفضيلات', 'ضبط'],
    title: { en: 'Settings', ar: 'الإعدادات' },
    layout: 'app',
    items: [{ block: 'pageHeader' }, { block: 'settings' }],
  },
  {
    id: 'landing',
    label: 'Landing page',
    labelAr: 'صفحة هبوط',
    icon: 'hero',
    keywords: ['landing', 'homepage', 'home page', 'marketing', 'website', 'startup', 'saas', 'product page', 'صفحه هبوط', 'الصفحه الرئيسيه', 'موقع', 'تسويق'],
    title: { en: 'Acme', ar: 'أكمي' },
    layout: 'site',
    items: [{ block: 'navbar' }, { block: 'hero' }, { block: 'features' }, { block: 'testimonial' }, { block: 'cta' }, { block: 'footer' }],
  },
  {
    id: 'empty',
    label: 'Empty state page',
    labelAr: 'صفحة حالة فارغة',
    icon: 'empty',
    keywords: ['empty state', 'empty page', 'empty', 'no results', 'zero state', 'not found', '404', 'nothing here', 'فارغ', 'حاله فارغه', 'لا توجد نتائج', 'غير موجود'],
    title: { en: 'Projects', ar: 'المشاريع' },
    layout: 'site',
    items: [{ block: 'navbar' }, { block: 'empty' }],
  },
  {
    id: 'contact',
    label: 'Contact page',
    labelAr: 'صفحة التواصل',
    icon: 'input',
    keywords: ['contact', 'contact us', 'get in touch', 'support page', 'اتصل', 'تواصل', 'اتصل بنا'],
    title: { en: 'Contact', ar: 'تواصل معنا' },
    layout: 'site',
    items: [{ block: 'navbar' }, { block: 'contact' }, { block: 'footer' }],
  },
  {
    id: 'onboarding',
    label: 'Onboarding wizard',
    labelAr: 'معالج البدء',
    icon: 'stepper',
    keywords: ['onboarding', 'wizard', 'setup flow', 'checkout', 'multi step', 'معالج', 'خطوات البدء', 'اعداد الحساب'],
    title: { en: 'Get set up', ar: 'لنبدأ' },
    layout: 'site',
    items: [{ block: 'onboarding' }],
  },
  {
    id: 'profile',
    label: 'Profile page',
    labelAr: 'صفحة الملف الشخصي',
    icon: 'avatar',
    keywords: ['profile', 'user page', 'my account', 'الملف الشخصي', 'ملفي', 'حسابي'],
    title: { en: 'Profile', ar: 'الملف الشخصي' },
    layout: 'app',
    items: [{ block: 'pageHeader' }, { block: 'profile' }, { block: 'activity' }],
  },
  {
    id: 'help',
    label: 'Help center',
    labelAr: 'مركز المساعدة',
    icon: 'faq',
    keywords: ['help center', 'help', 'faq page', 'knowledge base', 'مركز المساعده', 'مساعده'],
    title: { en: 'Help center', ar: 'مركز المساعدة' },
    layout: 'site',
    items: [{ block: 'navbar' }, { block: 'faq', params: { count: 6 } }, { block: 'contact' }, { block: 'footer' }],
  },
];

export const BLOCK_INTENTS: BlockIntent[] = [
  { block: 'kpis', keywords: ['kpi', 'metric', 'stat', 'statistic', 'key number', 'scorecard', 'مؤشر', 'مؤشرات', 'احصائيه', 'احصائيات', 'ارقام'] },
  { block: 'chart', keywords: ['chart', 'graph', 'plot', 'visualization', 'trend', 'رسم بياني', 'رسم', 'مخطط', 'بياني'] },
  { block: 'table', keywords: ['table', 'datatable', 'data table', 'data grid', 'جدول'], countNouns: ['row', 'record', 'entry', 'صف', 'صفوف', 'سجل'] },
  { block: 'pricing', keywords: ['pricing table', 'plan', 'tier', 'package', 'خطه', 'خطط', 'باقه', 'باقات'] },
  { block: 'faq', keywords: ['faq', 'question', 'accordion', 'الاسئله الشائعه', 'اسئله', 'سؤال'] },
  { block: 'features', keywords: ['feature', 'benefit', 'feature grid', 'مزايا', 'ميزه', 'ميزات', 'مميزات'] },
  { block: 'testimonial', keywords: ['testimonial', 'review', 'quote', 'social proof', 'شهاده', 'شهادات', 'اراء العملاء', 'تقييمات'] },
  { block: 'hero', keywords: ['hero', 'headline', 'banner', 'قسم رئيسي', 'بانر', 'عنوان رئيسي'] },
  { block: 'navbar', keywords: ['navbar', 'navigation', 'nav bar', 'menu', 'header', 'شريط التنقل', 'قائمه', 'ترويسه'] },
  { block: 'footer', keywords: ['footer', 'تذييل'] },
  { block: 'cta', keywords: ['cta', 'call to action', 'دعوه'] },
  { block: 'settings', keywords: ['tab', 'tabs', 'تبويب', 'تبويبات'] },
  { block: 'activity', keywords: ['activity', 'timeline', 'feed', 'history', 'نشاط', 'سجل النشاط', 'خط زمني'] },
  { block: 'gallery', keywords: ['gallery', 'carousel', 'slider', 'photo', 'image', 'معرض', 'صور', 'شرائح'] },
  { block: 'onboarding', keywords: ['stepper', 'step', 'خطوه', 'خطوات'] },
  { block: 'notice', keywords: ['alert', 'notice', 'announcement', 'تنبيه', 'اعلان'] },
  { block: 'contact', keywords: ['contact form', 'نموذج تواصل'] },
  { block: 'signup', keywords: ['sign up form', 'registration form', 'نموذج تسجيل'] },
];

/** Words that turn on the captcha placeholder in forms. */
export const CAPTCHA_WORDS = ['captcha', 'recaptcha', 'hcaptcha', 'turnstile', 'robot', 'bot protection', 'human check', 'كابتشا', 'كابتشا', 'روبوت', 'التحقق البشري'];

export const CHART_KIND_WORDS: Record<'bar' | 'line' | 'area' | 'donut', string[]> = {
  bar: ['bar', 'column', 'histogram', 'اعمده', 'شريطي'],
  line: ['line', 'trend line', 'خطي'],
  area: ['area', 'مساحي'],
  donut: ['donut', 'doughnut', 'pie', 'كعكي', 'فطيره'],
};

export const MODE_WORDS: Record<Exclude<CanvasMode, 'page'>, string[]> = {
  dark: ['dark', 'dark mode', 'dark theme', 'night', 'dim', 'داكن', 'مظلم', 'ليلي', 'الوضع الداكن'],
  light: ['light', 'light mode', 'light theme', 'bright', 'فاتح', 'نهاري'],
  hc: ['high contrast', 'contrast', 'تباين', 'تباين عالي'],
};

export const ACCENT_WORDS: Record<Accent, string[]> = {
  violet: ['violet', 'purple', 'بنفسجي'],
  teal: ['teal', 'turquoise', 'cyan', 'تركوازي', 'فيروزي'],
  indigo: ['indigo', 'blue', 'navy', 'نيلي', 'ازرق'],
  rose: ['rose', 'pink', 'red', 'وردي', 'احمر'],
  amber: ['amber', 'orange', 'yellow', 'gold', 'كهرماني', 'برتقالي', 'اصفر', 'ذهبي'],
  emerald: ['emerald', 'green', 'زمردي', 'اخضر'],
  slate: ['slate', 'gray', 'grey', 'monochrome', 'رمادي'],
};

export const SHAPE_WORDS: Record<Exclude<Shape, 'default'>, string[]> = {
  round: ['rounded', 'round', 'soft', 'pill', 'friendly', 'مستدير', 'دائري', 'ناعم'],
  sharp: ['sharp', 'square', 'boxy', 'angular', 'حاد', 'مربع'],
};

export const DENSITY_WORDS: Record<Exclude<Density, 'comfortable'>, string[]> = {
  compact: ['compact', 'dense', 'tight', 'condensed', 'مضغوط', 'مكثف'],
};

/** Content in Arabic and right-to-left layout. */
export const ARABIC_WORDS = ['arabic', 'in arabic', 'عربي', 'العربيه', 'بالعربي'];
/** Right-to-left layout only. */
export const RTL_WORDS = ['rtl', 'right to left', 'من اليمين الى اليسار'];

export const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  single: 1, couple: 2, pair: 2, few: 3, several: 4,
  واحد: 1, واحده: 1, اثنين: 2, اثنان: 2, اثنتين: 2, ثلاث: 3, ثلاثه: 3, اربع: 4, اربعه: 4, خمس: 5, خمسه: 5,
  ست: 6, سته: 6, سبع: 7, سبعه: 7, ثماني: 8, ثمانيه: 8, تسع: 9, تسعه: 9, عشر: 10, عشره: 10,
};

/** Never used as a topic word ("a dashboard WITH …"). */
export const STOPWORDS = [
  'a', 'an', 'the', 'with', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'my', 'our', 'your', 'some', 'page', 'screen', 'view', 'section', 'simple', 'modern', 'clean', 'nice', 'beautiful', 'big', 'small', 'large', 'new', 'create', 'make', 'build', 'need', 'want', 'please', 'show', 'add', 'using', 'theme', 'mode', 'style', 'card', 'cards', 'block',
  'مع', 'و', 'في', 'من', 'الى', 'على', 'صفحه', 'شاشه', 'قسم', 'بسيط', 'بسيطه', 'حديث', 'حديثه', 'جميل', 'جميله', 'اريد', 'انشئ', 'اصنع', 'ثيم', 'وضع', 'نمط', 'بطاقه', 'بطاقات', 'لل', 'ل',
];

export const EXAMPLES = [
  'login page with captcha and dark theme',
  'sales dashboard with 4 KPIs, revenue chart and orders table',
  'pricing page with 3 plans',
  'settings page with tabs',
  'صفحة هبوط بالعربي مع مزايا وأسئلة شائعة',
  'لوحة تحكم مع ٣ مؤشرات ورسم بياني وجدول الطلبات',
];
