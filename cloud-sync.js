/* Cloudflare D1 sync for All Money. Shared state lives in D1; localStorage is a page cache. */
(() => {
  const KEYS = [
    'allmoney_imports',
    'allmoney_budgets',
    'allmoney_investments_v1',
    'allmoney_investment_fx',
    'allmoney_investment_target_v1'
  ];
  if (location.pathname.endsWith('login.html')) return;

  function notice(message, error = false) {
    let el = document.getElementById('cloudSyncNotice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cloudSyncNotice';
      el.style.cssText = 'margin:10px 0;padding:10px 13px;border-radius:10px;font:13px system-ui;overflow-wrap:anywhere;position:relative;z-index:10;';
      (document.querySelector('main') || document.querySelector('.wrap') || document.body).prepend(el);
    }
    el.textContent = message;
    el.style.background = error ? '#fff0f1' : '#e8f8f3';
    el.style.color = error ? '#a63242' : '#14765e';
  }

  const stable = value => JSON.stringify(value, (key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.keys(item).sort().reduce((out, name) => (out[name] = item[name], out), {})
      : item
  );

  function snapshot() {
    const state = {};
    for (const key of KEYS) {
      const raw = localStorage.getItem(key);
      if (raw === null) state[key] = null;
      else {
        try { state[key] = JSON.parse(raw); }
        catch { state[key] = raw; }
      }
    }
    return state;
  }

  function apply(state) {
    for (const key of KEYS) {
      if (!Object.prototype.hasOwnProperty.call(state || {}, key)) continue;
      if (state[key] === null) localStorage.removeItem(key);
      else localStorage.setItem(key, typeof state[key] === 'string' ? state[key] : JSON.stringify(state[key]));
    }
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (response.status === 401) {
      location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
      throw new Error('Your session expired. Please sign in again.');
    }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  let ready = false;
  let busy = false;
  let pushTimer = null;
  let pollTimer = null;
  let lastSnapshot = null;
  let lastCloudState = null;

  function schedulePush() {
    if (!ready) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 500);
  }

  const originalSet = localStorage.setItem.bind(localStorage);
  const originalRemove = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    originalSet(key, value);
    if (KEYS.includes(String(key))) schedulePush();
  };
  localStorage.removeItem = function (key) {
    originalRemove(key);
    if (KEYS.includes(String(key))) schedulePush();
  };

  async function push() {
    if (!ready || busy) return;
    const local = snapshot();
    if (stable(local) === stable(lastSnapshot)) return;
    busy = true;
    try {
      await request('/api/sync', {
        method: 'PUT',
        body: JSON.stringify({ state: local })
      });
      lastSnapshot = local;
      lastCloudState = local;
      notice('Cloud sync saved. Other devices can now receive these records.');
    } catch (error) {
      notice('Cloud sync error: ' + error.message, true);
    } finally {
      busy = false;
      if (stable(snapshot()) !== stable(lastSnapshot)) schedulePush();
    }
  }

  async function poll() {
    if (!ready || busy) return;
    try {
      const result = await request('/api/sync');
      if (!result.state) return;
      const local = snapshot();
      const localChanged = stable(local) !== stable(lastSnapshot);
      const cloudChanged = stable(result.state) !== stable(lastCloudState);

      // If D1 has changed since the last poll, pull it even if this page has
      // stale local changes. Otherwise a newly opened device can overwrite
      // newer cloud records with its old browser cache.
      if (cloudChanged) {
        busy = true;
        try {
          apply(result.state);
          lastSnapshot = snapshot();
          lastCloudState = result.state;
          notice('New records received from cloud. Refreshing this page…');
          clearInterval(pollTimer);
          location.reload();
          return;
        } finally {
          busy = false;
        }
      }

      if (localChanged) schedulePush();
      else lastCloudState = result.state;
    } catch (error) {
      if (!String(error.message).includes('session expired')) {
        notice('Cloud sync check failed: ' + error.message, true);
      }
    }
  }

  async function start() {
    notice('Connecting to Cloudflare sync…');
    const result = await request('/api/sync');

    if (result.state) {
      // Inline page scripts may read browser storage before this deferred script.
      apply(result.state);
      lastSnapshot = snapshot();
      lastCloudState = result.state;
      const marker = 'cf_sync_reload:' + location.pathname;
      if (sessionStorage.getItem(marker) !== '1') {
        sessionStorage.setItem(marker, '1');
        location.reload();
        return;
      }
      sessionStorage.removeItem(marker);
    } else {
      // No cloud row exists yet: seed D1 with this device's existing data.
      lastSnapshot = null;
      lastCloudState = null;
    }

    ready = true;
    if (!result.state) await push();
    notice('Cloud sync connected. Changes save automatically.');
    pollTimer = setInterval(poll, 2000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) poll();
    });
    window.addEventListener('focus', poll);
    window.addEventListener('online', poll);
  }

  start().catch(error => notice('Cloud sync unavailable: ' + error.message, true));
})();
