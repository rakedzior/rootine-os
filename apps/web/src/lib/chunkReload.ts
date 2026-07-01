const CHUNK_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'Loading chunk',
];

function isChunkLoadError(reason: unknown) {
  const message = reason instanceof Error ? reason.message : String(reason ?? '');
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

async function clearRuntimeCaches() {
  if (!('caches' in window)) return;
  const names = await window.caches.keys();
  await Promise.all(names.map((name) => window.caches.delete(name)));
}

export function installChunkReloadHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();

    const key = 'rootine:chunk-reload-attempted';
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');

    void clearRuntimeCaches().finally(() => {
      window.location.reload();
    });
  });

  window.addEventListener('load', () => {
    sessionStorage.removeItem('rootine:chunk-reload-attempted');
  });
}
