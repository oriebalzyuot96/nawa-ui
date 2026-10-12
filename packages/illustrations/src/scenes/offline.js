import { backdrop } from '../helpers.js';

export default {
  title: 'You are offline',
  keywords: ['offline', 'no connection', 'network', 'wifi', 'disconnected'],
  body: [
    backdrop(),
    '<rect x="70" y="40" width="100" height="108" rx="50" fill="paper" stroke="edge" stroke-width="2"/>',
    '<g fill="none" stroke-linecap="round" stroke-width="8">',
    '<path d="M83 100A52 52 0 0 1 157 100" stroke="edge" stroke-opacity=".7"/>',
    '<path d="M95 113A35 35 0 0 1 145 113" stroke="edge" stroke-opacity=".7"/>',
    '<path d="M107 126A18 18 0 0 1 133 126" stroke="ink" stroke-opacity=".55"/>',
    '</g>',
    '<circle cx="120" cy="138" r="6" fill="accent"/>',
    '<path d="M80 58L160 138" stroke="paper" stroke-width="14" stroke-linecap="round"/>',
    '<path d="M80 58L160 138" stroke="accent" stroke-width="6" stroke-linecap="round"/>',
    '<g float="1"><circle cx="182" cy="50" r="10" fill="soft" stroke="accent" stroke-width="2" stroke-dasharray="2.5 3"/></g>',
  ].join(''),
};
