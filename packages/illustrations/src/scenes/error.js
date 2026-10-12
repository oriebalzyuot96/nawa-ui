import { backdrop } from '../helpers.js';

const tri = 'M120 44c4 0 7 2 9 5l40 70c4 7-1 15-9 15H80c-8 0-13-8-9-15l40-70c2-3 5-5 9-5Z';
export default {
  title: 'Something went wrong',
  keywords: ['error', 'warning', 'failure', 'problem', 'alert'],
  body: [
    backdrop(),
    `<path d="${tri}" transform="translate(9 -7)" fill="muted"/>`,
    `<path d="${tri}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    '<path d="M120 60l34 60H86Z" fill="soft" stroke="soft" stroke-width="6" stroke-linejoin="round"/>',
    '<path d="M120 78V100" stroke="accent" stroke-width="8" stroke-linecap="round"/>',
    '<circle cx="120" cy="114" r="4.5" fill="accent"/>',
    '<g float="1" stroke="accent" stroke-width="2.5" stroke-linecap="round">',
    '<path d="M170 56l9-7M176 70h11M162 44l3-9"/>',
    '</g>',
  ].join(''),
};
