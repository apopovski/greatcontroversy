export function trackEvent(name: string, payload?: Record<string, any>) {
  try {
    // Lightweight analytics hook: console + dataLayer if present
    console.info('[analytics]', name, payload || {});
    if (typeof window !== 'undefined' && (window as any).dataLayer && Array.isArray((window as any).dataLayer)) {
      (window as any).dataLayer.push({ event: name, ...payload });
    }
  } catch (e) {
    // ignore
  }
}
