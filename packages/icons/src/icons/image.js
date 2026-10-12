/** @type {import('../types').IconSource} */
export default {
  name: 'image',
  category: 'media',
  tags: ['picture', 'photo', 'gallery'],
  outline: [
    '<rect x="3" y="4" width="18" height="16" rx="3"/>',
    '<circle cx="8.5" cy="9.5" r="1.75"/>',
    '<path d="M3.5 17.5L9 12l4.5 4.5 2.5-2.5 4.5 4.5"/>',
  ],
  duotone: [
    '<rect x="3" y="4" width="18" height="16" rx="3"/>',
  ],
  solid: {
    fill: [
      '<rect x="3" y="4" width="18" height="16" rx="3"/>',
    ],
    cut: [
      '<circle cx="8.5" cy="9.5" r="1.75"/>',
      '<path d="M3.5 17.5L9 12l4.5 4.5 2.5-2.5 4.5 4.5"/>',
    ],
  },
};
