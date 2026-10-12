import { backdrop, bar, spark } from '../helpers.js';

const row = (y, w) =>
  `<rect x="78" y="${y - 8}" width="16" height="16" rx="5" fill="accent"/>` +
  `<path d="M82 ${y}l3 3 6-6" fill="none" stroke="paper" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` +
  bar(102, y - 3, w, 6, 'ink', '.22');
export default {
  title: 'All done',
  keywords: ['tasks', 'todo', 'complete', 'success', 'checklist', 'no tasks'],
  body: [
    backdrop({ satellite: 'right' }),
    '<rect x="82" y="34" width="92" height="108" rx="12" fill="muted"/>',
    '<rect x="66" y="42" width="92" height="108" rx="12" fill="paper" stroke="edge" stroke-width="2"/>',
    row(64, 40),
    row(88, 30),
    row(112, 36),
    '<g float="1">',
    '<circle cx="160" cy="130" r="29" fill="none" stroke="accent" stroke-opacity=".4" stroke-width="1.5"/>',
    '<circle cx="160" cy="130" r="21" fill="accent"/>',
    '<path d="M150 130l7 7 13-14" fill="none" stroke="paper" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    '</g>',
    '<rect x="182" y="84" width="7" height="7" rx="1.5" transform="rotate(20 185 88)" fill="accent" fill-opacity=".55" detail="1"/>',
    '<path d="M56 34l7 2-5 5Z" fill="accent" fill-opacity=".5" detail="1"/>',
    '<circle cx="46" cy="120" r="3" fill="accent" fill-opacity=".45" detail="1"/>',
    spark(196, 112),
    spark(58, 82, 3),
  ].join(''),
};
