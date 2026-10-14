(() => {
  "use strict";
  const API = "https://open.er-api.com/v6/latest/USD";
  const REFRESH_MS = 15 * 60 * 1000;
  const fmt = (n, digits = 2) => Number.isFinite(n)
    ? n.toLocaleString("en-ZM", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—";

  function buildTracker() {
    if (document.getElementById("usdCurrencyTracker")) return;
    const section = document.createElement("section");
    section.id = "usdCurrencyTracker";
    section.className = "usd-tracker";
    section.innerHTML = `
      <div class="usd-tracker-head">
        <div>
          <div class="usd-tracker-eyebrow">CURRENCY WATCH</div>
          <h2>US Dollar tracker</h2>
          <p>Automatic USD/ZMW reference-rate checks every 15 minutes while this page is open.</p>
        </div>
        <button type="button" class="usd-refresh" id="usdRefresh">↻ Refresh rate</button>
      </div>
      <div class="usd-rate-grid">
        <article class="usd-rate-main">
          <div class="usd-pair">🇺🇸 USD <span>→</span> 🇿🇲 ZMW</div>
          <div class="usd-rate" id="usdRate">Loading…</div>
          <div class="usd-rate-caption" id="usdRateCaption">Fetching latest available reference rate</div>
          <div class="usd-rate-foot" id="usdUpdated">Rates are indicative, not a bank quote.</div>
        </article>
        <article class="usd-converter">
          <label for="usdAmount">Convert US dollars to kwacha</label>
          <div class="usd-input-row"><span>$</span><input id="usdAmount" type="number" min="0" step="0.01" value="100" inputmode="decimal"></div>
          <div class="usd-convert-result" id="usdConvertResult">—</div>
          <div class="usd-convert-caption" id="usdConvertCaption">ZMW equivalent</div>
          <div class="usd-reverse-label">Kwacha to US dollars</div>
          <div class="usd-input-row"><span>K</span><input id="zmwAmount" type="number" min="0" step="0.01" value="1000" inputmode="decimal"></div>
          <div class="usd-convert-result secondary" id="zmwConvertResult">—</div>
        </article>
      </div>
      <div class="usd-tracker-note" id="usdTrackerNote">Rates may differ from bank, bureau de change and mobile-money provider rates.</div>
    `;
    const hero = document.querySelector(".overview-hero");
    const nav = document.querySelector(".page-nav");
    if (hero && hero.parentNode) hero.insertAdjacentElement("afterend", section);
    else if (nav && nav.parentNode) nav.insertAdjacentElement("afterend", section);
    else document.querySelector("main,.wrap,body").prepend(section);

    const rateEl = section.querySelector("#usdRate");
    const updatedEl = section.querySelector("#usdUpdated");
    const usdAmount = section.querySelector("#usdAmount");
    const zmwAmount = section.querySelector("#zmwAmount");
    let rate = null;
    let lastSuccessfulFetch = null;
    let isLoading = false;

    function updateConversions() {
      if (!Number.isFinite(rate)) return;
      const usd = Math.max(0, Number(usdAmount.value) || 0);
      const zmw = Math.max(0, Number(zmwAmount.value) || 0);
      section.querySelector("#usdConvertResult").textContent = `K ${fmt(usd * rate)}`;
      section.querySelector("#usdConvertCaption").textContent = `${fmt(usd)} USD at K ${fmt(rate, 4)} per USD`;
      section.querySelector("#zmwConvertResult").textContent = `$ ${fmt(zmw / rate)}`;
    }

    async function loadRate({ automatic = false } = {}) {
      if (isLoading) return;
      isLoading = true;
      const button = section.querySelector("#usdRefresh");
      button.disabled = true;
      button.textContent = automatic ? "Updating…" : "Refreshing…";
      section.querySelector("#usdRateCaption").textContent = "Checking the latest available provider rate…";
      try {
        const response = await fetch(API, { cache: "no-store" });
        if (!response.ok) throw new Error("Rate service unavailable");
        const data = await response.json();
        const value = Number(data?.rates?.ZMW);
        if (data.result !== "success" || !Number.isFinite(value) || value <= 0) {
          throw new Error("USD/ZMW rate was not returned");
        }
        rate = value;
        lastSuccessfulFetch = new Date();
        rateEl.textContent = `K ${fmt(rate, 4)}`;
        section.querySelector("#usdRateCaption").textContent = "Zambian Kwacha for 1 US Dollar";
        const providerDate = data.time_last_update_utc ? new Date(data.time_last_update_utc) : null;
        updatedEl.textContent = `Provider rate updated: ${providerDate && !Number.isNaN(providerDate.getTime()) ? providerDate.toLocaleString() : "time unavailable"} · Checked here: ${lastSuccessfulFetch.toLocaleTimeString()}`;
        section.querySelector("#usdTrackerNote").textContent =
          "Auto-checks every 15 minutes while this page is open. The provider may update rates less often. This is a reference rate, not a guaranteed buy/sell quote.";
      } catch (_) {
        section.querySelector("#usdRateCaption").textContent = "Unable to fetch a fresh reference rate.";
        updatedEl.textContent = lastSuccessfulFetch
          ? `Showing last successful rate, checked ${lastSuccessfulFetch.toLocaleString()}. Tap Refresh rate to retry.`
          : "No rate loaded yet. Check your connection and tap Refresh rate.";
        section.querySelector("#usdTrackerNote").textContent =
          "The rate service may be temporarily unavailable. Do not rely on a stale rate for an actual transaction.";
      } finally {
        updateConversions();
        isLoading = false;
        button.disabled = false;
        button.textContent = "↻ Refresh rate";
      }
    }

    section.querySelector("#usdRefresh").addEventListener("click", () => loadRate());
    usdAmount.addEventListener("input", updateConversions);
    zmwAmount.addEventListener("input", updateConversions);
    loadRate();
    window.setInterval(() => {
      if (!document.hidden) loadRate({ automatic: true });
    }, REFRESH_MS);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && lastSuccessfulFetch &&
          Date.now() - lastSuccessfulFetch.getTime() >= REFRESH_MS) {
        loadRate({ automatic: true });
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildTracker, { once: true });
  else buildTracker();
})();
