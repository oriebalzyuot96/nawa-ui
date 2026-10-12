import { backdrop, bar } from '../helpers.js';

export default {
  title: 'Page not found',
  keywords: ['404', 'not found', 'missing', 'lost', 'signpost'],
  body: [
    backdrop(),
    '<path d="M94 156q26-12 52 0Z" fill="muted" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    '<rect x="114" y="52" width="12" height="100" rx="4" fill="muted" stroke="edge" stroke-width="2"/>',
    '<path d="M72 58H150l14 13-14 13H72a6 6 0 0 1-6-6V64a6 6 0 0 1 6-6Z" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    bar(78, 68, 50),
    '<path d="M168 96H92l-14 13 14 13h76a6 6 0 0 0 6-6v-14a6 6 0 0 0-6-6Z" fill="soft" stroke="accent" stroke-opacity=".6" stroke-width="2" stroke-linejoin="round"/>',
    bar(100, 106, 54, 6, 'accent', '.5'),
    '<g float="1">',
    '<circle cx="182" cy="44" r="22" fill="none" stroke="accent" stroke-opacity=".4" stroke-width="1.5"/>',
    '<circle cx="182" cy="44" r="15" fill="accent"/>',
    '<path d="M177 40a5 5 0 1 1 7 4.6c-1.3.6-2 1.6-2 3v1.4" fill="none" stroke="paper" stroke-width="3" stroke-linecap="round"/>',
    '<circle cx="182" cy="53.5" r="2" fill="paper"/>',
    '</g>',
  ].join(''),
};
