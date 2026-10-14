/* Cloudflare D1 sync for All Money. No Supabase dependency. */
(() => {
  const KEYS = [
    'allmoney_imports', 'allmoney_budgets', 'allmoney_investments_v1',
    'allmoney_investment_fx', 'allmoney_investment_target_v1'
  ];
  const path = location.pathname;
  if (path.endsWith('/login.html') || path.endsWith('login.html')) return;

  function notice(message, error = false) {
    let el = document.getElementById('cloudSyncNotice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cloudSyncNotice';
      el.style.cssText = 'margin:10px 0;padding:10px 13px;border-radius:10px;font:13px system-ui;overflow-wrap:anywhere;position:relative;z-index:10;';
      (document.querySelector('main') || document.body).prepend(el);
    }
    el.textContent = message;
    el.style.background = error ? '#fff0f1' : '#e8f8f3';
    el.style.color = error ? '#a63242' : '#14765e';
  }
  const stable = x => JSON.stringify(x, (k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((o, key) => (o[key] = v[key], o), {}) : v);
  function snapshot() {
    const s = {};
    for (const key of KEYS) {
      const raw = localStorage.getItem(key);
      if (raw === null) s[key] = null;
      else { try { s[key] = JSON.parse(raw); } catch { s[key] = raw; } }
    }
    return s;
  }
  function apply(s) {
    for (const key of KEYS) {
      if (!Object.prototype.hasOwnProperty.call(s || {}, key)) continue;
      if (s[key] === null) localStorage.removeItem(key);
      else localStorage.setItem(key, typeof s[key] === 'string' ? s[key] : JSON.stringify(s[key]));
    }
  }
  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin', cache: 'no-store',
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (response.status === 401) {
      location.replace('login.html');
      throw new Error('Your session expired. Please sign in again.');
    }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  let ready = false, busy = false, timer = null, lastCloudStamp = null, lastSnapshot = null;
  const originalSet = localStorage.setItem.bind(localStorage);
  const originalRemove = localStorage.removeItem.bind(localStorage);
  function schedule() {
    if (!ready || busy) return;
    clearTimeout(timer);
    timer = setTimeout(push, 700);
  }
  localStorage.setItem = function (key, value) {
    originalSet(key, value);
    if (KEYS.includes(String(key))) schedule();
  };
  localStorage.removeItem = function (key) {
    originalRemove(key);
    if (KEYS.includes(String(key))) schedule();
  };

  async function push() {
    if (!ready || busy) return;
    const current = snapshot();
    if (stable(current) === stable(lastSnapshot)) return;
    busy = true;
    try {
      const result = await request('/api/sync', {
        method: 'PUT', body: JSON.stringify({ state: current })
      });
      lastSnapshot = current;
      lastCloudStamp = result.updatedAt || lastCloudStamp;
      notice('Cloud sync saved to Cloudflare. Checking for updates from your other devices.');
    } catch (e) {
      notice('Cloud sync error: ' + e.message + '. Export a backup before continuing.', true);
    } finally { busy = false; }
  }

  async function poll() {
    if (!ready || busy) return;
    try {
      const result = await request('/api/sync');
      if (!result.state) return;
      const current = snapshot();
      if (result.updatedAt && result.updatedAt !== lastCloudStamp &&
          stable(current) !== stable(result.state)) {
        busy = true;
        apply(result.state);
        lastSnapshot = snapshot();
        lastCloudStamp = result.updatedAt;
        notice('Updated from your other device. Refreshing this page.');
        location.reload();
        return;
      }
      lastCloudStamp = result.updatedAt || lastCloudStamp;
      lastSnapshot = current;
    } catch (e) {
      if (!String(e.message).includes('session expired')) notice('Cloud sync check failed: ' + e.message, true);
    }
  }

  async function start() {
    notice('Connecting to Cloudflare sync…');
    const result = await request('/api/sync');
    if (result.state) {
      // Existing cloud state is authoritative. Back up browser data before the first sync.
      apply(result.state);
      lastCloudStamp = result.updatedAt || null;
      lastSnapshot = snapshot();
      notice('Connected to Cloudflare. Cloud records loaded.');
      // Reload once so page variables initialize from the loaded cloud state.
      const marker = 'cf_sync_reload:' + location.pathname;
      if (sessionStorage.getItem(marker) !== '1') {
        sessionStorage.setItem(marker, '1');
        location.reload();
        return;
      }
      sessionStorage.removeItem(marker);
    } else {
      // First signed-in browser seeds the cloud. This is not a merge.
      lastSnapshot = null;
    }
    ready = true;
    if (!result.state) await push();
    notice('Cloudflare sync connected. Changes are saved automatically.');
    setInterval(poll, 5000);
  }
  start().catch(e => {
    notice('Cloudflare sync unavailable: ' + e.message + '. Confirm D1 setup and sign in.', true);
  });
})();
