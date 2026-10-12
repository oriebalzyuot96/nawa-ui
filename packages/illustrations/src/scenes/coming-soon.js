import { backdrop, spark } from '../helpers.js';

export default {
  title: 'Coming soon',
  keywords: ['launch', 'soon', 'rocket', 'beta', 'roadmap', 'new feature'],
  body: [
    backdrop({ satellite: 'right' }),
    '<g transform="rotate(16 120 96)">',
    '<g float="1">',
    '<path d="M108 124c0 12 6 20 12 28 6-8 12-16 12-28Z" fill="soft" stroke="accent" stroke-width="1.5" stroke-linejoin="round"/>',
    '<path d="M114 124c0 8 3 13 6 18 3-5 6-10 6-18Z" fill="accent" fill-opacity=".6"/>',
    '</g>',
    '<path d="M96 98l-16 18v10l16-6Z" fill="accent" stroke="accent" stroke-width="2" stroke-linejoin="round"/>',
    '<path d="M144 98l16 18v10l-16-6Z" fill="accent" stroke="accent" stroke-width="2" stroke-linejoin="round"/>',
    '<rect x="104" y="112" width="32" height="10" rx="3" fill="muted" stroke="edge" stroke-width="2"/>',
    '<path d="M120 34c16 12 24 32 24 54v26H96V88c0-22 8-42 24-54Z" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    '<path d="M120 34c8 6 14 14 18 24h-36c4-10 10-18 18-24Z" fill="accent"/>',
    '<circle cx="120" cy="82" r="11" fill="soft" stroke="accent" stroke-width="2.5"/>',
    '<circle cx="120" cy="82" r="4" fill="accent"/>',
    '</g>',
    spark(58, 46),
    spark(192, 130, 3),
    '<circle cx="64" cy="122" r="2.5" fill="accent" fill-opacity=".5" detail="1"/>',
  ].join(''),
};
