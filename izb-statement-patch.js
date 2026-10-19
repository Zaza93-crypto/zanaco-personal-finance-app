/* IZB statement-import patch for All Money / Zanaco Personal Finance App.
   Add this script AFTER script.js on tracker.html.
   Handles text-based IZB PDFs using PDF.js text coordinates (debit/credit columns),
   plus date normalization and safer duplicate review. */
(function () {
  'use strict';
  const dateRe = /^\d{2}-[A-Z]{3}-\d{4}$/i;
  const monthMap = {JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'};
  const toISO = value => {
    const s = String(value || '').trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
    if (m && monthMap[m[2].toUpperCase()]) return `${m[3]}-${monthMap[m[2].toUpperCase()]}-${m[1].padStart(2,'0')}`;
    m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (m) return `${m[3].length===2?'20'+m[3]:m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return '';
  };
  async function readIzbPdf(file) {
    if (!window.pdfjsLib) throw new Error('PDF reader could not load. Refresh the page and try again.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({data: await file.arrayBuffer()}).promise;
    const rows = [];
    for (let pno = 1; pno <= pdf.numPages; pno++) {
      const page = await pdf.getPage(pno);
      const content = await page.getTextContent();
      const items = content.items.filter(i => i.str && i.str.trim()).map(i => ({
        text: i.str.trim(), x: i.transform[4], y: i.transform[5]
      }));
      const lines = [];
      for (const item of items) {
        let line = lines.find(l => Math.abs(l.y - item.y) < 2.2);
        if (!line) { line = {y:item.y, items:[]}; lines.push(line); }
        line.items.push(item);
      }
      lines.sort((a,b) => b.y-a.y);
      lines.forEach(line => line.items.sort((a,b) => a.x-b.x));
      let current = null;
      const finish = () => {
        if (current && (current.debit > 0 || current.credit > 0)) {
          const desc = current.description.trim();
          rows.push({
            date: current.date, description: desc || 'Bank transaction',
            debit: current.debit ? current.debit.toFixed(2) : '',
            credit: current.credit ? current.credit.toFixed(2) : '',
            balance: current.balance ? current.balance.toFixed(2) : '',
            currency: 'ZMW', account: 'IZB'
          });
        }
        current = null;
      };
      for (const line of lines) {
        const its = line.items;
        const dateItem = its.find(i => i.x < 100 && dateRe.test(i.text));
        if (dateItem) {
          finish();
          const getNum = (min,max) => {
            const raw = its.filter(i => i.x >= min && i.x < max).map(i=>i.text).join('')
              .replace(/,/g,'').replace(/[^\d.()-]/g,'');
            const n = Number(raw.replace(/[()]/g,''));
            return Number.isFinite(n) ? n : 0;
          };
          current = {
            date: toISO(dateItem.text),
            description: its.filter(i=>i.x>=155 && i.x<420).map(i=>i.text).join(' '),
            debit: getNum(420,500), credit: getNum(500,575), balance: getNum(575,700)
          };
          continue;
        }
        if (current) {
          const extra = its.filter(i=>i.x>=155 && i.x<420).map(i=>i.text).join(' ').trim();
          if (extra && !/transaction details|instrument|debit|credit|balance/i.test(extra)) current.description += ' ' + extra;
        }
      }
      finish();
    }
    if (!rows.length) throw new Error('No transactions were extracted. This patch supports text-based IZB PDFs; scanned PDFs need OCR.');
    return rows;
  }

  // Override the existing normalizer so statement dates, debit/credit columns and
  // internal account transfers are handled correctly.
  window.normalizeRows = function(rows) {
    return rows.map(r => {
      const get = names => {
        const keys = Object.keys(r);
        for (const term of names) {
          const k = keys.find(key => key.toLowerCase().includes(term));
          if (k && r[k] !== '' && r[k] != null) return r[k];
        }
        return '';
      };
      const description = String(get(['description','details','narration','transaction','particular','reference','merchant','payee','memo']) || 'Imported transaction').trim();
      const debit = Math.abs(Number(String(get(['debit','withdrawal'])).replace(/[, ]/g,'')) || 0);
      const credit = Math.abs(Number(String(get(['credit','deposit'])).replace(/[, ]/g,'')) || 0);
      const generic = Math.abs(Number(String(get(['amount','value'])).replace(/[, ]/g,'').replace(/[^\d.-]/g,'')) || 0);
      const amount = debit || credit || generic;
      const date = toISO(get(['date','transaction date','trn date'])) || toISO(get(['value date'])) || new Date().toISOString().slice(0,10);
      const d = description.toLowerCase();
      const type = (d.includes('account transfer') || d.includes('inttrf')) ? 'Transfer' : credit ? 'Income' : 'Expense';
      return {id: Math.random().toString(36).slice(2)+Date.now().toString(36), date, description,
        category: String(get(['category']) || 'Imported').trim(), type, amount,
        currency: String(get(['currency']) || 'ZMW').toUpperCase(),
        account: String(get(['account']) || 'IZB'), reconciled:false};
    }).filter(x => x.amount > 0 && x.description);
  };

  // Capture the file change before the existing generic PDF handler. This lets
  // the existing preview/confirm-import flow continue to work.
  document.addEventListener('change', async function(e) {
    if (!e.target || e.target.id !== 'statementFile') return;
    const file = e.target.files && e.target.files[0];
    if (!file || !/\.pdf$/i.test(file.name)) return;
    e.stopImmediatePropagation();
    const status = document.querySelector('#fileStatus');
    const preview = document.querySelector('#importPreview');
    if (!status || !preview) return;
    preview.innerHTML = '';
    status.textContent = 'Reading IZB statement and extracting transaction columns…';
    try {
      const rows = await readIzbPdf(file);
      window.importRows = window.normalizeRows(rows);
      // Existing script.js keeps importRows in a top-level lexical binding.
      try { importRows = window.normalizeRows(rows); } catch (_) {}
      const staged = window.importRows || [];
      const duplicates = staged.filter(x => db.transactions.some(t =>
        t.date === x.date && String(t.description).toLowerCase() === x.description.toLowerCase() && Number(t.amount) === Number(x.amount)
      )).length;
      status.textContent = `Extracted ${staged.length} transactions from ${pdfPageCountLabel(rows)}; ${duplicates} possible duplicate(s). Review before importing.`;
      preview.innerHTML = `<div class="alert-note"><strong>Preview (first 8 rows)</strong><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody>${staged.slice(0,8).map(x=>`<tr><td>${escapeHtml(x.date)}</td><td>${escapeHtml(x.description)}</td><td>${escapeHtml(x.type)}</td><td>${escapeHtml(String(x.amount.toFixed(2)))} ZMW</td></tr>`).join('')}</tbody></table></div><button class="primary-button" id="confirmImport" style="margin-top:8px">Import ${staged.length} rows</button> <button class="secondary" id="cancelImport" style="margin-top:8px">Cancel</button></div>`;
    } catch (err) {
      status.textContent = 'Could not parse this PDF: ' + err.message;
      console.error(err);
    }
  }, true);

  function pdfPageCountLabel(rows) { return 'statement'; }
  function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Keep import confirmation compatible with the original local transaction store.
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'confirmImport' || e.target.id === 'cancelImport')) e.stopImmediatePropagation();
    if (e.target && e.target.id === 'confirmImport') {
      const staged = window.importRows || [];
      const fresh = staged.filter(x => !db.transactions.some(t =>
        t.date === x.date && String(t.description).toLowerCase() === x.description.toLowerCase() && Number(t.amount) === Number(x.amount)
      ));
      if (fresh.length < staged.length && !confirm(`${staged.length-fresh.length} likely duplicate rows will be skipped. Continue?`)) return;
      db.transactions.push(...fresh);
      save();
      window.importRows = [];
      try { importRows = []; } catch (_) {}
      document.querySelector('#statementFile').value = '';
      document.querySelector('#fileStatus').textContent = `Imported ${fresh.length} transaction(s).`;
      document.querySelector('#importPreview').innerHTML = '';
    }
    if (e.target && e.target.id === 'cancelImport') {
      window.importRows = [];
      try { importRows = []; } catch (_) {}
      document.querySelector('#importPreview').innerHTML = '';
      document.querySelector('#fileStatus').textContent = 'Import cancelled.';
    }
  }, true);
})();
