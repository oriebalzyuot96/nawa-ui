import { backdrop, bar, nucleus } from '../helpers.js';

export default {
  title: 'No data',
  keywords: ['chart', 'analytics', 'report', 'empty', 'dashboard'],
  body: [
    backdrop(),
    '<rect x="78" y="40" width="104" height="92" rx="12" fill="muted"/>',
    '<rect x="62" y="50" width="104" height="92" rx="12" fill="paper" stroke="edge" stroke-width="2"/>',
    bar(76, 64, 36),
    bar(76, 74, 22, 4, 'ink', '.16'),
    '<g fill="none" stroke="edge" stroke-width="1.5" stroke-dasharray="3 3">',
    '<rect x="80" y="102" width="12" height="22" rx="3"/><rect x="98" y="88" width="12" height="36" rx="3"/>',
    '<rect x="116" y="108" width="12" height="16" rx="3"/><rect x="134" y="96" width="12" height="28" rx="3"/>',
    '</g>',
    '<path d="M76 130H152" stroke="edge" stroke-width="2" stroke-linecap="round"/>',
    nucleus(146, 68, 5, { float: '1' }),
  ].join(''),
};
