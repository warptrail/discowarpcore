import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, statfsSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { healthContract, validateManifest } from './manifest.mjs';
import { redactValue, safeReadJson } from './persistence.mjs';

export const REPORT_SCHEMA_VERSION = 1;

function commandEvidence(command, args, timeout = 3000) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || '').trim().slice(-6000),
    stderr: String(result.stderr || '').trim().slice(-6000),
    error: result.error?.message || '',
  };
}

function listenerEvidence(port) {
  const result = commandEvidence('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpcn']);
  const rows = [];
  let current = {};
  for (const line of result.stdout.split(/\r?\n/)) {
    if (line.startsWith('p')) { if (current.pid) rows.push(current); current = { pid: Number(line.slice(1)) }; }
    else if (line.startsWith('c')) current.command = line.slice(1);
    else if (line.startsWith('n')) current.address = line.slice(1);
  }
  if (current.pid) rows.push(current);
  return rows;
}

function tail(path, lines = 30) {
  if (!path || !existsSync(path)) return [];
  try { return readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).slice(-lines); } catch { return []; }
}

function mongoEvidence(manifest) {
  const mongo = (manifest.profiles?.development?.services || []).find((service) => service.protocol === 'mongodb');
  if (!mongo || process.platform !== 'darwin') return null;
  const brew = commandEvidence('brew', ['services', 'list']);
  const launchd = commandEvidence('launchctl', ['print', `gui/${process.getuid?.() || 0}/homebrew.mxcl.mongodb-community`]);
  const plist = resolve(os.homedir(), 'Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist');
  return {
    port: mongo.port,
    listeners: listenerEvidence(mongo.port),
    brew,
    launchd,
    plist: existsSync(plist) ? plist : '',
    serviceLog: tail('/opt/homebrew/var/log/mongodb/output.log', 30),
  };
}

function toolEvidence(name, args = ['--version']) {
  const evidence = commandEvidence(name, args, 1500);
  return { available: !evidence.error && evidence.status !== null, version: evidence.stdout.split('\n')[0] || evidence.stderr.split('\n')[0] || '' };
}

function safeSystemValue(read, fallback = null) {
  try { return read(); } catch { return fallback; }
}

function checksumEvidence(root, release) {
  if (!release?.files) return { ok: false, error: 'Release metadata is unavailable.', files: [] };
  const files = release.files.map((file) => {
    const path = resolve(root, file);
    if (!existsSync(path)) return { file, ok: false, error: 'missing' };
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    const expected = release.hashes?.[file] || '';
    return { file, ok: Boolean(expected) && actual === expected, expected, actual };
  });
  return { ok: files.every((file) => file.ok), files };
}

export function buildDiagnosticReport({
  root,
  manifest,
  profileName = 'development',
  statePath,
  lockPath,
  socketPath,
  releasePath,
  incidents = [],
  state = null,
}) {
  const validation = validateManifest(manifest, root, profileName);
  const runtimeState = state || safeReadJson(statePath, null);
  const services = (manifest.profiles?.[profileName]?.services || []).map((service, index) => {
    const runtime = runtimeState?.services?.find((entry) => entry.id === service.id) || {};
    return {
      id: service.id,
      label: service.label || service.id,
      scrySlot: index + 1,
      port: service.port,
      protocol: service.protocol || 'http',
      dependsOn: service.dependsOn || [],
      health: healthContract(service),
      listeners: listenerEvidence(service.port),
      runtime: {
        state: runtime.state || 'unknown',
        processState: runtime.processState || 'unknown',
        healthState: runtime.healthState || 'unknown',
        ownershipState: runtime.ownershipState || 'unknown',
        reason: runtime.stateReason || runtime.error || '',
        lastTransitionAt: runtime.lastTransitionAt || null,
        lastProbeAt: runtime.lastProbeAt || null,
        runId: runtime.runId || '',
      },
      lan: service.lan || {},
      envKeys: Object.keys(service.env || {}),
    };
  });
  const release = safeReadJson(releasePath, null);
  const lock = safeReadJson(lockPath, null) || (existsSync(lockPath) ? { legacyPid: readFileSync(lockPath, 'utf8').trim() } : null);
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    project: {
      id: manifest.projectId,
      name: manifest.displayName || manifest.projectId,
      root,
      profile: profileName,
      manifestVersion: manifest.manifestVersion || 0,
      tarotVersion: manifest.tarotVersion || manifest.version || '',
      releaseVersion: release?.version || '',
      checksumStatus: checksumEvidence(root, release),
    },
    summary: {
      validManifest: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      serviceCount: services.length,
      listeningCount: services.filter((service) => service.listeners.length).length,
    },
    agent: {
      lock,
      socketExists: existsSync(socketPath),
      socketMode: existsSync(socketPath) ? (statSync(socketPath).mode & 0o777).toString(8) : '',
      stateUpdatedAt: existsSync(statePath) ? statSync(statePath).mtime.toISOString() : null,
    },
    tools: {
      node: { available: true, version: process.version },
      lsof: toolEvidence('lsof', ['-v']),
      ps: toolEvidence('ps', ['-p', String(process.pid), '-o', 'command=']),
      brew: process.platform === 'darwin' ? toolEvidence('brew') : { available: false, version: '' },
    },
    system: {
      platform: process.platform,
      release: os.release(),
      hostname: os.hostname(),
      freeMemory: safeSystemValue(() => os.freemem()),
      uptimeSeconds: safeSystemValue(() => os.uptime()),
      disk: safeSystemValue(() => {
        const value = statfsSync(root);
        return { availableBytes: value.bavail * value.bsize, totalBytes: value.blocks * value.bsize };
      }),
    },
    registry: manifest.registry || {},
    services,
    mongo: mongoEvidence(manifest),
    incidents: incidents.slice(-100),
  };
}

