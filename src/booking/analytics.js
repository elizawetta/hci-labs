import { analyticsConfig } from './analytics-config.js';

const storageKey = 'booking-analytics-session';
const eventNames = new Set(['interface_opened', 'search_started', 'results_viewed', 'filters_applied', 'room_viewed', 'beds_confirmed', 'booking_started', 'form_error', 'booking_completed']);
const debug = new URLSearchParams(location.search).get('debug') === '1';
let session;
try {
  session = JSON.parse(sessionStorage.getItem(storageKey));
} catch {
  session = null;
}
function freshSession() {
  return { id: crypto.randomUUID(), updatedAt: Date.now(), firstSearchAt: null, events: [] };
}
if (!session || !Array.isArray(session.events) || Date.now() - session.updatedAt >= analyticsConfig.sessionTimeoutMs) session = freshSession();

function renderDebug() {
  const output = document.querySelector('#analytics-events');
  if (output) output.textContent = session.events.map(record => `${record.event}\n${JSON.stringify(record.params)}`).join('\n\n');
}

export function initAnalytics() {
  if (debug) {
    const details = document.createElement('details');
    details.id = 'analytics-debug';
    details.className = 'shell analytics-debug';
    const summary = document.createElement('summary');
    summary.textContent = 'Проверка событий';
    const pre = document.createElement('pre');
    pre.id = 'analytics-events';
    details.append(summary, pre);
    document.body.append(details);
    renderDebug();
  }
  const counter = analyticsConfig.metrikaCounterId;
  if (!Number.isSafeInteger(counter) || counter <= 0) return;
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(script);
  window.ym(counter, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
}

export function track(event, params = {}, once = false) {
  if (!eventNames.has(event)) throw new Error('Unknown analytics event');
  const now = Date.now();
  if (now - session.updatedAt >= analyticsConfig.sessionTimeoutMs) session = freshSession();
  if (once && session.events.some(record => record.event === event)) return;
  if (event === 'search_started' && session.firstSearchAt === null) session.firstSearchAt = now;
  const payload = { ...params };
  if (event === 'booking_completed' && session.firstSearchAt !== null) payload.duration_seconds = Math.round((now - session.firstSearchAt) / 1000);
  const record = { event, time: new Date(now).toISOString(), params: payload };
  session.events.push(record);
  session.updatedAt = now;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(session));
  } catch {
    session.updatedAt = now;
  }
  renderDebug();
  if (analyticsConfig.metrikaCounterId > 0 && typeof window.ym === 'function') window.ym(analyticsConfig.metrikaCounterId, 'reachGoal', event, payload);
}
