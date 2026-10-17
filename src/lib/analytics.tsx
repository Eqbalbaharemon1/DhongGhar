import { useEffect } from 'react';
import type { Settings } from './types';

// Injects GTM, Facebook Pixel, and Google Analytics scripts based on settings.
// All three are no-ops if their IDs are empty.
function loadGtm(containerId: string) {
  if (!containerId) return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...a: unknown[]) => void;
  push?: (...a: unknown[]) => void;
  loaded?: boolean;
};

function loadFbq(pixelId: string) {
  if (!pixelId) return;
  const w = window as unknown as {
    fbq?: FbqFn;
    _fbq?: unknown;
    dataLayer?: unknown[];
  };
  if (w.fbq) return;

  const fbq = function (this: unknown, ...args: unknown[]) {
    const f = fbqInternal;
    if (f.callMethod) {
      f.callMethod(...args);
    } else if (w.dataLayer) {
      w.dataLayer.push(args);
    }
  } as FbqFn;

  const fbqInternal = fbq;
  w.fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  w._fbq = w._fbq || fbq;
  fbq('init', pixelId);
  fbq('track', 'PageView');
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(s);
}

function loadGtag(measurementId: string) {
  if (!measurementId) return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function (...args: unknown[]) {
    (w.dataLayer as unknown[]).push(args);
  };
  w.gtag('js', new Date());
  w.gtag('config', measurementId);
}

export function AnalyticsScripts({ settings }: { settings: Settings }) {
  useEffect(() => {
    if (settings.gtm_container_id) loadGtm(settings.gtm_container_id);
    if (settings.facebook_pixel_id) loadFbq(settings.facebook_pixel_id);
    if (settings.google_analytics_id) loadGtag(settings.google_analytics_id);
  }, [settings.gtm_container_id, settings.facebook_pixel_id, settings.google_analytics_id]);

  // GTM noscript body iframe
  if (settings.gtm_container_id) {
    const iframe = `https://www.googletagmanager.com/ns.html?id=${settings.gtm_container_id}`;
    return (
      <noscript>
        <iframe src={iframe} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
      </noscript>
    );
  }
  return null;
}
