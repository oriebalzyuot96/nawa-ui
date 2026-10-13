/** Starter templates. Each one is a canned Understanding, so templates and "Describe" share the generator. */
import { generate, type Understanding } from './engine';
import type { SpaceDoc } from './types';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Rough outline for the gallery thumbnail. */
  outline: Array<'bar' | 'hero' | 'cols2' | 'cols3' | 'cols4' | 'form' | 'table' | 'tabs' | 'empty' | 'footer'>;
  understanding: Understanding;
}

const base: Omit<Understanding, 'page'> = { blocks: [], rtl: false, lang: 'en', captcha: false, fallback: false };

export const TEMPLATES: Template[] = [
  {
    id: 'login',
    name: 'Login',
    description: 'Centered sign-in card with remember me and a captcha placeholder.',
    icon: 'login',
    outline: ['hero', 'form'],
    understanding: { ...base, page: 'login', captcha: true },
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Header, four KPIs with sparklines, revenue chart, activity and orders table.',
    icon: 'kpis',
    outline: ['bar', 'cols4', 'cols2', 'table'],
    understanding: { ...base, page: 'dashboard', topic: 'sales', topicBefore: true, blocks: [{ block: 'kpis', count: 4 }, { block: 'chart', subject: 'revenue' }, { block: 'table', subject: 'orders' }] },
  },
  {
    id: 'pricing',
    name: 'Pricing',
    description: 'Three plans with a highlighted favourite, FAQ and call to action.',
    icon: 'pricing',
    outline: ['bar', 'cols3', 'form', 'footer'],
    understanding: { ...base, page: 'pricing', blocks: [{ block: 'pricing', count: 3 }] },
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Profile, notifications and security in accessible tabs.',
    icon: 'settings',
    outline: ['bar', 'tabs', 'form'],
    understanding: { ...base, page: 'settings' },
  },
  {
    id: 'landing',
    name: 'Landing hero',
    description: 'Navbar, hero, feature grid, testimonial, call to action and footer.',
    icon: 'hero',
    outline: ['bar', 'hero', 'cols3', 'footer'],
    understanding: { ...base, page: 'landing' },
  },
  {
    id: 'empty',
    name: 'Empty state',
    description: 'A friendly first-run page with primary and secondary actions.',
    icon: 'empty',
    outline: ['bar', 'empty'],
    understanding: { ...base, page: 'empty' },
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Contact form with topic select and captcha placeholder.',
    icon: 'input',
    outline: ['bar', 'form', 'footer'],
    understanding: { ...base, page: 'contact', captcha: true },
  },
  {
    id: 'landing-ar',
    name: 'Arabic landing (RTL)',
    description: 'صفحة هبوط كاملة بالعربية — right-to-left with Arabic copy.',
    icon: 'rtl',
    outline: ['bar', 'hero', 'cols3', 'footer'],
    understanding: { ...base, page: 'landing', lang: 'ar', rtl: true, accent: 'teal' },
  },
];

export function templateDoc(t: Template): SpaceDoc {
  const doc = generate(t.understanding);
  return { ...doc, name: t.name };
}
