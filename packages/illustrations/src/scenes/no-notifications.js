import { backdrop } from '../helpers.js';

const bell = 'M120 46c-19 0-31 15-31 34v20l-11 15h84l-11-15V80c0-19-12-34-31-34Z';
export default {
  title: 'No notifications',
  keywords: ['bell', 'alerts', 'quiet', 'snooze', 'updates'],
  body: [
    backdrop({ satellite: 'right' }),
    `<path d="${bell}" transform="translate(8 -6)" fill="muted"/>`,
    `<path d="${bell}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    '<rect x="96" y="86" width="48" height="6" rx="3" fill="soft"/>',
    '<circle cx="120" cy="124" r="8" fill="accent"/>',
    '<circle cx="120" cy="43" r="5" fill="paper" stroke="edge" stroke-width="2"/>',
    '<g float="1" fill="none" stroke="ink" stroke-opacity=".6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M156 48h10l-10 12h10"/><path d="M174 32h7l-7 8h7"/>',
    '</g>',
  ].join(''),
};
