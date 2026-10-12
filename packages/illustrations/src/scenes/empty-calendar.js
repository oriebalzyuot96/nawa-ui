import { backdrop } from '../helpers.js';

const cells = [];
for (const [r, y] of [86, 104, 122].entries()) {
  for (const [c, x] of [74, 92, 110, 128, 146].entries()) {
    if (r === 1 && c === 2) continue;
    cells.push(`<rect x="${x}" y="${y}" width="12" height="10" rx="3" fill="muted"${(r + c) % 3 === 0 ? ' fill-opacity=".55"' : ''}/>`);
  }
}
export default {
  title: 'Nothing scheduled',
  keywords: ['calendar', 'schedule', 'events', 'agenda', 'meetings'],
  body: [
    backdrop(),
    '<rect x="78" y="42" width="104" height="100" rx="12" fill="muted"/>',
    '<rect x="62" y="50" width="104" height="100" rx="12" fill="paper" stroke="edge" stroke-width="2"/>',
    '<path d="M62 62a12 12 0 0 1 12-12h80a12 12 0 0 1 12 12v10H62Z" fill="accent"/>',
    '<rect x="84" y="42" width="7" height="16" rx="3.5" fill="paper" stroke="edge" stroke-width="2"/>',
    '<rect x="137" y="42" width="7" height="16" rx="3.5" fill="paper" stroke="edge" stroke-width="2"/>',
    cells.join(''),
    '<rect x="109" y="103" width="14" height="12" rx="3.5" fill="none" stroke="accent" stroke-width="1.5" stroke-dasharray="2.5 2.5"/>',
    '<g float="1"><circle cx="170" cy="134" r="14" fill="accent"/><path d="M170 127v14M163 134h14" stroke="paper" stroke-width="2.5" stroke-linecap="round"/></g>',
  ].join(''),
};
