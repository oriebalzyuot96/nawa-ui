import { backdrop, nucleus } from '../helpers.js';

export default {
  title: 'Empty folder',
  keywords: ['folder', 'directory', 'collection', 'project', 'empty'],
  body: [
    backdrop(),
    '<path d="M52 58a8 8 0 0 1 8-8h32l10 10h70a8 8 0 0 1 8 8v66a8 8 0 0 1-8 8H60a8 8 0 0 1-8-8Z" fill="muted" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    '<rect x="70" y="64" width="96" height="36" rx="4" fill="none" stroke="edge" stroke-width="1.5" stroke-dasharray="3 3"/>',
    '<path d="M56 84a8 8 0 0 1 8-8h116a7 7 0 0 1 7 8l-7 52a8 8 0 0 1-8 6H70a8 8 0 0 1-8-7Z" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    '<rect x="98" y="100" width="50" height="14" rx="5" fill="soft"/>',
    nucleus(124, 32, 5, { float: '1' }),
  ].join(''),
};
