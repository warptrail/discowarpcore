// backend/seed/garagePlacements.mock.js
// Dev-only item placements.
// Completely arbitrary assignments.
// Engine will validate keys and attach Item ObjectIds to Box.items.

module.exports = [
  {
    boxKey: 'garage.shelf.main',
    itemKeys: [
      'work_gloves',
      'safety_glasses',
      'tape_measure_25ft',
      'utility_knife',
      'utility_blades_pack',
    ],
  },
  {
    boxKey: 'garage.shelf.hardware',
    itemKeys: [
      'assorted_screws',
      'assorted_nails',
      'zip_ties_pack',
      'picture_hooks',
      'command_strips',
    ],
  },
  {
    boxKey: 'garage.shelf.hardware.hooks',
    itemKeys: ['duct_tape', 'electrical_tape', 'wire_nuts_assorted'],
  },
  {
    boxKey: 'garage.shelf.paint',
    itemKeys: ['spackle', 'putty_knife', 'painters_tape', 'sandpaper_assorted'],
  },
  {
    boxKey: 'garage.workbench.drawer',
    itemKeys: [
      'hammer_16oz',
      'phillips_screwdriver',
      'flathead_screwdriver',
      'needle_nose_pliers',
      'adjustable_wrench',
    ],
  },
  {
    boxKey: 'garage.workbench.electrical',
    itemKeys: ['extension_cord_25ft', 'outlet_tester', 'hearing_protection'],
  },
  {
    boxKey: 'garage.workbench.consumables',
    itemKeys: ['wd40', 'shop_rags'],
  },
  {
    boxKey: 'garage.bike.corner',
    itemKeys: ['hex_keys_set', 'cordless_drill'],
  },
  {
    boxKey: 'garage.bike.tools',
    itemKeys: ['bike_tire_levers', 'bike_mini_pump', 'bike_chain_lube'],
  },
  {
    boxKey: 'garage.bike.spares',
    itemKeys: ['bike_patch_kit'],
  },
  {
    boxKey: 'garage.auto.shelf',
    itemKeys: ['drill_bits_set'],
  },
];
