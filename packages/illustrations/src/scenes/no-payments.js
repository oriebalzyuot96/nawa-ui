import { backdrop, bar } from '../helpers.js';

export default {
  title: 'No payments',
  keywords: ['billing', 'payments', 'invoices', 'transactions', 'subscription'],
  body: [
    backdrop(),
    '<g transform="rotate(8 140 78)">',
    '<path d="M112 34h56a4 4 0 0 1 4 4v84l-8-6-8 6-8-6-8 6-8-6-8 6-8-6-8 6V38a4 4 0 0 1 4-4Z" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    bar(118, 46, 36),
    bar(118, 58, 44, 6, 'ink', '.18'),
    bar(118, 70, 28, 6, 'ink', '.18'),
    '</g>',
    '<rect x="56" y="80" width="104" height="64" rx="10" fill="accent"/>',
    '<rect x="56" y="93" width="104" height="11" fill="paper" fill-opacity=".22"/>',
    '<rect x="68" y="114" width="18" height="14" rx="3" fill="soft"/>',
    '<rect x="94" y="119" width="44" height="5" rx="2.5" fill="paper" fill-opacity=".55"/>',
    '<g float="1"><circle cx="178" cy="128" r="14" fill="soft" stroke="accent" stroke-width="2"/>',
    '<circle cx="178" cy="128" r="8" fill="none" stroke="accent" stroke-width="1.5" stroke-opacity=".6"/></g>',
  ].join(''),
};
