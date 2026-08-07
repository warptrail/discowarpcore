import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const HEALTH_TYPES = new Set(['http', 'tcp']);
const LAN_ADAPTERS = new Set(['', 'env', 'vite', 'vinext', 'next', 'react-scripts', 'uvicorn', 'static']);

export function healthContract(service) {
  const configured = service.health && typeof service.health === 'object' ? service.health : {};
  const hasLegacyPath = typeof service.healthPath === 'string' && service.healthPath.trim() !== '';
  const type = configured.type || (hasLegacyPath ? 'http' : 'tcp');
  const path = String(configured.path || service.healthPath || '/');
  const configuredStatuses = configured.acceptedStatusCodes || configured.successStatuses;
  const statuses = Array.isArray(configuredStatuses) && configuredStatuses.length
    ? configuredStatuses.map(Number).filter(Number.isInteger)
    : null;
  return {
    type,
    path: path.startsWith('/') ? path : `/${path}`,
    timeoutMs: positiveNumber(configured.timeoutMs, 1500),
    startupTimeoutMs: positiveNumber(configured.startupTimeoutMs || service.startupTimeoutMs, 60000),
    intervalMs: Math.max(5000, positiveNumber(configured.intervalMs, 15000)),
    acceptedStatusCodes: statuses,
  };
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function pathInside(root, candidate) {
  const target = resolve(root, candidate || '.');
  return target === root || target.startsWith(`${root}/`);
}

export function validateManifest(manifest, root, profileName = 'development') {
  const errors = [];
  const warnings = [];
  const profile = manifest?.profiles?.[profileName];
  const services = profile?.services;
  if (!manifest || typeof manifest !== 'object') return { valid: false, errors: ['Manifest is not an object.'], warnings, services: [] };
  if (!manifest.projectId) errors.push('projectId is required.');
  if (!profile || !Array.isArray(services)) errors.push(`profiles.${profileName}.services must be an array.`);
  const list = Array.isArray(services) ? services : [];
  const ids = new Set();
  const ports = new Map();
  for (const [index, service] of list.entries()) {
    const label = service.label || service.id || `service ${index + 1}`;
    if (!service.id) errors.push(`${label} needs an id.`);
    else if (ids.has(service.id)) errors.push(`Duplicate service id: ${service.id}.`);
    else ids.add(service.id);
    const port = Number(service.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push(`${label} needs a valid port.`);
    else if (ports.has(port)) errors.push(`${label} and ${ports.get(port)} both declare port ${port}.`);
    else ports.set(port, label);
    if (!service.monitorOnly && !service.command) errors.push(`${label} needs a structured command.`);
    if (!service.cwdEnv && !pathInside(root, service.cwd || '.')) errors.push(`${label} working directory escapes the project root.`);
    if (!service.cwdEnv && !existsSync(resolve(root, service.cwd || '.'))) errors.push(`${label} working directory does not exist: ${service.cwd || '.'}.`);
    const health = healthContract(service);
    if (!HEALTH_TYPES.has(health.type)) errors.push(`${label} has unsupported health type ${health.type}.`);
    if (!LAN_ADAPTERS.has(service.lan?.adapter || '')) errors.push(`${label} has unsupported LAN adapter ${service.lan.adapter}.`);
    for (const key of Object.keys(service.env || {})) {
      if (/(token|secret|password|api[-_]?key|private[-_]?key)/i.test(key)) warnings.push(`${label} stores sensitive-looking environment key ${key} in the manifest; prefer a project environment file.`);
    }
  }
  for (const service of list) {
    for (const dependency of service.dependsOn || []) if (!ids.has(dependency)) errors.push(`${service.label || service.id} depends on missing service ${dependency}.`);
  }
  const visiting = new Set();
  const visited = new Set();
  const byId = new Map(list.map((service) => [service.id, service]));
  const visit = (id) => {
    if (visiting.has(id)) { errors.push(`Dependency cycle includes ${id}.`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn || []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);
  if (manifest.primaryService && !ids.has(manifest.primaryService)) errors.push(`primaryService ${manifest.primaryService} is not declared in ${profileName}.`);
  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)], services: list };
}
