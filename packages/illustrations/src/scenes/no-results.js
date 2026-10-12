import { backdrop, bar, nucleus } from '../helpers.js';

export default {
  title: 'No results',
  keywords: ['search', 'query', 'find', 'lookup', 'not found'],
  body: [
    backdrop(),
    '<rect x="50" y="42" width="118" height="28" rx="14" fill="paper" stroke="edge" stroke-width="2"/>',
    bar(64, 53, 50),
    '<rect x="50" y="82" width="80" height="10" rx="5" fill="muted"/>',
    '<rect x="50" y="98" width="56" height="10" rx="5" fill="muted"/>',
    '<rect x="50" y="114" width="68" height="10" rx="5" fill="muted" fill-opacity=".6"/>',
    '<g float="1">',
    '<circle cx="150" cy="110" r="28" fill="paper" stroke="ink" stroke-width="6"/>',
    '<path d="M134 102a18 18 0 0 1 10-10" fill="none" stroke="line" stroke-width="3" stroke-linecap="round"/>',
    nucleus(150, 112, 5.5),
    '<path d="M172 132L189 149" stroke="ink" stroke-width="10" stroke-linecap="round"/>',
    '<path d="M181 141L189 149" stroke="accent" stroke-width="10" stroke-linecap="round"/>',
    '</g>',
  ].join(''),
};
