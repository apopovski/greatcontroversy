type AnalyticsPayload = Record<string, any>;

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    plausible?: (eventName: string, options?: Record<string, any>) => void;
  }
}

const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
const PLAUSIBLE_DOMAIN = (import.meta.env.VITE_PLAUSIBLE_DOMAIN || '').trim();
const PLAUSIBLE_SCRIPT_SRC = (import.meta.env.VITE_PLAUSIBLE_SCRIPT_SRC || 'https://plausible.io/js/script.js').trim();
const CONSENT_KEY = 'gc_analytics_consent';

let initialized = false;
let lastTrackedPath = '';

type ConsentStatus = 'granted' | 'denied' | 'unknown';
type AnalyticsProvider = 'plausible' | 'ga4' | 'none';

function getAnalyticsProvider(): AnalyticsProvider {
  // Prefer privacy-first provider when configured.
  if (PLAUSIBLE_DOMAIN) return 'plausible';
  if (GA_MEASUREMENT_ID) return 'ga4';
  return 'none';
}

function ensureDataLayerAndGtag() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  };
}

export function initAnalytics() {
  try {
    if (initialized) return;
    initialized = true;

    if (typeof window === 'undefined') return;
    const provider = getAnalyticsProvider();
    if (provider === 'none') return;
    if (getAnalyticsConsentStatus() !== 'granted') return;

    if (provider === 'plausible') {
      const existing = document.querySelector(`script[src*="${PLAUSIBLE_SCRIPT_SRC}"]`);
      if (!existing) {
        const s = document.createElement('script');
        s.defer = true;
        s.src = PLAUSIBLE_SCRIPT_SRC;
        s.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
        document.head.appendChild(s);
      }
      return;
    }

    if (!GA_MEASUREMENT_ID) return;

    ensureDataLayerAndGtag();

    // Load GA4 library only once.
    const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`);
    if (!existing) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
      document.head.appendChild(s);
    }

    window.gtag!('js', new Date());
    window.gtag!('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      anonymize_ip: true,
    });
  } catch {
    // ignore analytics init errors
  }
}

export function getAnalyticsConsentStatus(): ConsentStatus {
  try {
    if (typeof window === 'undefined') return 'unknown';
    const provider = getAnalyticsProvider();
    const raw = window.localStorage.getItem(CONSENT_KEY);

    // For Plausible (privacy-first), default to granted unless explicitly denied.
    if (provider === 'plausible') {
      if (raw === 'denied') return 'denied';
      return 'granted';
    }

    if (provider === 'none') return 'denied';

    if (raw === 'granted' || raw === 'denied') return raw;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function setAnalyticsConsent(granted: boolean) {
  try {
    if (typeof window === 'undefined') return;
    const next: ConsentStatus = granted ? 'granted' : 'denied';
    window.localStorage.setItem(CONSENT_KEY, next);
    if (!granted) return;
    // reset initialization flag if user accepts later in session
    initialized = false;
    initAnalytics();
    // Send a first page_view immediately after opt-in.
    trackPageView();
  } catch {
    // ignore consent write errors
  }
}

export function trackPageView(path?: string, title?: string) {
  try {
    if (typeof window === 'undefined') return;
    if (getAnalyticsConsentStatus() !== 'granted') return;

    const provider = getAnalyticsProvider();
    if (provider === 'none') return;

    const normalizedPath =
      path ||
      `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const pageTitle = title || document.title || 'The Great Controversy';

    // Prevent duplicate spam for same logical route.
    if (normalizedPath === lastTrackedPath) return;
    lastTrackedPath = normalizedPath;

    const fullLocation = `${window.location.origin}${normalizedPath}`;

    if (provider === 'plausible' && typeof window.plausible === 'function') {
      window.plausible('pageview', {
        u: fullLocation,
      });
      return;
    }

    ensureDataLayerAndGtag();

    if (GA_MEASUREMENT_ID) {
      window.gtag!('event', 'page_view', {
        page_title: pageTitle,
        page_path: normalizedPath,
        page_location: fullLocation,
        language: document.documentElement.lang || navigator.language || 'en',
      });
    } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'page_view',
        page_title: pageTitle,
        page_path: normalizedPath,
      });
    }
  } catch {
    // ignore page_view tracking errors
  }
}

export function trackEvent(name: string, payload?: AnalyticsPayload) {
  try {
    if (!name) return;
    if (getAnalyticsConsentStatus() !== 'granted') return;
    const provider = getAnalyticsProvider();
    if (provider === 'none') return;
    const safePayload = payload || {};

    if (typeof window !== 'undefined') {
      if (provider === 'plausible' && typeof window.plausible === 'function') {
        window.plausible(name, { props: safePayload });
        return;
      }

      ensureDataLayerAndGtag();

      if (GA_MEASUREMENT_ID) {
        window.gtag!('event', name, safePayload);
      } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: name, ...safePayload });
      }
    }
  } catch {
    // ignore event tracking errors
  }
}
