// seed/boxTrees.mock.js
// Star Trek–themed mock data with realistic container labels and detailed metadata.
// Each node:
//   { label, location, description, notes, tags: string[], items: string[], children?: Node[] }

module.exports = [
  // ========================
  // A — STARFLEET OPS
  // ========================
  {
    label: 'stack of duty rosters binders',
    location: 'Starfleet Command',
    description:
      'Administrative binders kept near operations for quick reference.',
    notes: 'Rotate weekly; keep last 4 weeks archived.',
    tags: ['starfleet', 'ops', 'paperwork'],
    items: [
      'Admiral’s Briefing PADD',
      'Fleet Operations Schedules',
      'Temporal Prime Directive Addendum',
    ],
    children: [
      {
        label: 'locker of cadet training materials',
        location: 'Starfleet Command > Academy',
        description: 'Training supplies for incoming cadets.',
        notes: 'Issue after orientation.',
        tags: ['academy', 'training'],
        items: [
          'Cadet Training Manuals',
          'Kobayashi Maru Scenario Files',
          'Warp Theory Midterm Keys',
        ],
        children: [
          {
            label: 'secure crate of engineering tools',
            location: 'Starfleet Command > Academy > Engineering Annex',
            description:
              'Hands-on kits for basic maintenance and safety drills.',
            notes: 'Inspect after each lab section.',
            tags: ['engineering', 'tools'],
            items: [
              'Matter-Antimatter Safety Posters',
              'Type-II Phaser Disassembly Kit',
            ],
            children: [
              {
                label: 'fabrication bay parts trolley',
                location:
                  'Starfleet Command > Academy > Engineering Annex > Fabrication Bay',
                description: 'Commonly replicated patterns and jigs.',
                notes: 'Keep jigs free of residue.',
                tags: ['fabrication', 'patterns'],
                items: [
                  'Replicator Pattern: EVA Gloves',
                  'Dilithium Matrix Jig',
                ],
              },
            ],
          },
          {
            label: 'rolling cart of med simulators',
            location: 'Starfleet Command > Academy > Medical Wing',
            description: 'Training props for field triage exercises.',
            notes: 'Sterilize mock injectors after use.',
            tags: ['medical', 'training'],
            items: ['Hypospray Cartridge Rack', 'Starfleet Field Triage Notes'],
          },
        ],
      },
      {
        label: 'cargo cage of starbase supplies',
        location: 'Starfleet Command > Starbase 1',
        description: 'General depot for starbase operations.',
        notes: 'Seal after hours.',
        tags: ['starbase', 'logistics'],
        items: ['Docking Schedules', 'Diplomatic Credentials Vault'],
        children: [
          {
            label: 'workbench bin of alignment tools',
            location: 'Starfleet Command > Starbase 1 > Drydock Control',
            description: 'Precision gear for nacelle alignment.',
            notes: 'Laser calibration due monthly.',
            tags: ['drydock', 'alignment'],
            items: ['Nacelle Alignment Laser', 'Workbee Spare Parts Bin'],
          },
          {
            label: 'caged shelving for quartermaster stores',
            location: 'Starfleet Command > Starbase 1 > Quartermaster',
            description: 'Issue-only standard kits and insignia.',
            notes: 'Officer signature required.',
            tags: ['quartermaster', 'issue'],
            items: [
              'Uniform Insignia Case',
              'Standard Survival Kit',
              'Type-I Tricorder Charger',
            ],
            children: [
              {
                label: 'walk-in cold storage rack',
                location:
                  'Starfleet Command > Starbase 1 > Quartermaster > Cold Storage',
                description: 'Temperature-sensitive provisions.',
                notes: 'Maintain at 3°C.',
                tags: ['cold-storage', 'provisions'],
                items: ['Emergency Rations Crate', 'Isolinear Rod Pallet'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ================================
  // B — U.S.S. ENTERPRISE (NCC-1701-D)
  // ================================
  {
    label: 'sealed trunk of mission archives',
    location: 'U.S.S. Enterprise (NCC-1701-D)',
    description: 'Encrypted historical mission records.',
    notes: 'Captain authorization required.',
    tags: ['enterprise', 'archives'],
    items: [
      'Master Systems Display Archive',
      'Captain’s Log Archive (Encrypted)',
    ],
    children: [
      {
        label: 'barrel of warp maintenance consumables',
        location: 'U.S.S. Enterprise > Main Engineering',
        description: 'Bulk consumables for warp core maintenance.',
        notes: 'Check seals before transport.',
        tags: ['engineering', 'warp'],
        items: [
          'Warp Core Confinement Coil Spares',
          'Plasma Coolant Protocols',
          'Isolinear Chip Trays',
        ],
        children: [
          {
            label: 'crate of EPS fittings',
            location:
              'U.S.S. Enterprise > Main Engineering > EPS Conduit Locker A',
            description: 'Assorted conduit parts organized by size.',
            notes: 'Restock from cargo bay 4.',
            tags: ['eps', 'fittings'],
            items: ['EPS Taps', 'Conduit Gaskets', 'Phase Compensator Set'],
          },
          {
            label: 'Jeffries tube satchel',
            location:
              'U.S.S. Enterprise > Main Engineering > Jeffries Tube Access J-12',
            description: 'Portable kit for tight-access diagnostics.',
            notes: 'Return to hook J-12 after use.',
            tags: ['maintenance', 'portable'],
            items: ['Portable Field Generator', 'Diagnostic Toolkit Mk IV'],
            children: [
              {
                label: 'lockbox of spares',
                location:
                  'U.S.S. Enterprise > Main Engineering > Jeffries Tube Access J-12 > Maintenance Cache',
                description: 'Spare parts for on-the-spot fixes.',
                notes: 'Track usage in LCARS.',
                tags: ['spares'],
                items: [
                  'Fiber-Optic Bundle',
                  'Micro-Spanner Kit',
                  'Thermal Sealant',
                ],
              },
            ],
          },
        ],
      },
      {
        label: 'medical supply cabinet',
        location: 'U.S.S. Enterprise > Sickbay',
        description: 'Commonly requested medical instruments.',
        notes: 'EMH has read access.',
        tags: ['medical', 'sickbay'],
        items: [
          'Biobed Sensor Array',
          'Klingon Physiology Reference',
          'Medical Tricorder Calibrators',
        ],
        children: [
          {
            label: 'isolation cart',
            location: 'U.S.S. Enterprise > Sickbay > Isolation Ward',
            description: 'Quarantine-ready kit.',
            notes: 'Seal cart when not in use.',
            tags: ['isolation', 'quarantine'],
            items: ['Biofilter Logs', 'Emergency Antiviral Packs'],
          },
          {
            label: 'pharmacy drawer set',
            location: 'U.S.S. Enterprise > Sickbay > Pharmacy',
            description: 'Controlled substances and refills.',
            notes: 'Log all dispenses.',
            tags: ['pharmacy', 'controlled'],
            items: [
              'Hypospray Refills',
              'Analgesic Ampoules',
              'Dermal Regenerator',
            ],
          },
        ],
      },
      {
        label: 'flightline tool chest',
        location: 'U.S.S. Enterprise > Shuttlebay 2',
        description: 'Shuttle maintenance and preflight tools.',
        notes: 'Return torque drivers to drawer 3.',
        tags: ['shuttlebay', 'tools'],
        items: ['Runabout Spare Parts', 'Inertial Damper Test Rig'],
        children: [
          {
            label: 'under-seat storage bin',
            location: 'U.S.S. Enterprise > Shuttlebay 2 > Shuttle “Galileo”',
            description: 'Emergency equipment within crew reach.',
            notes: 'Quarterly inspection.',
            tags: ['shuttle', 'emergency'],
            items: ['Preflight Checklists', 'Impulse Starter Coupler'],
          },
          {
            label: 'aft locker',
            location: 'U.S.S. Enterprise > Shuttlebay 2 > Shuttle “Copernicus”',
            description: 'Misc mission spares.',
            notes: 'Latch is sticky; lubricate.',
            tags: ['shuttle', 'spares'],
            items: ['Emergency Beacon Kit', 'Portable Pattern Buffer'],
          },
        ],
      },
    ],
  },

  // ================================
  // C — DEEP SPACE NINE
  // ================================
  {
    label: 'promenade storage cabinet',
    location: 'Deep Space Nine',
    description: 'General storage for promenade operations.',
    notes: 'Ops requests access during emergency.',
    tags: ['ds9', 'promenade'],
    items: ['Bajor Sector Traffic Logs', 'Wormhole Sensor Telemetry'],
    children: [
      {
        label: 'bartender’s backroom crates',
        location: 'Deep Space Nine > Promenade',
        description: 'Quark’s overflow storage.',
        notes: 'Keep ledgers sealed.',
        tags: ['commerce', 'quarks'],
        items: ['Vendor Permits', 'Civilian Incident Reports'],
        children: [
          {
            label: 'locked liquor cabinet',
            location: 'Deep Space Nine > Promenade > Quark’s Bar',
            description: 'High-value supplies and gaming spares.',
            notes: 'Access restricted to staff.',
            tags: ['bar', 'gaming'],
            items: [
              'Dabo Table Parts',
              'Ferengi Ledger (Sealed)',
              'Synthehol Stock Manifest',
            ],
          },
          {
            label: 'confiscation locker',
            location: 'Deep Space Nine > Promenade > Security Office',
            description: 'Evidence and seized devices.',
            notes: 'Chain-of-custody required.',
            tags: ['security', 'evidence'],
            items: ['Holding Cell Inventory', 'Confiscated Devices Box'],
          },
        ],
      },
      {
        label: 'ops rolling crate',
        location: 'Deep Space Nine > Ops',
        description: 'Mission readiness binders and calibrations.',
        notes: 'Stage near the Defiant airlock.',
        tags: ['ops', 'mission'],
        items: [
          'Defiant Readiness Binder',
          'Runabout Flight Plans',
          'Subspace Relay Calibrations',
        ],
        children: [
          {
            label: 'upper pylon tool sling',
            location: 'Deep Space Nine > Ops > Upper Pylon Repair',
            description: 'Exterior EVA patch kit.',
            notes: 'Pair with mag-boots.',
            tags: ['repair', 'eva'],
            items: ['Graviton Wrench', 'Hull Patch Foam', 'Mag-Boots'],
          },
        ],
      },
    ],
  },

  // ================================
  // D — VULCAN SCIENCE DIRECTORATE
  // ================================
  {
    label: 'archive tote of lecture materials',
    location: 'Vulcan Science Directorate',
    description: 'Scholarly resources stored with care.',
    notes: 'Do not bend scrolls.',
    tags: ['vulcan', 'archive'],
    items: ['Logic Exercises Archive', 'T’Plana-Hath Lecture Notes'],
    children: [
      {
        label: 'sensor case',
        location: 'Vulcan Science Directorate > Seismic Observatory',
        description: 'Seismic study instruments.',
        notes: 'Replace silica gel packs monthly.',
        tags: ['seismic', 'sensors'],
        items: ['Tremor Data Crystals', 'Tectonic Model Holos'],
      },
      {
        label: 'artifact crate',
        location: 'Vulcan Science Directorate > Xenoanthropology Vault',
        description: 'Cultural items under study.',
        notes: 'Handle with gloves.',
        tags: ['xenoanthropology', 'artifacts'],
        items: ['Surak Commentaries', 'Pre-Surak Ritual Artifacts (Catalog)'],
        children: [
          {
            label: 'climate kit trunk',
            location:
              'Vulcan Science Directorate > Xenoanthropology Vault > Climate Repository',
            description: 'Desert field gear.',
            notes: 'Return canteens full.',
            tags: ['climate', 'field'],
            items: ['Desert Adaptation Study', 'Thermoregulatory Cloaks'],
            children: [
              {
                label: 'field cache satchel',
                location:
                  'Vulcan Science Directorate > Xenoanthropology Vault > Climate Repository > Field Cache — Forge',
                description: 'Emergency set for deep Forge.',
                notes: 'Replace emergency rations quarterly.',
                tags: ['field', 'emergency'],
                items: ['Water Collector Kit', 'Emergency Shelter Fabric'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ================================
  // E — KLINGON DEFENSE FORCE
  // ================================
  {
    label: 'warrior’s chest',
    location: 'Klingon Defense Force Depot',
    description: 'Ceremonial and combat gear.',
    notes: 'Honor guard only.',
    tags: ['klingon', 'armory'],
    items: ['Warrior’s Oath Scrolls', 'Bloodwine Crates (Aged)'],
    children: [
      {
        label: 'armory rack',
        location: 'Klingon Defense Force Depot > Armory',
        description: 'Weapons and chargers.',
        notes: 'Sharpen after drills.',
        tags: ['weapons'],
        items: ['Bat’leth Rack', 'Disruptor Chargers', 'Armor Polish'],
        children: [
          {
            label: 'honor forge bin',
            location: 'Klingon Defense Force Depot > Armory > Honor Forge',
            description: 'Ceremonial smithing supplies.',
            notes: 'Do not quench in bloodwine.',
            tags: ['forge', 'ceremony'],
            items: ['Insignia Stamps', 'Ceremonial Blade Scabbards'],
          },
        ],
      },
      {
        label: 'hangar stock crate',
        location: 'Klingon Defense Force Depot > Bird-of-Prey Hangar',
        description: 'Maintenance consumables for Birds-of-Prey.',
        notes: 'Log fuel pod movement.',
        tags: ['hangar', 'maintenance'],
        items: ['Cloaking Field Dampeners', 'Deuterium Fuel Pods'],
        children: [
          {
            label: 'maintenance pit bin',
            location:
              'Klingon Defense Force Depot > Bird-of-Prey Hangar > Maintenance Pit',
            description: 'Fluid and nozzle spares.',
            notes: 'Label all hoses.',
            tags: ['maintenance', 'fluids'],
            items: ['Coolant Pumps', 'Warp Coil Scrap Bin', 'Injector Nozzles'],
          },
          {
            label: 'records alcove carton',
            location:
              'Klingon Defense Force Depot > Bird-of-Prey Hangar > Flight Records Alcove',
            description: 'Mission logs and holos.',
            notes: 'Commander access only.',
            tags: ['records'],
            items: ['Battle Logs', 'Tactical Holos'],
          },
        ],
      },
    ],
  },

  // ================================
  // F — SECTION 31
  // ================================
  {
    label: 'sealed black case',
    location: 'Section 31 — Containment',
    description: 'Classified materials.',
    notes: 'Audit by two officers.',
    tags: ['section31', 'classified'],
    items: ['Redacted Orders', 'Quantum Encryption Keys'],
    children: [
      {
        label: 'containment locker',
        location: 'Section 31 — Containment > Borg Debris Lab',
        description: 'Borg-related components under stasis.',
        notes: 'EM shielding required.',
        tags: ['borg', 'containment'],
        items: [
          'Nanoprobe Stasis Canister',
          'Adaptive Shield Sample',
          'Node Interface Shard',
        ],
        children: [
          {
            label: 'Classified locker A tray',
            location:
              'Section 31 — Containment > Borg Debris Lab > Classified Locker A',
            description: 'Non-lethal countermeasures.',
            notes: 'Remove power cells after drills.',
            tags: ['classified', 'locker'],
            items: [
              'EMP Grenade (Non-Lethal)',
              'Interlink Transceiver Skeleton',
            ],
          },
          {
            label: 'Classified locker B tray',
            location:
              'Section 31 — Containment > Borg Debris Lab > Classified Locker B',
            description: 'Experimental code and diagnostics.',
            notes: 'Do not connect to main bus.',
            tags: ['classified', 'code'],
            items: ['Viral Subroutine Models', 'Cortical Node Diagnostics'],
          },
        ],
      },
      {
        label: 'temporal crate',
        location: 'Section 31 — Containment > Temporal Artifacts Vault',
        description: 'Chroniton-sensitive artifacts.',
        notes: 'Handle with temporal gloves.',
        tags: ['temporal', 'artifacts'],
        items: ['Chroniton Residue Vials', 'Paradox Flag Ledger'],
      },
    ],
  },

  // ================================
  // G — ROMULAN LISTENING POST
  // ================================
  {
    label: 'encrypted locker',
    location: 'Romulan Listening Post',
    description: 'Intelligence cache.',
    notes: 'Autolock after 30s.',
    tags: ['romulan', 'intel'],
    items: ['Encrypted Subspace Logs', 'Cloak Field Harmonics'],
    children: [
      {
        label: 'decoder desk drawer',
        location: 'Romulan Listening Post > Decoder Room',
        description: 'Active decoding materials.',
        notes: 'Rotate algorithm crystals.',
        tags: ['decoder'],
        items: ['Algorithm Sheets', 'Enigma Crystal Matrix'],
      },
      {
        label: 'supply niche bin',
        location: 'Romulan Listening Post > Supply Niche',
        description: 'Field rations and uniforms.',
        notes: 'Issue with receipt.',
        tags: ['supply'],
        items: ['Ration Bars', 'Coolant Coils', 'Uniform Mantles'],
        children: [
          {
            label: 'false-bottom cache',
            location: 'Romulan Listening Post > Supply Niche > Hidden Cache',
            description: 'Concealed navigation chips.',
            notes: 'Tal Shiar use only.',
            tags: ['hidden', 'nav'],
            items: ['Backup Warbird Nav-Chips', 'Tal Shiar Marker Beacons'],
          },
        ],
      },
    ],
  },

  // ================================
  // H — STARFLEET LOGISTICS HUB
  // ================================
  {
    label: 'pallet of relief kits',
    location: 'Starfleet Logistics Hub',
    description: 'Prepared shipments for disaster relief.',
    notes: 'Manifest must match replicator logs.',
    tags: ['logistics', 'relief'],
    items: ['Sector Freight Manifests', 'Relief Mission Kits'],
    children: [
      {
        label: 'hangar tool rack',
        location: 'Starfleet Logistics Hub > Hangar Deck',
        description: 'Ground handling gear.',
        notes: 'Inspect grav-lifts daily.',
        tags: ['hangar', 'gear'],
        items: ['Cargo Netting', 'Grav-Lift Pallets'],
        children: [
          {
            label: 'runabout kit drawer',
            location:
              'Starfleet Logistics Hub > Hangar Deck > Runabout “Yosemite”',
            description: ' EVA tool crate and hull patches.',
            notes: 'Patch kit expires next quarter.',
            tags: ['runabout', 'eva'],
            items: ['Tool Crate — EVA', 'Hull Integrity Patches'],
          },
          {
            label: 'aft service shelf',
            location:
              'Starfleet Logistics Hub > Hangar Deck > Runabout “Sequoia”',
            description: 'Power and control spares.',
            notes: 'Label RCJ crates.',
            tags: ['runabout', 'power'],
            items: ['Power Cell Rack', 'Spare Reaction Control Jets'],
          },
        ],
      },
      {
        label: 'inventory ledger crate',
        location: 'Starfleet Logistics Hub > Inventory Control',
        description: 'Audit documents & licenses.',
        notes: 'Cross-check quarterly.',
        tags: ['inventory', 'audit'],
        items: ['Isolinear Audit Sheets', 'Replicator Pattern Licenses'],
      },
    ],
  },

  // ================================
  // I — DELTA QUADRANT RESEARCH
  // ================================
  {
    label: 'research tote bin',
    location: 'Delta Quadrant Research Node',
    description: 'Misc research artifacts.',
    notes: 'Quarantine anything with macroviral risk.',
    tags: ['research', 'delta'],
    items: ['Caretaker Array Notes', 'Macrovirus Study Capsule'],
    children: [
      {
        label: 'bio-sample fridge box',
        location: 'Delta Quadrant Research Node > Exobiology Lab',
        description: 'Biological sample containment.',
        notes: 'Maintain nitrogen levels.',
        tags: ['bio', 'samples'],
        items: ['Bio-sample Containment Tubes', 'N2 Atmosphere Box'],
      },
      {
        label: 'astrometrics map tube',
        location: 'Delta Quadrant Research Node > Astrometrics',
        description: 'Star maps and sensor logs.',
        notes: 'Secure lens caps.',
        tags: ['astrometrics', 'maps'],
        items: ['Transwarp Corridor Maps', 'Gravimetric Scan Cubes'],
        children: [
          {
            label: 'sensor palette case',
            location:
              'Delta Quadrant Research Node > Astrometrics > Sensor Palette',
            description: 'Interchangeable filters/lenses.',
            notes: 'Handle edges only.',
            tags: ['sensors', 'optics'],
            items: ['Tetryon Filter Wheel', 'Subspace Interferometer Lens'],
          },
        ],
      },
    ],
  },

  // ================================
  // J — TACTICAL SIMULATIONS WING
  // ================================
  {
    label: 'scenario prop crate',
    location: 'Tactical Simulations Wing',
    description: 'Holodeck scenario kits.',
    notes: 'Verify safety overrides before sessions.',
    tags: ['tactical', 'holodeck'],
    items: ['Holodeck Safety Overrides', 'Tactical Scenario Briefs'],
    children: [
      {
        label: 'prop bin — holodeck 3',
        location: 'Tactical Simulations Wing > Holodeck 3',
        description: 'Borg simulation props.',
        notes: 'Inspect after cube scenario.',
        tags: ['holodeck', 'borg'],
        items: ['Borg Cube Scenario Pack', 'Emergency Stop Lanyard'],
      },
      {
        label: 'prop bin — holodeck 4',
        location: 'Tactical Simulations Wing > Holodeck 4',
        description: 'Boarding drill props.',
        notes: 'Ventilate after pyrotechnic use (simulated).',
        tags: ['holodeck', 'klingon'],
        items: ['Klingon Boarding Drill', 'Environmental Control Props'],
        children: [
          {
            label: 'prop storage tote',
            location: 'Tactical Simulations Wing > Holodeck 4 > Prop Storage',
            description: 'Generic hardware stand-ins.',
            notes: 'Replace cracked acrylics.',
            tags: ['props', 'storage'],
            items: [
              'Stasis Tank Shell',
              'Dummy EPS Relay',
              'Mock Plasma Torch',
            ],
          },
        ],
      },
      {
        label: 'after-action file box',
        location: 'Tactical Simulations Wing > After-Action Archive',
        description: 'Post-exercise records.',
        notes: 'Instructor initials required.',
        tags: ['archive', 'records'],
        items: ['Performance Metrics', 'Instructor Notes'],
      },
    ],
  },
];
