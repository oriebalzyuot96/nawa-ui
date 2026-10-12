import { backdrop, bar } from '../helpers.js';

const bubble = 'M70 44h76a14 14 0 0 1 14 14v30a14 14 0 0 1-14 14H92l-16 13v-13h-6a14 14 0 0 1-14-14V58a14 14 0 0 1 14-14Z';
export default {
  title: 'No messages',
  keywords: ['chat', 'messages', 'conversation', 'dm', 'inbox'],
  body: [
    backdrop(),
    `<path d="${bubble}" transform="translate(8 -8)" fill="muted"/>`,
    `<path d="${bubble}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    bar(72, 60, 56),
    bar(72, 72, 40, 6, 'ink', '.18'),
    bar(72, 84, 48, 6, 'ink', '.18'),
    '<g float="1">',
    '<path d="M112 98h58a12 12 0 0 1 12 12v18a12 12 0 0 1-12 12h-4v12l-14-12h-40a12 12 0 0 1-12-12v-18a12 12 0 0 1 12-12Z" fill="soft" stroke="accent" stroke-opacity=".6" stroke-width="2" stroke-linejoin="round"/>',
    '<circle cx="128" cy="119" r="4" fill="accent"/><circle cx="141" cy="119" r="4" fill="accent" fill-opacity=".7"/><circle cx="154" cy="119" r="4" fill="accent" fill-opacity=".45"/>',
    '</g>',
  ].join(''),
};
