import { backdrop } from '../helpers.js';

const unit = (y, state) =>
  `<rect x="70" y="${y}" width="84" height="30" rx="8" fill="paper" stroke="edge" stroke-width="2"/>` +
  (state === 'ok'
    ? `<circle cx="84" cy="${y + 15}" r="4" fill="accent"/>`
    : state === 'fail'
      ? `<path d="M80 ${y + 11}l8 8M88 ${y + 11}l-8 8" stroke="accent" stroke-width="2.5" stroke-linecap="round"/>`
      : `<circle cx="84" cy="${y + 15}" r="4" fill="ink" fill-opacity=".3"/>`) +
  `<circle cx="97" cy="${y + 15}" r="4" fill="ink" fill-opacity=".25"/>` +
  `<path d="M114 ${y + 11}H142M114 ${y + 19}H134" stroke="edge" stroke-width="3" stroke-linecap="round"/>`;
export default {
  title: 'Server error',
  keywords: ['500', 'server', 'outage', 'backend', 'downtime'],
  body: [
    backdrop(),
    '<rect x="86" y="40" width="84" height="102" rx="10" fill="muted"/>',
    unit(46, 'ok'),
    unit(82, 'fail'),
    unit(118, 'idle'),
    '<g float="1"><path d="M172 34L158 62H170L162 88L186 54H174L182 34Z" fill="accent" stroke="accent" stroke-width="1.5" stroke-linejoin="round"/></g>',
  ].join(''),
};
