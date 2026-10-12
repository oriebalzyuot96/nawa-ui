import { backdrop, starPath } from '../helpers.js';

const star = starPath(120, 96, 48, 22);
export default {
  title: 'No favorites',
  keywords: ['favorites', 'starred', 'bookmarks', 'saved', 'liked'],
  body: [
    backdrop(),
    `<path d="${star}" transform="translate(9 -7)" fill="muted" stroke="muted" stroke-width="6" stroke-linejoin="round"/>`,
    `<path d="${star}" fill="paper" stroke="edge" stroke-width="2" stroke-linejoin="round"/>`,
    `<path d="${starPath(120, 98, 26, 12)}" fill="none" stroke="accent" stroke-width="2" stroke-dasharray="3 3" stroke-linejoin="round"/>`,
    '<g float="1"><path d="M174 64c-8-5-12-9-12-14a6 6 0 0 1 12-2a6 6 0 0 1 12 2c0 5-4 9-12 14Z" fill="accent"/></g>',
  ].join(''),
};
