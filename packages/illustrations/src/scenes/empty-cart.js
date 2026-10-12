import { backdrop } from '../helpers.js';

export default {
  title: 'Empty cart',
  keywords: ['cart', 'basket', 'shop', 'checkout', 'ecommerce'],
  body: [
    backdrop(),
    '<path d="M48 52H62L72 108" fill="none" stroke="ink" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M66 64H182L170 112H76Z" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    '<path d="M98 64L102 112M124 64V112M150 64L146 112M71 88H176" stroke="edge" stroke-opacity=".55" stroke-width="2"/>',
    '<path d="M76 112L80 124H166" fill="none" stroke="ink" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    '<circle cx="92" cy="138" r="8" fill="paper" stroke="ink" stroke-opacity=".7" stroke-width="3"/>',
    '<circle cx="154" cy="138" r="8" fill="paper" stroke="ink" stroke-opacity=".7" stroke-width="3"/>',
    '<g float="1">',
    '<rect x="108" y="24" width="28" height="26" rx="6" fill="soft" stroke="accent" stroke-width="2" stroke-dasharray="3 3"/>',
    '<path d="M122 31V43M116 37H128" stroke="accent" stroke-width="2.5" stroke-linecap="round"/>',
    '</g>',
  ].join(''),
};
