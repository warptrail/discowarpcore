import { randomUUID } from 'node:crypto';

export function createRuntimeService(service, prior = {}) {
  const monitor = Boolean(service.monitorOnly);
  return {
    ...service,
    process: null,
    logs: [],
    error: '',
    runId: '',
    processState: 'absent',
    healthState: 'unknown',
    ownershipState: monitor ? 'system' : 'unknown',
    stateReason: 'Agent has not observed this service yet.',
    lastTransitionAt: null,
    lastProbeAt: null,
    nextProbeAt: 0,
    probe: null,
    verified: false,
    intentionalStop: false,
    restartAttempts: 0,
    startupDeadlineAt: null,
    exitCode: null,
    exitSignal: null,
    ...prior,
    ...service,
    process: null,
    logs: [],
  };
}

export function newRunId(serviceId = 'service') {
  return `${serviceId}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export function displayState(service) {
  if (service.processState === 'stopping') return 'stopping';
  if (service.processState === 'starting' || service.healthState === 'checking') return 'starting';
  if (service.healthState === 'healthy') return service.ownershipState === 'tarot' ? 'live' : 'observed';
  if (service.processState === 'running' && service.healthState === 'unhealthy') return 'unhealthy';
  if (service.processState === 'exited' && !service.intentionalStop) return 'error';
  if (service.healthState === 'unhealthy') return 'error';
  if (service.processState === 'running') return 'observed';
  return service.state === 'bypassed' ? 'bypassed' : 'quiet';
}

export function transitionService(service, changes, reason = '') {
  const before = `${service.processState}/${service.healthState}/${service.ownershipState}`;
  Object.assign(service, changes);
  const after = `${service.processState}/${service.healthState}/${service.ownershipState}`;
  if (reason) service.stateReason = reason;
  if (before !== after || reason) service.lastTransitionAt = new Date().toISOString();
  service.state = displayState(service);
  service.verified = ['tarot', 'verified-project'].includes(service.ownershipState);
  return service;
}

export function publicServiceState(service, index = 0) {
  const {
    process,
    env,
    command,
    args,
    startCommand,
    ...rest
  } = service;
  return {
    ...rest,
    state: displayState(service),
    scrySlot: index + 1,
    owned: service.ownershipState === 'tarot' && Boolean(process),
    pid: process?.pid || service.pid || null,
    envKeys: Object.keys(env || {}),
  };
}
