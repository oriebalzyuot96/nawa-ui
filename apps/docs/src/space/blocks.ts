/**
 * Ready-made sections. Each block builds a small node tree from parameters, so the palette,
 * the starter templates and the "Describe" recipe engine all share one implementation.
 * Copy is available in English and Arabic.
 */
import { tpl as n } from './registry';
import type { Lang, SpaceNode } from './types';

export type BlockId =
  | 'navbar'
  | 'hero'
  | 'features'
  | 'pricing'
  | 'login'
  | 'signup'
  | 'kpis'
  | 'chart'
  | 'table'
  | 'activity'
  | 'faq'
  | 'testimonial'
  | 'cta'
  | 'footer'
  | 'settings'
  | 'empty'
  | 'contact'
  | 'pageHeader'
  | 'gallery'
  | 'notice'
  | 'profile'
  | 'onboarding';

export interface BlockParams {
  lang: Lang;
  /** How many items (plans, KPIs, features, …) when the block is countable. */
  count?: number;
  /** Topic word from the description, e.g. "sales" or "orders". */
  subject?: string;
  /** Extra flags such as captcha on login forms. */
  captcha?: boolean;
  /** Page title used by headers and heroes. */
  title?: string;
  chartKind?: 'bar' | 'line' | 'area' | 'donut';
}

export interface BlockDef {
  id: BlockId;
  label: string;
  labelAr: string;
  icon: string;
  description: string;
  /** Shown in the palette's Blocks group. */
  palette: boolean;
  countable?: { min: number; max: number; default: number; noun: string };
  build: (p: BlockParams) => SpaceNode[];
}

const t = (lang: Lang, en: string, ar: string) => (lang === 'ar' ? ar : en);
const clamp = (v: number | undefined, d: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v ?? d)));
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const FEATURES = [
  ['⚡', 'Fast by default', 'Pages load in under a second on any network.', 'سريع افتراضيًا', 'تُحمَّل الصفحات في أقل من ثانية على أي شبكة.'],
  ['♿', 'Accessible', 'WCAG 2.2 AA components with full keyboard support.', 'سهل الوصول', 'مكونات متوافقة مع WCAG 2.2 AA مع دعم كامل للوحة المفاتيح.'],
  ['🎨', 'Themeable', 'Light, dark and high contrast with seven accents.', 'قابل للتخصيص', 'وضع فاتح وداكن وتباين عالٍ مع سبعة ألوان.'],
  ['🌍', 'RTL ready', 'Layouts mirror correctly in Arabic and Hebrew.', 'جاهز للعربية', 'التخطيطات تنعكس بشكل صحيح من اليمين إلى اليسار.'],
  ['🔒', 'Secure', 'SSO, audit logs and role-based access built in.', 'آمن', 'تسجيل دخول موحد وسجلات تدقيق وصلاحيات حسب الدور.'],
  ['📊', 'Insightful', 'Accessible charts with data tables for every metric.', 'رؤى واضحة', 'رسوم بيانية سهلة الوصول مع جداول بيانات لكل مؤشر.'],
  ['🤝', 'Collaborative', 'Comments, mentions and shared workspaces.', 'تعاوني', 'تعليقات وإشارات ومساحات عمل مشتركة.'],
  ['🧩', 'Integrations', 'Connect Slack, GitHub and 40 more tools.', 'تكاملات', 'اربط Slack وGitHub وأكثر من 40 أداة.'],
];

const PLANS = [
  ['Starter', 'المبتدئ', '$0', 'Free forever for individuals', 'مجاني دائمًا للأفراد', ['1 project', '5 GB storage', 'Community support'], ['مشروع واحد', 'مساحة 5 جيجابايت', 'دعم المجتمع']],
  ['Pro', 'الاحترافي', '$24', 'For growing teams', 'للفرق النامية', ['Unlimited projects', '100 GB storage', 'Priority support', 'Advanced analytics'], ['مشاريع غير محدودة', 'مساحة 100 جيجابايت', 'دعم ذو أولوية', 'تحليلات متقدمة']],
  ['Business', 'الأعمال', '$79', 'For organisations at scale', 'للمؤسسات الكبيرة', ['Everything in Pro', 'SSO and audit logs', 'Dedicated manager', '99.9% uptime SLA'], ['كل ما في الاحترافي', 'دخول موحد وسجلات تدقيق', 'مدير حساب مخصص', 'ضمان تشغيل 99.9%']],
  ['Enterprise', 'المؤسسات', 'Custom', 'Tailored contracts and hosting', 'عقود واستضافة مخصصة', ['On-premise option', 'Custom contracts', '24/7 phone support'], ['خيار الاستضافة الداخلية', 'عقود مخصصة', 'دعم هاتفي على مدار الساعة']],
];

