/** @type {import('../types').IconSource} */
export default {
  name: 'calendar',
  category: 'time',
  tags: ['date', 'schedule', 'event'],
  outline: [
    '<rect x="3" y="5" width="18" height="16" rx="3"/>',
    '<path d="M8 3v4M16 3v4"/>',
    '<path d="M3 10h18"/>',
  ],
  duotone: [
    '<rect x="3" y="5" width="18" height="16" rx="3"/>',
    '<path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2H3z"/>',
  ],
  solid: {
    fill: [
      '<rect x="3" y="5" width="18" height="16" rx="3"/>',
    ],
    line: [
      '<path d="M8 3v4M16 3v4"/>',
    ],
    cut: [
      '<path d="M3 10h18"/>',
    ],
  },
};
