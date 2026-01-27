// backend/seed/garageBoxes.mock.js
// Dev-only mock boxes (nested tree).
// - Max depth: 3
// - Some boxes have children, some do not
// - items arrays are intentionally EMPTY
// - `key` is seed-only and must NOT be stored in the DB

module.exports = [
  {
    key: 'garage.shelf.main',
    label: 'Garage: Main Shelf Bin',
    location: 'Garage',
    description: 'Common tools and frequently used supplies.',
    notes: 'Baseline dev dataset.',
    tags: ['garage', 'baseline'],
    items: [],
    children: [
      {
        key: 'garage.shelf.hardware',
        label: 'Hardware Organizer',
        location: 'Garage',
        description: 'Fasteners, hanging hardware, small parts.',
        notes: '',
        tags: ['hardware'],
        items: [],
        children: [
          {
            key: 'garage.shelf.hardware.hooks',
            label: 'Hooks & Hangers Tray',
            location: 'Garage',
            description: 'Hooks, strips, hangers, and clips.',
            notes: '',
            tags: ['hardware', 'hang'],
            items: [],
          },
        ],
      },
      {
        key: 'garage.shelf.paint',
        label: 'Painting & Patch Kit',
        location: 'Garage',
        description: 'Wall patching and small paint projects.',
        notes: '',
        tags: ['paint', 'repairs'],
        items: [],
      },
    ],
  },

  {
    key: 'garage.workbench.drawer',
    label: 'Garage: Workbench Drawer',
    location: 'Garage',
    description: 'Hand tools and daily drivers.',
    notes: '',
    tags: ['garage', 'tools'],
    items: [],
    children: [
      {
        key: 'garage.workbench.electrical',
        label: 'Electrical Bits',
        location: 'Garage',
        description: 'Electrical tape, wire nuts, tester, spare cord.',
        notes: '',
        tags: ['electrical'],
        items: [],
      },
      {
        key: 'garage.workbench.consumables',
        label: 'Consumables & Adhesives',
        location: 'Garage',
        description: 'Tapes, ties, sprays, and odds and ends.',
        notes: '',
        tags: ['consumable'],
        items: [],
      },
    ],
  },

  {
    key: 'garage.bike.corner',
    label: 'Garage: Bike Corner Kit',
    location: 'Garage',
    description: 'Bike maintenance and related gear.',
    notes: '',
    tags: ['bike'],
    items: [],
    children: [
      {
        key: 'garage.bike.tools',
        label: 'Bike Tools Pouch',
        location: 'Garage',
        description: 'Bike-specific tools and accessories.',
        notes: '',
        tags: ['bike', 'tools'],
        items: [],
        children: [
          {
            key: 'garage.bike.spares',
            label: 'Bike Spares',
            location: 'Garage',
            description: 'Spare tubes, patches, and small bike parts.',
            notes: '',
            tags: ['bike', 'spares'],
            items: [],
          },
        ],
      },
    ],
  },

  {
    // ✅ Box with NO children at all (explicit leaf)
    key: 'garage.auto.shelf',
    label: 'Garage: Auto / Fluids Shelf',
    location: 'Garage',
    description: 'Car-related fluids and emergency supplies.',
    notes: '',
    tags: ['auto'],
    items: [],
    children: [],
  },
];
