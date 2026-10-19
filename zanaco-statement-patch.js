
(function () {
  'use strict';
  const PROFILE = {"provider": "Zanaco", "account": "Zanaco", "defaultCategory": "Imported", "defaultDescription": "Zanaco bank transaction"};
  const MONTHS = {JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'};
  const DATE = /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/ ](?:[A-Za-z]{3}|\d{1,2})[-/ ]\d{2,4})\b/;
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function iso(v) {
    const s=String(v??'').trim();
    let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if(m)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    m=s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3}|\d{1,2})[-/ ](\d{2,4})$/);
    if(m){const mm=/^\d+$/.test(m[2])?m[2].padStart(2,'0'):MONTHS[m[2].toUpperCase()];if(mm)return `${m[3].length===2?'20'+m[3]:m[3]}-${mm}-${m[1].padStart(2,'0')}`;}
    return '';
  }
  function val(v) {
    const s=String(v??'').replace(/,/g,'').replace(/\s/g,'').replace(/[^\d().+-]/g,'');
    if(!s)return 0;
    const n=Number(s.replace(/[()]/g,''));
    return Number.isFinite(n)?Math.abs(n):0;
  }
  function get(row,terms) {
    const keys=Object.keys(row||{});
    for(const term of terms){const k=keys.find(key=>key.toLowerCase().replace(/[_-]/g,' ').includes(term));if(k&&row[k]!==''&&row[k]!=null)return row[k];}
    return '';
  }
  function classify(desc, debit, credit, rawType, amount) {
    const d=String(desc||'').toLowerCase(), t=String(rawType||'').toLowerCase();
    if(/reversal|reversed|refund|cashback/.test(d+' '+t)) return 'Income';
    if(/transfer between|own account|account transfer|wallet transfer|transfer to own/.test(d+' '+t)) return 'Transfer';
    if(credit>0)return 'Income';
    if(debit>0)return 'Expense';
    if(/receive|received|deposit|cash.?in|money in|incoming|salary|credit/.test(d+' '+t))return 'Income';
    if(/send|sent|withdraw|cash.?out|payment|purchase|bill|fee|charge|airtime|bundle|merchant|debit/.test(d+' '+t))return 'Expense';
    return amount<0?'Expense':'Expense';
  }
  function normalize(rows) {
    const output=[];
    for(const r of rows||[]){
      const desc=String(get(r,['description','transaction details','details','narration','particulars','transaction','remarks','recipient','sender','counterparty','merchant','reference','memo'])||'').trim();
      const date=iso(get(r,['transaction date','date','trn date','created at','timestamp','datetime','time']));
      const debit=val(get(r,['debit','withdrawal','money out','paid out','sent amount']));
      const credit=val(get(r,['credit','deposit','money in','paid in','received amount']));
      const rawAmount=get(r,['transaction amount','amount','value','paid','received']);
      const amount=debit||credit||val(rawAmount);
      const rawType=get(r,['transaction type','type','direction','status']);
      if(!desc||!amount)continue;
      output.push({
        id: (typeof uid==='function'?uid():Math.random().toString(36).slice(2)+Date.now().toString(36)),
        date:date||((typeof today==='function')?today():new Date().toISOString().slice(0,10)),
        description:desc,
        category:String(get(r,['category'])||PROFILE.defaultCategory),
        type:classify(desc,debit,credit,rawType,amount),
        amount,
        currency:String(get(r,['currency','ccy'])||'ZMW').toUpperCase(),
        account:String(get(r,['account','wallet','source','provider'])||PROFILE.account),
        reconciled:false,
        importProvider:PROFILE.provider,
        reference:String(get(r,['reference','transaction id','transaction reference','receipt number','txn id','financial id'])||'')
      });
    }
    return output;
  }
  function pdfNumber(items,minX,maxX) {
    const raw=items.filter(i=>i.x>=minX&&i.x<maxX).map(i=>i.text).join('').replace(/,/g,'').replace(/[^\d.()-]/g,'');
    const n=Number(raw.replace(/[()]/g,''));
    return Number.isFinite(n)?Math.abs(n):0;
  }
  async function parsePdf(file) {
    if(!window.pdfjsLib)throw new Error('PDF reader did not load. Refresh and try again.');
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
    const output=[];
    for(let p=1;p<=pdf.numPages;p++){
      const page=await pdf.getPage(p), content=await page.getTextContent();
      const items=content.items.filter(i=>i.str&&i.str.trim()).map(i=>({text:i.str.trim(),x:i.transform[4],y:i.transform[5]}));
      const lines=[];
      for(const it of items){let l=lines.find(x=>Math.abs(x.y-it.y)<2.5);if(!l){l={y:it.y,items:[]};lines.push(l)}l.items.push(it)}
      lines.sort((a,b)=>b.y-a.y);lines.forEach(l=>l.items.sort((a,b)=>a.x-b.x));
      let columns=null, current=null;
      const finish=()=>{if(current && (current.amount>0 || current.debit>0 || current.credit>0)){
        const debit=current.debit||0, credit=current.credit||0, amount=debit||credit||current.amount||0;
        if(amount>0)output.push({date:current.date,description:current.description||PROFILE.defaultDescription,debit,credit,amount,currency:'ZMW',account:PROFILE.account,reference:current.reference||'',type:current.type||''});
      }current=null};
      for(const line of lines){
        const its=line.items, joined=its.map(i=>i.text).join(' ').toLowerCase();
        if(/date/.test(joined) && /(amount|debit|credit|balance|description|details|transaction)/.test(joined)){
          const findX=pattern=>{const it=its.find(i=>pattern.test(i.text.toLowerCase()));return it?it.x:null};
          const xDate=findX(/date|time/), xDebit=findX(/debit|withdrawal|paid out|money out/), xCredit=findX(/credit|deposit|paid in|money in/), xAmount=findX(/amount|value/), xDesc=findX(/description|details|narration|particular|transaction/), xRef=findX(/reference|receipt|txn id|transaction id/), xBalance=findX(/balance/);
          columns={xDate,xDebit,xCredit,xAmount,xDesc,xRef,xBalance};
          continue;
        }
        const dateItem=its.find(i=>DATE.test(i.text)&&iso(i.text));
        if(dateItem){
          finish();
          const descItems=its.filter(i=>i.x>dateItem.x+5 && (columns?.xDesc==null || i.x>=columns.xDesc-8) && (columns?.xDebit==null || i.x<columns.xDebit-3));
          const desc=descItems.map(i=>i.text).join(' ').trim();
          let debit=0,credit=0,amount=0,reference='';
          if(columns?.xDebit!=null)debit=pdfNumber(its,columns.xDebit-2,(columns.xCredit??columns.xAmount??columns.xBalance??99999)-2);
          if(columns?.xCredit!=null)credit=pdfNumber(its,columns.xCredit-2,(columns.xBalance??99999)-2);
          if(columns?.xAmount!=null)amount=pdfNumber(its,columns.xAmount-2,(columns.xBalance??99999)-2);
          if(!debit&&!credit&&!amount){
            const nums=its.filter(i=>/^\(?-?[\d,]+\.\d{2}\)?$/.test(i.text));
            if(nums.length){amount=val(nums[nums.length-1].text);}
          }
          if(columns?.xRef!=null)reference=its.filter(i=>i.x>=columns.xRef-2).map(i=>i.text).join(' ');
          current={date:iso(dateItem.text),description:desc,debit,credit,amount,reference};
          continue;
        }
        if(current){
          const continuation=its.filter(i=>i.x>=(columns?.xDesc??80) && (columns?.xDebit==null || i.x<columns.xDebit-3)).map(i=>i.text).join(' ').trim();
          if(continuation && !/^(page \d+|date|transaction details|description|balance)$/i.test(continuation))current.description+=' '+continuation;
        }
      }
      finish();
    }
    if(!output.length)throw new Error('No transactions extracted from this PDF. This provider format may need a sample-specific layout adjustment or OCR if scanned.');
    return output;
  }
  async function parse(file) {
    const ext=file.name.split('.').pop().toLowerCase();
    if(ext==='pdf')return parsePdf(file);
    if(typeof parseFile!=='function')throw new Error('The app statement reader is unavailable. Ensure this patch is loaded after script.js.');
    return parseFile(file);
  }
  document.addEventListener('change',async function(e){
    if(!e.target||e.target.id!=='statementFile')return;
    const file=e.target.files&&e.target.files[0];if(!file)return;
    if(!/\.(pdf|csv|xls|xlsx)$/i.test(file.name))return;
    e.stopImmediatePropagation();
    const status=document.querySelector('#fileStatus'),preview=document.querySelector('#importPreview');
    if(!status||!preview)return;
    preview.innerHTML='';
    if(file.size>10*1024*1024){status.textContent='File exceeds 10MB. Choose a smaller file.';e.target.value='';return;}
    status.textContent=`Reading ${PROFILE.provider} statement…`;
    try{
      const raw=await parse(file);
      importRows=normalize(raw);
      const dup=importRows.filter(x=>(db.transactions||[]).some(t=>t.date===x.date&&String(t.description).toLowerCase()===x.description.toLowerCase()&&Number(t.amount)===Number(x.amount)));
      status.textContent=`${PROFILE.provider}: found ${importRows.length} transaction rows; ${dup.length} possible duplicate(s). Review before importing.`;
      preview.innerHTML=`<div class="alert-note"><strong>${esc(PROFILE.provider)} preview — first 8 rows</strong><div style="overflow:auto"><table><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Reference</th></tr></thead><tbody>${importRows.slice(0,8).map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.description)}</td><td>${esc(x.type)}</td><td>${esc(x.amount.toFixed(2))} ${esc(x.currency)}</td><td>${esc(x.reference)}</td></tr>`).join('')}</tbody></table></div><button class="primary-button" id="confirmImport" style="margin-top:8px">Import ${importRows.length} rows</button> <button class="secondary" id="cancelImport" style="margin-top:8px">Cancel</button></div>`;
      if(!importRows.length)status.textContent='No transaction rows were found. Check the file headers/layout; nothing has been imported.';
    }catch(err){status.textContent='Could not parse this file: '+err.message;console.error(PROFILE.provider+' import error',err);}
  },true);
})();
