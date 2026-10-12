import { backdrop } from '../helpers.js';

export default {
  title: 'No access',
  keywords: ['locked', 'permission', 'forbidden', '403', 'private', 'restricted'],
  body: [
    backdrop(),
    '<rect x="92" y="78" width="76" height="62" rx="14" fill="muted"/>',
    '<path d="M98 88V70a22 22 0 0 1 44 0v18" fill="none" stroke="edge" stroke-width="9" stroke-linecap="round"/>',
    '<rect x="82" y="84" width="76" height="62" rx="14" fill="accent"/>',
    '<rect x="90" y="92" width="7" height="44" rx="3.5" fill="paper" fill-opacity=".2"/>',
    '<circle cx="120" cy="108" r="7" fill="paper"/>',
    '<path d="M117 110h6l2 16h-10Z" fill="paper" stroke="paper" stroke-width="1" stroke-linejoin="round"/>',
    '<g float="1" fill="none" stroke="ink" stroke-opacity=".6" stroke-width="3.5" stroke-linecap="round">',
    '<circle cx="60" cy="58" r="9"/><path d="M66.5 64.5L82 80M76 74l5-5M80 78l4-4"/>',
    '</g>',
  ].join(''),
};
