// Pure data describing trees (≤4 deep), plus item labels per node.
// You can make as many scenarios as you like — these three give variety.

module.exports = [
  // Group 1: linear chain A>B>C>D
  {
    label: 'Alpha',
    items: ['Alpha headlamp'],
    children: [
      {
        label: 'Beta',
        items: ['Beta rope'],
        children: [
          {
            label: 'Gamma',
            items: ['Gamma map'],
            children: [{ label: 'Delta', items: ['Delta gem'] }],
          },
        ],
      },
    ],
  },

  // Group 2: wide root + some grandchildren
  {
    label: 'Oak',
    items: ['Oak toolkit'],
    children: [
      { label: 'Pine', items: ['Pine cones'] },
      {
        label: 'Maple',
        items: ['Maple syrup'],
        children: [
          { label: 'Cedar', items: ['Cedar plank'] },
          { label: 'Willow', items: ['Willow switch'] },
        ],
      },
      { label: 'Birch', items: ['Birch bark'] },
    ],
  },

  // Group 3: two separate roots (Orion has a grandchild)
  {
    label: 'Aquila',
    items: ['Aquila feather'],
    children: [{ label: 'Lyra', items: ['Lyra strings'] }],
  },
  {
    label: 'Orion',
    items: ['Orion belt'],
    children: [
      { label: 'Rigel', items: ['Rigel star'] },
      {
        label: 'Betelgeuse',
        items: ['Betelgeuse ember'],
        children: [{ label: 'Saiph', items: ['Saiph spark'] }],
      },
    ],
  },
];