const KPIS = [
  ['Revenue', 'الإيرادات', '$48,250', '+12.4%', '12, 14, 13, 17, 16, 19, 22'],
  ['Orders', 'الطلبات', '1,284', '+8.1%', '30, 28, 33, 35, 34, 38, 41'],
  ['Customers', 'العملاء', '9,412', '+3.2%', '80, 82, 81, 84, 86, 88, 90'],
  ['Refund rate', 'نسبة الاسترداد', '1.8%', '-0.4%', '3, 2.8, 2.6, 2.4, 2.2, 2, 1.8'],
  ['Avg. order', 'متوسط الطلب', '$37.60', '+2.9%', '33, 34, 34, 35, 36, 36, 37'],
  ['Conversion', 'التحويل', '3.4%', '+0.6%', '2.6, 2.8, 2.9, 3, 3.1, 3.3, 3.4'],
  ['Active users', 'المستخدمون النشطون', '24.1k', '+5.5%', '18, 19, 20, 21, 22, 23, 24'],
  ['Churn', 'معدل الإلغاء', '2.1%', '-0.3%', '2.8, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1'],
];

function form(p: BlockParams, kind: 'login' | 'signup'): SpaceNode[] {
  const L = p.lang;
  const fields: SpaceNode[] = [];
  if (kind === 'signup') fields.push(n('input', { label: t(L, 'Full name', 'الاسم الكامل'), type: 'text', placeholder: t(L, 'Lina Haddad', 'لينا حداد') }));
  fields.push(
    n('input', { label: t(L, 'Email', 'البريد الإلكتروني'), type: 'email', placeholder: 'you@example.com' }),
    n('input', { label: t(L, 'Password', 'كلمة المرور'), type: 'password', placeholder: '', hint: kind === 'signup' ? t(L, 'At least 8 characters', '8 أحرف على الأقل') : '' }),
  );
  if (kind === 'login') fields.push(n('checkbox', { label: t(L, 'Remember me', 'تذكرني'), checked: false }));
  else fields.push(n('checkbox', { label: t(L, 'I agree to the terms', 'أوافق على الشروط'), checked: false }));
  if (p.captcha) fields.push(n('captcha', { label: t(L, "I'm not a robot", 'لست روبوتًا') }));
  fields.push(n('button', { text: kind === 'login' ? t(L, 'Sign in', 'تسجيل الدخول') : t(L, 'Create account', 'إنشاء حساب'), variant: 'primary', size: 'lg', block: true }));
  fields.push(
    n('text', {
      text: kind === 'login' ? t(L, 'New here? Create an account', 'جديد هنا؟ أنشئ حسابًا') : t(L, 'Already have an account? Sign in', 'لديك حساب؟ سجّل الدخول'),
      size: 'sm',
      tone: 'muted',
      align: 'center',
    }),
  );
  return [
    n('section', { padding: 'lg', width: 'narrow', tone: 'accent', align: 'start' }, [
      n('stack', { gap: 'sm', align: 'center' }, [
        n('heading', {
          text: kind === 'login' ? t(L, 'Welcome back', 'مرحبًا بعودتك') : t(L, 'Create your account', 'أنشئ حسابك'),
          level: 1,
          align: 'center',
          eyebrow: p.title ?? '',
        }),
        n('text', {
          text: kind === 'login' ? t(L, 'Sign in to continue to your workspace.', 'سجّل الدخول للمتابعة إلى مساحة عملك.') : t(L, 'Start your 14-day free trial. No card required.', 'ابدأ تجربتك المجانية لمدة 14 يومًا. لا حاجة لبطاقة.'),
          tone: 'muted',
          align: 'center',
        }),
      ]),
      n('card', { title: '', gap: 'md' }, fields),
    ]),
  ];
}

