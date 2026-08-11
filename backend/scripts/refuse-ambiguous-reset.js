const lifecycleName = String(process.env.npm_lifecycle_event || 'reset');

console.error(`❌ "npm run ${lifecycleName}" is disabled because the word reset is too ambiguous.`);
console.error('No database, intake state, or media was changed.');
console.error('');
console.error('Development-only commands:');
console.error('  npm run reset:development -- --yes-reset-discowarpcore-dev-db-and-intake');
console.error('  npm run reset:development:hard -- --yes-delete-discowarpcore-dev-db-intake-and-media');
console.error('');
console.error('Both commands independently refuse production hosts, production environment flags,');
console.error('non-loopback MongoDB hosts, and database names without a development/test suffix.');
process.exit(1);
