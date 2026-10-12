import { backdrop, nucleus, spark } from '../helpers.js';

export default {
  title: 'Welcome',
  keywords: ['welcome', 'onboarding', 'getting started', 'first run', 'hello'],
  body: [
    backdrop(),
    '<path d="M120 114V76" stroke="edge" stroke-width="3" stroke-linecap="round"/>',
    '<path d="M120 100c-4-14-18-20-30-18 2 12 14 20 30 18Z" fill="soft" stroke="accent" stroke-width="1.5" stroke-linejoin="round"/>',
    '<path d="M120 86c4-16 18-24 32-22-2 14-16 24-32 22Z" fill="accent"/>',
    '<path d="M98 122h44l-6 28a6 6 0 0 1-6 5h-20a6 6 0 0 1-6-5Z" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    '<rect x="92" y="112" width="56" height="12" rx="4" fill="muted" stroke="edge" stroke-width="2"/>',
    nucleus(66, 52, 7, { float: '1' }),
    '<path d="M162 48l7-6M166 60l10-1M156 38l2-8" stroke="accent" stroke-width="2.5" stroke-linecap="round" detail="1"/>',
    spark(182, 100),
    spark(58, 110, 3),
  ].join(''),
};