export const BLOCKS: Record<BlockId, BlockDef> = {
  navbar: {
    id: 'navbar',
    label: 'Navbar',
    labelAr: 'شريط التنقل',
    icon: 'navbar',
    description: 'Brand, links and a call to action',
    palette: true,
    build: (p) => [
      n('section', { padding: 'sm', width: 'wide' }, [
        n('stack', { direction: 'row', justify: 'between', align: 'center', gap: 'md' }, [
          n('heading', { text: p.title ?? t(p.lang, 'Acme', 'أكمي'), level: 3 }),
          n('stack', { direction: 'row', gap: 'sm', align: 'center' }, [
            n('button', { text: t(p.lang, 'Product', 'المنتج'), variant: 'ghost', size: 'sm' }),
            n('button', { text: t(p.lang, 'Pricing', 'الأسعار'), variant: 'ghost', size: 'sm' }),
            n('button', { text: t(p.lang, 'Sign in', 'دخول'), variant: 'secondary', size: 'sm' }),
          ]),
        ]),
      ]),
      n('divider'),
    ],
  },
  hero: {
    id: 'hero',
    label: 'Hero',
    labelAr: 'قسم رئيسي',
    icon: 'hero',
    description: 'Headline, lead and two actions',
    palette: true,
    build: (p) => [
      n('section', { padding: 'lg', width: 'normal', tone: 'accent', align: 'center' }, [
        n('badge', { text: t(p.lang, 'New · Version 2.0', 'جديد · الإصدار 2.0'), variant: 'primary' }),
        n('heading', { text: p.title ?? t(p.lang, 'Build accessible products faster', 'ابنِ منتجات سهلة الوصول بسرعة'), level: 1, align: 'center' }),
        n('text', {
          text: t(p.lang, 'Everything your team needs to design, ship and grow — themeable, right-to-left ready and accessible by default.', 'كل ما يحتاجه فريقك للتصميم والإطلاق والنمو — قابل للتخصيص وجاهز للعربية وسهل الوصول افتراضيًا.'),
          size: 'lg',
          tone: 'muted',
          align: 'center',
        }),
        n('stack', { direction: 'row', gap: 'sm', justify: 'center' }, [
          n('button', { text: t(p.lang, 'Get started', 'ابدأ الآن'), variant: 'primary', size: 'lg' }),
          n('button', { text: t(p.lang, 'Book a demo', 'احجز عرضًا'), variant: 'secondary', size: 'lg' }),
        ]),
      ]),
    ],
  },
  features: {
    id: 'features',
    label: 'Feature grid',
    labelAr: 'شبكة المزايا',
    icon: 'features',
    description: 'Icon, title and text in columns',
    palette: true,
    countable: { min: 2, max: 8, default: 3, noun: 'features' },
    build: (p) => {
      const count = clamp(p.count, 3, 2, 8);
      return [
        n('section', { padding: 'md', width: 'normal' }, [
          n('heading', { text: t(p.lang, 'Why teams choose us', 'لماذا تختارنا الفرق'), level: 2, align: 'center', eyebrow: t(p.lang, 'Features', 'المزايا') }),
          n(
            'grid',
            { columns: Math.min(count, count === 4 ? 4 : 3), gap: 'md' },
            FEATURES.slice(0, count).map(([icon, en, enText, ar, arText]) =>
              n('card', { title: '', gap: 'sm' }, [
                n('heading', { text: `${icon} ${t(p.lang, en, ar)}`, level: 3 }),
                n('text', { text: t(p.lang, enText, arText), tone: 'muted', size: 'sm' }),
              ]),
            ),
          ),
        ]),
      ];
    },
  },
  pricing: {
    id: 'pricing',
    label: 'Pricing table',
    labelAr: 'جدول الأسعار',
    icon: 'pricing',
    description: 'Plans with prices, features and CTA',
    palette: true,
    countable: { min: 1, max: 4, default: 3, noun: 'plans' },
    build: (p) => {
      const count = clamp(p.count, 3, 1, 4);
      const plans = PLANS.slice(0, count);
      const featured = Math.min(1, count - 1);
      return [
        n('section', { padding: 'md', width: 'wide', align: 'start' }, [
          n('heading', { text: t(p.lang, 'Simple, transparent pricing', 'أسعار بسيطة وواضحة'), level: 2, align: 'center', eyebrow: t(p.lang, 'Pricing', 'الأسعار') }),
          n('text', { text: t(p.lang, 'Start free, upgrade when you grow. Cancel anytime.', 'ابدأ مجانًا وطوّر خطتك عندما تنمو. ألغِ في أي وقت.'), tone: 'muted', align: 'center' }),
          n(
            'grid',
            { columns: count, gap: 'md' },
            plans.map(([en, ar, price, enDesc, arDesc, enItems, arItems], i) =>
              n('card', { title: '', gap: 'md' }, [
                ...(i === featured && count > 1 ? [n('badge', { text: t(p.lang, 'Most popular', 'الأكثر شيوعًا'), variant: 'primary' })] : []),
                n('heading', { text: t(p.lang, en as string, ar as string), level: 3 }),
                n('heading', { text: price === 'Custom' ? t(p.lang, 'Custom', 'حسب الطلب') : (price as string), level: 2 }),
                n('text', {
                  text: `${price === 'Custom' ? '' : t(p.lang, 'per month · ', 'شهريًا · ')}${t(p.lang, enDesc as string, arDesc as string)}`,
                  tone: 'muted',
                  size: 'sm',
                }),
                n('list', { items: (p.lang === 'ar' ? (arItems as string[]) : (enItems as string[])).join('\n'), marker: 'check' }),
                n('button', { text: t(p.lang, i === featured ? 'Start free trial' : 'Choose plan', i === featured ? 'ابدأ التجربة المجانية' : 'اختر الخطة'), variant: i === featured ? 'primary' : 'secondary', block: true }),
              ]),
            ),
          ),
        ]),
      ];
    },
  },
  login: { id: 'login', label: 'Login form', labelAr: 'نموذج الدخول', icon: 'login', description: 'Email, password, remember me, captcha', palette: true, build: (p) => form({ ...p, captcha: p.captcha ?? true }, 'login') },
  signup: { id: 'signup', label: 'Sign-up form', labelAr: 'نموذج التسجيل', icon: 'login', description: 'Name, email, password and terms', palette: true, build: (p) => form(p, 'signup') },
  kpis: {
    id: 'kpis',
    label: 'Dashboard KPIs',
    labelAr: 'مؤشرات لوحة التحكم',
    icon: 'kpis',
    description: 'Row of key metrics with trends',
    palette: true,
    countable: { min: 1, max: 8, default: 4, noun: 'KPIs' },
    build: (p) => {
      const count = clamp(p.count, 4, 1, 8);
      return [
        n(
          'grid',
          { columns: Math.min(count, 4), gap: 'md' },
          KPIS.slice(0, count).map(([en, ar, value, delta, spark]) =>
            n('stat', { label: t(p.lang, en, ar), value, delta, period: t(p.lang, 'vs last month', 'مقارنة بالشهر الماضي'), spark }),
          ),
        ),
      ];
    },
  },
  chart: {
    id: 'chart',
    label: 'Chart card',
    labelAr: 'بطاقة رسم بياني',
    icon: 'chart',
    description: 'Titled chart in a card',
    palette: false,
    build: (p) => {
      const subject = p.subject ? cap(p.subject) : t(p.lang, 'Revenue', 'الإيرادات');
      const months = p.lang === 'ar' ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const kind = p.chartKind ?? 'bar';
      const data =
        kind === 'donut'
          ? (p.lang === 'ar' ? ['مباشر', 'بحث', 'شبكات اجتماعية', 'إحالة'] : ['Direct', 'Search', 'Social', 'Referral']).map((l, i) => `${l} | ${[42, 31, 17, 10][i]}`).join('\n')
          : months.map((m, i) => `${m} | ${[42, 48, 55, 51, 63, 72][i]} | ${[28, 30, 31, 33, 35, 38][i]}`).join('\n');
      return [
        n('card', { title: '', gap: 'sm' }, [
          n('chart', {
            kind,
            title: kind === 'donut' ? t(p.lang, `${subject} by channel`, `${subject} حسب القناة`) : t(p.lang, `${subject} by month`, `${subject} حسب الشهر`),
            series: kind === 'donut' ? subject : t(p.lang, `${subject} | Costs`, `${subject} | التكاليف`),
            data,
            height: 260,
          }),
        ]),
      ];
    },
  },
  table: {
    id: 'table',
    label: 'Orders table',
    labelAr: 'جدول الطلبات',
    icon: 'table',
    description: 'Sortable data table with statuses',
    palette: true,
    countable: { min: 2, max: 12, default: 5, noun: 'rows' },
    build: (p) => {
      const count = clamp(p.count, 5, 2, 12);
      const subject = p.subject ? cap(p.subject) : t(p.lang, 'Recent orders', 'أحدث الطلبات');
      const names = p.lang === 'ar' ? ['لينا حداد', 'عمر خليل', 'سارة ناصر', 'يوسف أمين', 'ريم سالم', 'خالد عمر'] : ['Lina Haddad', 'Omar Khalil', 'Sara Nasser', 'Yousef Amin', 'Reem Salem', 'Khaled Omar'];
      const statuses = p.lang === 'ar' ? ['مدفوع', 'قيد المعالجة', 'تم الشحن', 'مسترد', 'مدفوع', 'فشل'] : ['Paid', 'Pending', 'Shipped', 'Refunded', 'Paid', 'Failed'];
      const totals = ['$1,240', '$320', '$86', '$45', '$712', '$129'];
      const rowsText = Array.from({ length: count }, (_, i) => `#${1042 - i} | ${names[i % 6]} | ${statuses[i % 6]} | ${totals[i % 6]}`).join('\n');
      return [
        n('card', { title: subject, gap: 'sm' }, [
          n('table', {
            caption: subject,
            columns: t(p.lang, 'Order | Customer | Status | Total', 'الطلب | العميل | الحالة | المجموع'),
            rows: rowsText,
          }),
        ]),
      ];
    },
  },
  activity: {
    id: 'activity',
    label: 'Activity feed',
    labelAr: 'سجل النشاط',
    icon: 'timeline',
    description: 'Timeline of recent events',
    palette: false,
    build: (p) => [
      n('card', { title: t(p.lang, 'Recent activity', 'النشاط الأخير') }, [
        n('timeline', {
          items: t(
            p.lang,
            'New order #1042 | Lina Haddad paid $1,240 | 2 min ago\nRefund issued | Order #1039 refunded | 1 h ago\nNew customer | Reem Salem signed up | 3 h ago',
            'طلب جديد #1042 | دفعت لينا حداد 1,240$ | قبل دقيقتين\nتم الاسترداد | استرداد الطلب #1039 | قبل ساعة\nعميل جديد | سجّلت ريم سالم | قبل 3 ساعات',
          ),
        }),
      ]),
    ],
  },
  faq: {
    id: 'faq',
    label: 'FAQ accordion',
    labelAr: 'الأسئلة الشائعة',
    icon: 'faq',
    description: 'Questions and answers',
    palette: true,
    countable: { min: 1, max: 6, default: 3, noun: 'questions' },
    build: (p) => {
      const qa =
        p.lang === 'ar'
          ? ['هل يمكنني الإلغاء في أي وقت؟ | نعم، الخطط شهرية ويمكنك الإلغاء من الإعدادات.', 'هل تقدمون استردادًا؟ | نسترد أي دفعة خلال 14 يومًا دون أسئلة.', 'هل توجد تجربة مجانية؟ | كل خطة تبدأ بتجربة 14 يومًا دون بطاقة.', 'هل تدعمون العربية؟ | نعم، الواجهة كاملة تدعم الاتجاه من اليمين إلى اليسار.', 'أين تُخزَّن بياناتي؟ | في مراكز بيانات معتمدة داخل منطقتك.', 'هل يوجد خصم سنوي؟ | وفّر شهرين عند الدفع سنويًا.']
          : ['Can I cancel anytime? | Yes. Plans are month to month and you can cancel from Settings.', 'Do you offer refunds? | We refund any payment within 14 days, no questions asked.', 'Is there a free trial? | Every plan starts with a 14-day trial. No card required.', 'Do you support Arabic? | Yes — the whole interface supports right-to-left layouts.', 'Where is my data stored? | In certified data centres in your region.', 'Is there a yearly discount? | Save two months when you pay yearly.'];
      return [
        n('section', { padding: 'md', width: 'narrow' }, [
          n('heading', { text: t(p.lang, 'Frequently asked questions', 'الأسئلة الشائعة'), level: 2, align: 'center' }),
          n('accordion', { items: qa.slice(0, clamp(p.count, 3, 1, 6)).join('\n') }),
        ]),
      ];
    },
  },
  testimonial: {
    id: 'testimonial',
    label: 'Testimonial',
    labelAr: 'شهادة عميل',
    icon: 'testimonial',
    description: 'Customer quote with avatar',
    palette: true,
    build: (p) => [
      n('section', { padding: 'md', width: 'narrow', align: 'center', tone: 'canvas' }, [
        n('text', {
          text: t(p.lang, '“We rebuilt our customer portal in two weeks. Accessibility audits went from forty issues to zero.”', '«أعدنا بناء بوابة العملاء في أسبوعين، وانخفضت ملاحظات تدقيق إمكانية الوصول من أربعين إلى صفر.»'),
          size: 'lg',
          align: 'center',
          weight: 'bold',
        }),
        n('avatar', { name: t(p.lang, 'Rana Aziz', 'رنا عزيز'), subtitle: t(p.lang, 'Head of Product, Fintech Co.', 'رئيسة المنتج، شركة فنتك'), showName: true }),
      ]),
    ],
  },
  cta: {
    id: 'cta',
    label: 'Call to action',
    labelAr: 'دعوة لاتخاذ إجراء',
    icon: 'cta',
    description: 'Closing band with one action',
    palette: true,
    build: (p) => [
      n('section', { padding: 'md', width: 'normal', align: 'center', tone: 'inverse' }, [
        n('heading', { text: t(p.lang, 'Ready to ship your next page?', 'جاهز لإطلاق صفحتك التالية؟'), level: 2, align: 'center' }),
        n('text', { text: t(p.lang, 'Join 12,000 teams building with Orca UI.', 'انضم إلى 12,000 فريق يبني باستخدام Orca UI.'), tone: 'muted', align: 'center' }),
        n('button', { text: t(p.lang, 'Start for free', 'ابدأ مجانًا'), variant: 'primary', size: 'lg' }),
      ]),
    ],
  },
  footer: {
    id: 'footer',
    label: 'Footer',
    labelAr: 'تذييل',
    icon: 'footer',
    description: 'Columns of links and copyright',
    palette: true,
    build: (p) => {
      const col = (title: string, items: string[]) => n('stack', { gap: 'sm' }, [n('heading', { text: title, level: 4 }), ...items.map((i) => n('text', { text: i, size: 'sm', tone: 'muted' }))]);
      return [
        n('divider'),
        n('section', { padding: 'md', width: 'wide', tone: 'canvas' }, [
          n('grid', { columns: 4, gap: 'lg' }, [
            n('stack', { gap: 'sm' }, [n('heading', { text: p.title ?? t(p.lang, 'Acme', 'أكمي'), level: 3 }), n('text', { text: t(p.lang, 'Accessible products for everyone.', 'منتجات سهلة الوصول للجميع.'), size: 'sm', tone: 'muted' })]),
            col(t(p.lang, 'Product', 'المنتج'), p.lang === 'ar' ? ['المزايا', 'الأسعار', 'التحديثات'] : ['Features', 'Pricing', 'Changelog']),
            col(t(p.lang, 'Company', 'الشركة'), p.lang === 'ar' ? ['من نحن', 'الوظائف', 'اتصل بنا'] : ['About', 'Careers', 'Contact']),
            col(t(p.lang, 'Legal', 'قانوني'), p.lang === 'ar' ? ['الخصوصية', 'الشروط', 'إمكانية الوصول'] : ['Privacy', 'Terms', 'Accessibility']),
          ]),
          n('text', { text: t(p.lang, '© 2026 Acme Inc. All rights reserved.', '© 2026 أكمي. جميع الحقوق محفوظة.'), size: 'sm', tone: 'muted' }),
        ]),
      ];
    },
  },
  settings: {
    id: 'settings',
    label: 'Settings tabs',
    labelAr: 'تبويبات الإعدادات',
    icon: 'settings',
    description: 'Profile, notifications and security tabs',
    palette: true,
    build: (p) => {
      const L = p.lang;
      return [
        n('card', { title: '', gap: 'md' }, [
          n('tabs', { labels: t(L, 'Profile\nNotifications\nSecurity', 'الملف الشخصي\nالإشعارات\nالأمان') }, [
            n('stack', { gap: 'md' }, [
              n('avatar', { name: t(L, 'Lina Haddad', 'لينا حداد'), subtitle: 'lina@example.com', size: 'lg', showName: true }),
              n('grid', { columns: 2, gap: 'md' }, [
                n('input', { label: t(L, 'Full name', 'الاسم الكامل'), type: 'text', placeholder: t(L, 'Lina Haddad', 'لينا حداد') }),
                n('input', { label: t(L, 'Email', 'البريد الإلكتروني'), type: 'email', placeholder: 'lina@example.com' }),
                n('select', { label: t(L, 'Language', 'اللغة'), options: t(L, 'English\nArabic', 'الإنجليزية\nالعربية'), placeholder: '' }),
                n('datepicker', { label: t(L, 'Birthday', 'تاريخ الميلاد') }),
              ]),
              n('stack', { direction: 'row', gap: 'sm', justify: 'end' }, [n('button', { text: t(L, 'Cancel', 'إلغاء'), variant: 'ghost' }), n('button', { text: t(L, 'Save changes', 'حفظ التغييرات') })]),
            ]),
            n('stack', { gap: 'md' }, [
              n('switch', { label: t(L, 'Product updates', 'تحديثات المنتج'), checked: true }),
              n('switch', { label: t(L, 'Weekly digest', 'ملخص أسبوعي'), checked: false }),
              n('switch', { label: t(L, 'Mentions and replies', 'الإشارات والردود'), checked: true }),
            ]),
            n('stack', { gap: 'md' }, [
              n('input', { label: t(L, 'Current password', 'كلمة المرور الحالية'), type: 'password', placeholder: '' }),
              n('input', { label: t(L, 'New password', 'كلمة المرور الجديدة'), type: 'password', placeholder: '', hint: t(L, 'At least 12 characters', '12 حرفًا على الأقل') }),
              n('switch', { label: t(L, 'Two-factor authentication', 'المصادقة الثنائية'), checked: true }),
              n('alert', { variant: 'warning', title: t(L, 'Danger zone', 'منطقة الخطر'), text: t(L, 'Deleting your account removes all projects permanently.', 'حذف حسابك يزيل جميع المشاريع نهائيًا.') }),
            ]),
          ]),
        ]),
      ];
    },
  },
  empty: {
    id: 'empty',
    label: 'Empty state page',
    labelAr: 'صفحة حالة فارغة',
    icon: 'empty',
    description: 'Large empty state with actions',
    palette: true,
    build: (p) => [
      n('section', { padding: 'md', width: 'narrow', align: 'center' }, [
        n('empty', {
          title: p.subject ? t(p.lang, `No ${p.subject} yet`, `لا توجد ${p.subject} بعد`) : t(p.lang, 'No projects yet', 'لا توجد مشاريع بعد'),
          description: t(p.lang, 'Create your first one to start collaborating with your team.', 'أنشئ أول عنصر لبدء التعاون مع فريقك.'),
          action: t(p.lang, 'Create new', 'إنشاء جديد'),
          secondary: t(p.lang, 'Import', 'استيراد'),
          icon: '📁',
          size: 'page',
        }),
      ]),
    ],
  },
  contact: {
    id: 'contact',
    label: 'Contact form',
    labelAr: 'نموذج تواصل',
    icon: 'input',
    description: 'Name, email, topic and message',
    palette: true,
    build: (p) => [
      n('section', { padding: 'md', width: 'narrow' }, [
        n('heading', { text: t(p.lang, 'Get in touch', 'تواصل معنا'), level: 2, eyebrow: t(p.lang, 'Contact', 'اتصل بنا') }),
        n('card', { title: '', gap: 'md' }, [
          n('grid', { columns: 2, gap: 'md' }, [
            n('input', { label: t(p.lang, 'Name', 'الاسم'), type: 'text', placeholder: '' }),
            n('input', { label: t(p.lang, 'Email', 'البريد الإلكتروني'), type: 'email', placeholder: 'you@example.com' }),
          ]),
          n('select', { label: t(p.lang, 'Topic', 'الموضوع'), options: t(p.lang, 'Sales\nSupport\nPartnerships', 'المبيعات\nالدعم\nالشراكات'), placeholder: t(p.lang, 'Choose…', 'اختر…') }),
          n('input', { label: t(p.lang, 'Message', 'الرسالة'), type: 'text', placeholder: '' }),
          ...(p.captcha ? [n('captcha', { label: t(p.lang, "I'm not a robot", 'لست روبوتًا') })] : []),
          n('button', { text: t(p.lang, 'Send message', 'إرسال'), variant: 'primary' }),
        ]),
      ]),
    ],
  },
  pageHeader: {
    id: 'pageHeader',
    label: 'Page header',
    labelAr: 'رأس الصفحة',
    icon: 'heading',
    description: 'Breadcrumb, title and actions',
    palette: true,
    build: (p) => [
      n('stack', { gap: 'sm' }, [
        n('breadcrumb', { items: t(p.lang, `Home\n${p.title ?? 'Dashboard'}`, `الرئيسية\n${p.title ?? 'لوحة التحكم'}`) }),
        n('stack', { direction: 'row', justify: 'between', align: 'center' }, [
          n('heading', { text: p.title ?? t(p.lang, 'Dashboard', 'لوحة التحكم'), level: 1 }),
          n('stack', { direction: 'row', gap: 'sm' }, [n('button', { text: t(p.lang, 'Export', 'تصدير'), variant: 'secondary' }), n('button', { text: t(p.lang, 'New report', 'تقرير جديد') })]),
        ]),
      ]),
    ],
  },
  gallery: {
    id: 'gallery',
    label: 'Gallery carousel',
    labelAr: 'معرض صور',
    icon: 'carousel',
    description: 'Heading and a sliding gallery',
    palette: true,
    build: (p) => [
      n('section', { padding: 'md', width: 'wide' }, [
        n('heading', { text: t(p.lang, 'Featured destinations', 'وجهات مميزة'), level: 2 }),
        n('carousel', { label: t(p.lang, 'Featured destinations', 'وجهات مميزة'), items: t(p.lang, 'Wadi Rum | from $380\nAqaba | from $310\nDead Sea | from $290\nPetra | from $420', 'وادي رم | من 380$\nالعقبة | من 310$\nالبحر الميت | من 290$\nالبتراء | من 420$'), visible: 3 }),
      ]),
    ],
  },
  notice: {
    id: 'notice',
    label: 'Notice',
    labelAr: 'تنبيه',
    icon: 'alert',
    description: 'Info alert',
    palette: false,
    build: (p) => [n('alert', { variant: 'info', title: t(p.lang, 'Heads up', 'تنبيه'), text: t(p.lang, 'Your trial ends in 5 days.', 'تنتهي تجربتك خلال 5 أيام.') })],
  },
  profile: {
    id: 'profile',
    label: 'Profile header',
    labelAr: 'رأس الملف الشخصي',
    icon: 'avatar',
    description: 'Avatar, name and stats',
    palette: false,
    build: (p) => [
      n('card', { title: '' }, [
        n('stack', { direction: 'row', justify: 'between', align: 'center' }, [
          n('avatar', { name: t(p.lang, 'Lina Haddad', 'لينا حداد'), subtitle: t(p.lang, 'Product designer · Amman', 'مصممة منتجات · عمّان'), size: 'lg', showName: true }),
          n('button', { text: t(p.lang, 'Edit profile', 'تعديل الملف'), variant: 'secondary' }),
        ]),
        n('progress', { label: t(p.lang, 'Profile completion', 'اكتمال الملف'), value: 72 }),
      ]),
    ],
  },
  onboarding: {
    id: 'onboarding',
    label: 'Onboarding steps',
    labelAr: 'خطوات البدء',
    icon: 'stepper',
    description: 'Stepper with the current step form',
    palette: true,
    countable: { min: 2, max: 6, default: 4, noun: 'steps' },
    build: (p) => {
      const all = p.lang === 'ar' ? ['الحساب', 'الملف', 'الفريق', 'الخطة', 'الدفع', 'تم'] : ['Account', 'Profile', 'Team', 'Plan', 'Payment', 'Done'];
      const steps = all.slice(0, clamp(p.count, 4, 2, 6));
      return [
        n('section', { padding: 'md', width: 'narrow' }, [
          n('stepper', { steps: steps.join('\n'), current: 2 }),
          n('card', { title: steps[1] }, [
            n('input', { label: t(p.lang, 'Company name', 'اسم الشركة'), type: 'text', placeholder: '' }),
            n('otp', { label: t(p.lang, 'Verification code', 'رمز التحقق'), length: 6 }),
            n('stack', { direction: 'row', justify: 'between' }, [n('button', { text: t(p.lang, 'Back', 'رجوع'), variant: 'ghost' }), n('button', { text: t(p.lang, 'Continue', 'متابعة') })]),
          ]),
        ]),
      ];
    },
  },
};

export const PALETTE_BLOCKS = Object.values(BLOCKS).filter((b) => b.palette);
