import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const catalogPath = fileURLToPath(new URL('../../fixtures/catalog.json', import.meta.url));
const tasksPath = fileURLToPath(new URL('../../fixtures/tasks.json', import.meta.url));

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/(api.?key|secret|password|authorization|access.?token)/i.test(key))
    .map(([key, entry]) => [key, redact(entry)]));
}

export function createManifest({ mode, modelId, seed, versions = {}, providerConfig = {} } = {}) {
  return redact({
    createdAt: new Date().toISOString(),
    mode,
    modelId,
    seed,
    node: process.version,
    platform: `${os.platform()}-${os.arch()}`,
    fixtureChecksums: {
      catalog: sha256(catalogPath),
      tasks: sha256(tasksPath),
    },
    versions,
    providerConfig,
  });
}
