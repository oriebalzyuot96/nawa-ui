import { backdrop } from '../helpers.js';

const tray = 'M66 100L82 66H158L174 100V134a10 10 0 0 1-10 10H76a10 10 0 0 1-10-10Z';
export default {
  title: 'Empty inbox',
  keywords: ['inbox', 'mail', 'email', 'zero', 'clear'],
  body: [
    backdrop(),
    `<path d="${tray}" transform="translate(8 -8)" fill="muted"/>`,
    `<path d="${tray}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    '<path d="M90 78H150M86 88H154" stroke="ink" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>',
    '<path d="M66 100H98L104 112H136L142 100H174V134a10 10 0 0 1-10 10H76a10 10 0 0 1-10-10Z" fill="alt" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    '<g float="1">',
    '<rect x="104" y="26" width="32" height="22" rx="4" fill="soft" stroke="accent" stroke-width="2" stroke-dasharray="3 3"/>',
    '<path d="M106 30L120 40L134 30" fill="none" stroke="accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    '</g>',
  ].join(''),
};
