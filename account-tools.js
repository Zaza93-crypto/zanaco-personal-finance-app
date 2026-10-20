(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const safe = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const PREF_KEY = "allmoney_preferences_v1";
  const defaults = { currency: "ZMW", compactTables: false, reduceMotion: false };
  const readPrefs = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") }; } catch { return { ...defaults }; } };
  const writePrefs = p => { localStorage.setItem(PREF_KEY, JSON.stringify(p)); applyPrefs(p); };
  function applyPrefs(p) {
    document.documentElement.dataset.compact = p.compactTables ? "true" : "false";
    document.documentElement.dataset.reduceMotion = p.reduceMotion ? "true" : "false";
    let style = $("#accountPrefsStyle");
    if (!style) { style = document.createElement("style"); style.id = "accountPrefsStyle"; document.head.append(style); }
    style.textContent = `
      html[data-compact="true"] table th,html[data-compact="true"] table td{padding-top:6px!important;padding-bottom:6px!important}
      html[data-reduce-motion="true"] *,html[data-reduce-motion="true"] *::before,html[data-reduce-motion="true"] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
    `;
  }
  applyPrefs(readPrefs());

  const dialog = document.createElement("dialog");
  dialog.id = "accountToolsDialog";
  dialog.innerHTML = `
    <form id="accountToolsForm" method="dialog">
      <div class="panel-title"><h2 id="accountToolsTitle">Profile</h2><button type="button" class="close" id="accountToolsClose" aria-label="Close">×</button></div>
      <div class="account-tabs"><button type="button" data-tab="profile" class="active">Profile</button><button type="button" data-tab="settings">Settings</button><button type="button" data-tab="password">Security</button></div>
      <p class="account-status" id="accountToolsStatus" role="status"></p>
      <section data-pane="profile">
        <p class="account-help">Update the name and email address associated with your account.</p>
        <label>Display name<input name="name" autocomplete="name" required minlength="2" maxlength="80"></label>
        <label>Email address<input name="email" type="email" autocomplete="email" required maxlength="254"></label>
        <div class="dialog-actions"><button type="button" class="primary-button" id="saveProfile">Save profile</button></div>
      </section>
      <section data-pane="settings" hidden>
        <p class="account-help">These preferences affect how this browser displays your dashboard.</p>
        <label>Default currency for new entries<select name="currency"><option value="ZMW">ZMW — Zambian Kwacha</option><option value="USD">USD — US Dollar</option></select></label>
        <label class="account-check"><input type="checkbox" name="compactTables"> Compact tables (show more records)</label>
        <label class="account-check"><input type="checkbox" name="reduceMotion"> Reduce interface animations</label>
        <div class="dialog-actions"><button type="button" class="primary-button" id="savePrefs">Save settings</button><button type="button" class="secondary" id="resetPrefs">Reset defaults</button></div>
      </section>
      <section data-pane="password" hidden>
        <p class="account-help">Use at least 10 characters. Your current password is required to change it.</p>
        <label>Current password<input name="currentPassword" type="password" autocomplete="current-password"></label>
        <label>New password<input name="newPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128"></label>
        <label>Confirm new password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128"></label>
        <div class="dialog-actions"><button type="button" class="primary-button" id="changePassword">Update password</button></div>
      </section>
    </form>`;
  document.body.append(dialog);
  const style = document.createElement("style");
  style.textContent = `
    #accountToolsDialog{background:var(--panel,#171719);color:var(--text,#f6f4f8);border:1px solid var(--line,#343238);border-radius:20px;width:min(520px,calc(100% - 24px));max-height:90vh;overflow:auto;padding:22px;box-shadow:0 24px 80px #0008}
    #accountToolsDialog::backdrop{background:#0009;backdrop-filter:blur(4px)}
    #accountToolsDialog label{display:grid;gap:7px;margin:14px 0;color:var(--text,#f6f4f8);font-size:13px}
    #accountToolsDialog input:not([type=checkbox]),#accountToolsDialog select{width:100%;padding:12px;border-radius:10px;background:var(--panel2,#222225);color:var(--text,#f6f4f8);border:1px solid var(--line,#343238)}
    #accountToolsDialog .account-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:16px 0}
    #accountToolsDialog .account-tabs button{border:1px solid var(--line,#343238);border-radius:10px;padding:9px 13px;background:transparent;color:var(--text,#f6f4f8);cursor:pointer}
    #accountToolsDialog .account-tabs button.active{background:var(--accent,#c8b8ff);color:#17131f;border-color:transparent}
    #accountToolsDialog .account-help{color:var(--muted,#aaa7b2);line-height:1.5}
    #accountToolsDialog .account-check{display:flex;align-items:center;gap:10px}
    #accountToolsDialog .account-check input{width:17px;height:17px}
    #accountToolsDialog .account-status{min-height:18px;font-size:13px;line-height:1.4}
    #accountToolsDialog .account-status.error{color:#ff9aab}
    #accountToolsDialog .account-status.success{color:#c9f2a8}
    #accountToolsDialog [hidden]{display:none!important}
    @media(max-width:500px){#accountToolsDialog{padding:16px}#accountToolsDialog .dialog-actions{flex-wrap:wrap}}
  `;
  document.head.append(style);

  let profile = { name: "", email: "" };
  let activeTab = "profile";
  function status(message, kind = "") {
    const el = $("#accountToolsStatus");
    el.textContent = message;
    el.className = "account-status " + kind;
  }
  function tab(name) {
    activeTab = name;
    $("#accountToolsTitle").textContent = name === "password" ? "Security" : name === "settings" ? "Settings" : "Profile";
    dialog.querySelectorAll("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== name);
    dialog.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    status("");
    if (name === "settings") {
      const p = readPrefs(), f = $("#accountToolsForm");
      f.elements.currency.value = p.currency;
      f.elements.compactTables.checked = !!p.compactTables;
      f.elements.reduceMotion.checked = !!p.reduceMotion;
    }
  }
  async function api(url, options = {}) {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) } });
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 401) {
      location.href = "/login.html?next=" + encodeURIComponent(location.pathname + location.search);
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }
  async function loadProfile() {
    status("Loading account details…");
    try {
      const data = await api("/api/account");
      profile = data.profile || profile;
      const f = $("#accountToolsForm");
      f.elements.name.value = profile.name || "";
      f.elements.email.value = profile.email || "";
      status("");
    } catch (e) { status(e.message, "error"); }
  }
  function open(which) {
    tab(which);
    if (which === "profile") loadProfile();
    if (!dialog.open) dialog.showModal();
  }
  document.addEventListener("click", e => {
    const profileLink = e.target.closest("[data-profile]");
    const settingsLink = e.target.closest("[data-settings]");
    if (profileLink || settingsLink) {
      e.preventDefault();
      open(settingsLink ? "settings" : "profile");
    }
  });
  dialog.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.tab === "profile") loadProfile();
    tab(b.dataset.tab);
  }));
  $("#accountToolsClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
  $("#saveProfile").addEventListener("click", async () => {
    const f = $("#accountToolsForm"), name = f.elements.name.value.trim(), email = f.elements.email.value.trim();
    if (!f.elements.name.reportValidity() || !f.elements.email.reportValidity()) return;
    const b = $("#saveProfile"); b.disabled = true; status("Saving profile…");
    try {
      const data = await api("/api/account", { method: "PATCH", body: JSON.stringify({ name, email }) });
      profile = data.profile;
      document.querySelectorAll(".welcome").forEach(el => el.textContent = "Welcome, " + profile.name.split(/\s+/)[0]);
      document.querySelectorAll(".avatar").forEach(el => el.textContent = profile.name.split(/\s+/).map(x => x[0]).join("").slice(0,2).toUpperCase());
      status("Profile saved successfully.", "success");
    } catch (e) { status(e.message, "error"); }
    finally { b.disabled = false; }
  });
  $("#savePrefs").addEventListener("click", () => {
    const f = $("#accountToolsForm");
    const prefs = { currency: f.elements.currency.value,
      compactTables: f.elements.compactTables.checked, reduceMotion: f.elements.reduceMotion.checked };
    writePrefs(prefs);
    // Set the currency on newly opened transaction/investment forms. Existing
    // records are never converted or modified by this preference.
    document.querySelectorAll('#transactionForm select[name="currency"],#investmentForm select[name="currency"]').forEach(el => { el.value = prefs.currency; });
    status("Settings saved on this browser.", "success");
  });
  $("#resetPrefs").addEventListener("click", () => {
    writePrefs({ ...defaults }); tab("settings"); status("Default settings restored.", "success");
  });
  $("#changePassword").addEventListener("click", async () => {
    const f = $("#accountToolsForm"), currentPassword = f.elements.currentPassword.value,
      newPassword = f.elements.newPassword.value, confirmPassword = f.elements.confirmPassword.value;
    if (!currentPassword) return status("Enter your current password.", "error");
    if (newPassword.length < 10) return status("Use at least 10 characters for your new password.", "error");
    if (newPassword !== confirmPassword) return status("The new passwords do not match.", "error");
    const b = $("#changePassword"); b.disabled = true; status("Updating password…");
    try {
      const data = await api("/api/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      f.elements.currentPassword.value = ""; f.elements.newPassword.value = ""; f.elements.confirmPassword.value = "";
      status(data.message || "Password updated successfully.", "success");
    } catch (e) { status(e.message, "error"); }
    finally { b.disabled = false; }
  });
})();
