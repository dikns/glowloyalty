export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');

      // When new SW activates and takes control, reload to get fresh assets
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) {
          reloading = true;
          window.location.reload();
        }
      });
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });
}
