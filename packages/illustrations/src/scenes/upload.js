import { backdrop, bar } from '../helpers.js';

export default {
  title: 'Upload',
  keywords: ['upload', 'dropzone', 'import', 'drag and drop', 'files'],
  body: [
    backdrop({ satellite: 'right' }),
    '<rect x="54" y="46" width="132" height="96" rx="16" fill="paper" stroke="accent" stroke-opacity=".8" stroke-width="2" stroke-dasharray="6 6"/>',
    '<circle cx="120" cy="86" r="24" fill="soft"/>',
    '<path d="M120 98V76M110 85l10-10 10 10" fill="none" stroke="accent" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    bar(92, 120, 56),
    bar(104, 130, 32, 4, 'ink', '.16'),
    '<g float="1"><path d="M152 24h16l8 8v22a3 3 0 0 1-3 3h-21a3 3 0 0 1-3-3V27a3 3 0 0 1 3-3Z" transform="rotate(12 164 40)" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/></g>',
  ].join(''),
};
