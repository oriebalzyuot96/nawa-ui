/** @type {import('../types').IconSource} */
export default {
  name: 'x-circle',
  category: 'status',
  tags: ['error', 'close', 'cancel'],
  outline: [
    '<circle cx="12" cy="12" r="9"/>',
    '<path d="M9 9l6 6M15 9l-6 6"/>',
  ],
  duotone: [
    '<circle cx="12" cy="12" r="9"/>',
  ],
  solid: {
    fill: [
      '<circle cx="12" cy="12" r="9"/>',
    ],
    cut: [
      '<path d="M9 9l6 6M15 9l-6 6"/>',
    ],
  },
};
