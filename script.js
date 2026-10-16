const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
document.addEventListener('DOMContentLoaded', () => {
  const dialogs = {transaction: $('#transactionDialog'), budget: $('#budgetDialog'), investment: $('#investmentDialog')};
  $$('[data-open]').forEach(btn => btn.addEventListener('click', () => dialogs[btn.dataset.open]?.showModal()));
  $('#logout')?.addEventListener('click', e => { e.preventDefault(); alert('You are using the demo interface. Connect your authentication service to enable logout.'); });
  const file = $('#statementFile');
  file?.addEventListener('change', () => {
    const chosen = file.files[0]; const status = $('#fileStatus');
    if (!chosen) return;
    if (chosen.size > 10*1024*1024) { status.textContent = 'File exceeds 10MB. Choose a smaller file.'; file.value=''; return; }
    status.textContent = `${chosen.name} selected. File preview is ready, but automatic bank-statement parsing needs to be connected to a backend.`;
  });
  $('#applyFilters')?.addEventListener('click', () => {
    const category = $('#categoryFilter').value, type = $('#typeFilter').value;
    let count = 0;
    $$('#transactionTable tbody tr').forEach(row => {
      const match = (!category || row.cells[2].textContent.trim() === category) && (!type || row.cells[3].textContent.trim() === type);
      row.hidden = !match; if(match) count++;
    });
    $('#transactionCount').textContent = `${count} transaction${count===1?'':'s'}`;
  });
  $('#transactionForm')?.addEventListener('submit', e => {
    e.preventDefault(); const form=e.currentTarget, data=new FormData(form);
    const amount=Number(data.get('amount')); const type=data.get('type'); const date=new Date(`${data.get('date')}T12:00:00`);
    const dateText=date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const tr=document.createElement('tr');
    const values=[dateText,data.get('description'),data.get('category'),type,`${type==='Income'?'+':'-'}${amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`,'—','⋮'];
    values.forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;if(i===2){td.innerHTML='';const tag=document.createElement('span');tag.className='tag teal';tag.textContent=v;td.append(tag)}if(i===3){td.innerHTML='';const tag=document.createElement('span');tag.className=`tag ${type==='Income'?'green-tag':'pink'}`;tag.textContent=v;td.append(tag)}if(i===4)td.className=`amount ${type==='Income'?'up':'down'}`;tr.append(td)});
    $('#transactionTable tbody').prepend(tr); $('#transactionCount').textContent=`${$('#transactionTable tbody').children.length} transactions`; form.reset(); dialogs.transaction.close();
  });
  $('#investmentForm')?.addEventListener('submit', e => {
    e.preventDefault();const f=e.currentTarget,d=new FormData(f);const units=Number(d.get('units')),buy=Number(d.get('buy')),cur=Number(d.get('current')),value=units*cur,pct=((cur-buy)/buy*100);
    const tr=document.createElement('tr');const vals=[d.get('asset'),d.get('type'),units.toLocaleString(),buy.toLocaleString(),cur.toLocaleString(),value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),`${pct>=0?'+':''}${pct.toFixed(1)}%`,'⋮'];
    vals.forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;if(i===1){const tag=document.createElement('span');tag.className='tag '+(v==='Crypto'?'orange':'teal');tag.textContent=v;td.textContent='';td.append(tag)}if(i===6)td.className=`amount ${pct>=0?'up':'down'}`;tr.append(td)});$('#holdingsTable tbody').prepend(tr);$('#assetCount').textContent=Number($('#assetCount').textContent)+1;f.reset();dialogs.investment.close();
  });
  $('#budgetForm')?.addEventListener('submit', e => {e.preventDefault();const d=new FormData(e.currentTarget);const card=document.createElement('div');card.className='budget-item';card.innerHTML=`<div><span></span><small></small></div><div class="progress"><i style="width:0%;background:#7651f5"></i></div><small class="percent">0%</small>`;card.querySelector('span').textContent=d.get('category');card.querySelector('small').textContent=`0 / ${Number(d.get('amount')).toLocaleString()}`;$('.budget-grid>.panel').append(card);const total=$('#totalBudget');const old=Number(total.textContent.replace(/[^\d.]/g,''));total.textContent='ZMW '+(old+Number(d.get('amount'))).toLocaleString();e.currentTarget.reset();dialogs.budget.close();});
  let month=9;const label=$('#monthLabel');function renderMonth(){if(label)label.textContent=new Date(2026,month,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});}
  $('#prevMonth')?.addEventListener('click',()=>{month=(month+11)%12;renderMonth()});$('#nextMonth')?.addEventListener('click',()=>{month=(month+1)%12;renderMonth()});
});