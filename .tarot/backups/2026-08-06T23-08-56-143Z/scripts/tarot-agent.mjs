#!/usr/bin/env node

import { launchAgent } from './tarot-dock.mjs';

launchAgent().catch((error) => {
  console.error(`Tarot agent could not open: ${error.message}`);
  process.exitCode = 1;
});
