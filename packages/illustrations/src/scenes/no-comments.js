import { backdrop, bar } from '../helpers.js';

const bubble = 'M64 52h96a14 14 0 0 1 14 14v40a14 14 0 0 1-14 14h-52l-20 16v-16H64a14 14 0 0 1-14-14V66a14 14 0 0 1 14-14Z';
export default {
  title: 'No comments',
  keywords: ['comments', 'discussion', 'feedback', 'replies', 'thread'],
  body: [
    backdrop(),
    `<path d="${bubble}" transform="translate(8 -8)" fill="muted"/>`,
    `<path d="${bubble}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    '<g fill="accent"><circle cx="76" cy="84" r="7"/><circle cx="96" cy="84" r="7"/></g>',
    '<g fill="none" stroke="accent" stroke-width="4" stroke-linecap="round"><path d="M69.5 84c0-8 4-13 10-15"/><path d="M89.5 84c0-8 4-13 10-15"/></g>',
    bar(114, 76, 44),
    bar(114, 88, 30, 6, 'ink', '.18'),
    bar(66, 102, 76, 6, 'ink', '.18'),
    '<g float="1"><g transform="rotate(-45 176 126)">',
    '<rect x="150" y="120" width="38" height="12" rx="2" fill="accent"/>',
    '<path d="M150 120l-12 6 12 6Z" fill="paper" stroke="edge" stroke-width="1.5" stroke-linejoin="round"/>',
    '<rect x="186" y="120" width="9" height="12" rx="2.5" fill="soft" stroke="accent" stroke-width="1.5"/>',
    '</g></g>',
  ].join(''),
};
