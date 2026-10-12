import { backdrop, bar } from '../helpers.js';

const doc = 'M96 38h36l22 22v78a6 6 0 0 1-6 6H96a6 6 0 0 1-6-6V44a6 6 0 0 1 6-6Z';
export default {
  title: 'No files',
  keywords: ['files', 'documents', 'attachments', 'drive', 'storage'],
  body: [
    backdrop(),
    `<path d="${doc}" transform="translate(-16 6) rotate(-9 120 96)" fill="muted"/>`,
    `<path d="${doc}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    '<path d="M132 38v16a6 6 0 0 0 6 6h16" fill="alt" stroke="edge" stroke-width="2" stroke-linejoin="round"/>',
    bar(102, 72, 30),
    bar(102, 84, 40, 6, 'ink', '.18'),
    bar(102, 96, 34, 6, 'ink', '.18'),
    bar(102, 108, 22, 6, 'ink', '.18'),
    '<g float="1">',
    '<circle cx="158" cy="126" r="16" fill="paper" stroke="accent" stroke-width="2" stroke-dasharray="3 3.3"/>',
    '<path d="M158 119v14M151 126h14" stroke="accent" stroke-width="2.5" stroke-linecap="round"/>',
    '</g>',
  ].join(''),
};
