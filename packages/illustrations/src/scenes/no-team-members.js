import { backdrop } from '../helpers.js';

const person = (cx, cy, head, body, attrs) =>
  `<circle cx="${cx}" cy="${cy}" r="${head}" ${attrs}/>` +
  `<path d="M${cx - body} ${cy + head + 8 + body}a${body} ${body} 0 0 1 ${body * 2} 0Z" ${attrs}/>`;
export default {
  title: 'No team members',
  keywords: ['team', 'members', 'people', 'users', 'invite', 'collaborators'],
  body: [
    backdrop(),
    person(70, 82, 11, 19, 'fill="muted" stroke="edge" stroke-width="2"'),
    person(170, 82, 11, 19, 'fill="muted" stroke="edge" stroke-width="2"'),
    person(120, 66, 15, 27, 'fill="paper" stroke="accent" stroke-width="2" stroke-dasharray="4 4" stroke-linejoin="round"'),
    '<g float="1"><circle cx="146" cy="104" r="12" fill="accent"/><path d="M146 98v12M140 104h12" stroke="paper" stroke-width="2.5" stroke-linecap="round"/></g>',
    '<rect x="48" y="128" width="144" height="8" rx="4" fill="muted"/>',
  ].join(''),
};