export function renderDoctor(report) {
  const lines = [
    `✦ TAROT DOCTOR / ${String(report.project.name).toUpperCase()}`,
    `  Tarot ${report.project.tarotVersion || 'unknown'} · release ${report.project.releaseVersion || 'unknown'} · manifest v${report.project.manifestVersion || 'legacy'}`,
    `  Manifest ${report.summary.validManifest ? 'OK' : 'INVALID'} · ${report.summary.listeningCount}/${report.summary.serviceCount} declared ports listening`,
    `  Payload checksums ${report.project.checksumStatus.ok ? 'OK' : 'MISMATCH'}`,
  ];
  report.summary.errors.forEach((message) => lines.push(`  × ${message}`));
  report.summary.warnings.forEach((message) => lines.push(`  ! ${message}`));
  report.services.forEach((service) => {
    const listener = service.listeners.length ? `LISTENING (${service.listeners.map((entry) => entry.pid).join(', ')})` : 'NO LISTENER';
    lines.push(`  ${service.scrySlot}. ${service.label} :${service.port} · ${listener} · ${service.runtime.processState}/${service.runtime.healthState}/${service.runtime.ownershipState}`);
    if (service.runtime.reason) lines.push(`     ${service.runtime.reason}`);
  });
  if (report.mongo) lines.push(`  MongoDB :${report.mongo.port} · ${report.mongo.listeners.length ? 'LISTENING' : 'NOT LISTENING'} · brew ${report.mongo.brew.ok ? 'available' : 'reported an issue'}`);
  lines.push('  Run tarot report --copy to create a redacted agent-ready report.');
  return lines.join('\n');
}

export function renderSupportMarkdown(report, unsafeFull = false) {
  const safe = unsafeFull ? report : redactValue(report, { projectRoot: report.project.root });
  const serviceLines = safe.services.map((service) => `| ${service.scrySlot} | ${service.label} | ${service.port} | ${service.runtime.processState} | ${service.runtime.healthState} | ${service.runtime.ownershipState} | ${service.runtime.reason || ''} |`).join('\n');
  const incidents = safe.incidents.length ? safe.incidents.map((incident) => `- ${incident.at || incident.capturedAt || ''} ${incident.serviceId || 'tarot'}: ${incident.message || incident.reason || incident.type}`).join('\n') : '- No incidents recorded.';
  const observations = safe.services.map((service) => `- ${service.label}: ${service.listeners.length ? 'listener present' : 'no listener'}; ${service.runtime.processState}/${service.runtime.healthState}/${service.runtime.ownershipState}.`).join('\n');
  const likelyCauses = safe.services.filter((service) => service.runtime.healthState === 'unhealthy' || (service.runtime.processState === 'running' && !service.listeners.length)).map((service) => `- ${service.label}: ${service.runtime.reason || 'Runtime evidence and readiness disagree; inspect current-run logs.'}`).join('\n') || '- No likely cause is asserted from the current evidence.';
  return `# Tarot Support Report\n\nSchema: ${safe.schemaVersion}\n\nGenerated: ${safe.generatedAt}\n\n## Project\n\n- Name: ${safe.project.name}\n- Root: ${safe.project.root}\n- Tarot: ${safe.project.tarotVersion}\n- Stable release: ${safe.project.releaseVersion}\n- Payload checksums: ${safe.project.checksumStatus?.ok ? 'verified' : 'mismatch or unavailable'}\n- Profile: ${safe.project.profile}\n- Manifest: ${safe.summary.validManifest ? 'valid' : 'invalid'}\n\n## Observations\n\n${observations}\n\n## Likely causes\n\n${likelyCauses}\n\n## Manifest findings\n\n${[...safe.summary.errors.map((item) => `- ERROR: ${item}`), ...safe.summary.warnings.map((item) => `- WARNING: ${item}`)].join('\n') || '- No manifest findings.'}\n\n## Services\n\n| Slot | Service | Port | Process | Health | Ownership | Reason |\n|---:|---|---:|---|---|---|---|\n${serviceLines}\n\n## Agent and runtime\n\n\`\`\`json\n${JSON.stringify(safe.agent, null, 2)}\n\`\`\`\n\n## MongoDB / platform service\n\n\`\`\`json\n${JSON.stringify(safe.mongo, null, 2)}\n\`\`\`\n\n## Registry\n\n\`\`\`json\n${JSON.stringify(safe.registry, null, 2)}\n\`\`\`\n\n## Recent incidents\n\n${incidents}\n\n## Safe next steps\n\n1. Run \`tarot explain <service>\` for the first unhealthy or blocked service.\n2. Run \`awaken --scry\` to capture a fresh startup if the stack is stopped.\n3. Send this redacted report to an agent for analysis.\n`;
}
