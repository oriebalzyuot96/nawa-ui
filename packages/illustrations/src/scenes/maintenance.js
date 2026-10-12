import { backdrop, gearPath, spark } from '../helpers.js';

export default {
  title: 'Under maintenance',
  keywords: ['maintenance', 'settings', 'repair', 'upgrade', 'scheduled'],
  body: [
    backdrop(),
    `<path d="${gearPath(106, 98, 40, 31, 9)}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    '<circle cx="106" cy="98" r="15" fill="soft" stroke="accent" stroke-width="2"/>',
    '<circle cx="106" cy="98" r="6" fill="accent"/>',
    `<g float="slow"><path d="${gearPath(166, 58, 20, 15, 7)}" fill="muted" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    '<circle cx="166" cy="58" r="6" fill="paper" stroke="edge" stroke-width="2"/></g>',
    '<g transform="rotate(-38 160 130)">',
    '<rect x="122" y="125" width="60" height="11" rx="5.5" fill="accent"/>',
    '<path d="M196.6 122.5A13 13 0 1 0 196.6 138.5L190 135V126Z" fill="accent" stroke="accent" stroke-width="1" stroke-linejoin="round"/>',
    '</g>',
    spark(60, 52),
    spark(194, 102, 3),
  ].join(''),
};
