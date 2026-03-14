export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      const notifyUpdate = () => {
        window.dispatchEvent(new CustomEvent('swUpdateAvailable', { detail: reg }));
      };

      // Already waiting on page load (e.g. hard refresh after new deploy)
      if (reg.waiting) {
        notifyUpdate();
        return;
      }

      // Listen for a new SW being found and installed
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate();
          }
        });
      });

      // When SKIP_WAITING fires and new SW takes control, reload
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
