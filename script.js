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
  $('#budgetForm')?.addEventListener('submit', e => {e.preventDefault();const d=new FormData(e.currentTarget);const card=document.createElement('div');card.className='budget-item';card.innerHTML=`<div><span></span><small></small></div><div class="progress"><i style="width:0%;background:#7651f5"></i></div><small class="percent">0%</small>`;card.querySelector('span').textContent=d.get('category');card.querySelector('small').textContent=`0 / ${Number(d.get('amount')).toLocaleString()}`;card.querySelector('.entry-actions')?.remove();const actions=document.createElement('div');actions.className='entry-actions';actions.innerHTML='<button type="button" class="entry-edit">Edit</button><button type="button" class="entry-delete">Delete</button>';card.append(actions);$('.budget-grid>.panel').append(card);const total=$('#totalBudget');const old=Number(total.textContent.replace(/[^\d.]/g,''));total.textContent='ZMW '+(old+Number(d.get('amount'))).toLocaleString();e.currentTarget.reset();dialogs.budget.close();});

  // Edit/delete controls for budget categories and investment holdings.
  document.addEventListener('click', event => {
    const edit = event.target.closest('.entry-edit');
    const del = event.target.closest('.entry-delete');
    if (!edit && !del) return;

    const budgetRow = event.target.closest('.budget-item');
    const investmentRow = event.target.closest('#holdingsTable tbody tr');

    if (budgetRow) {
      const nameNode = budgetRow.querySelector('span');
      const amountNode = budgetRow.querySelector('div:first-child small');
      const currentName = nameNode?.textContent.trim() || '';
      const amountText = amountNode?.textContent || '';
      const amountMatch = amountText.match(/\/\s*([\d,.]+)/);
      const currentLimit = amountMatch ? amountMatch[1].replace(/,/g, '') : '';
      if (del) {
        if (confirm(`Delete the budget for "${currentName}"?`)) budgetRow.remove();
        return;
      }
      const newName = prompt('Edit budget category:', currentName);
      if (newName === null) return;
      const cleanName = newName.trim();
      if (!cleanName) { alert('Category name cannot be empty.'); return; }
      const newLimitRaw = prompt('Edit monthly budget limit (ZMW):', currentLimit);
      if (newLimitRaw === null) return;
      const newLimit = Number(newLimitRaw);
      if (!Number.isFinite(newLimit) || newLimit <= 0) { alert('Enter a valid budget amount greater than zero.'); return; }
      nameNode.textContent = cleanName;
      if (amountNode) amountNode.textContent = `${amountText.split('/')[0].trim()} / ${newLimit.toLocaleString()}`;
      const spent = Number((amountText.split('/')[0] || '').replace(/[^\d.]/g, ''));
      const percent = Math.min(100, Math.round(spent / newLimit * 100));
      const bar = budgetRow.querySelector('.progress i');
      if (bar) bar.style.width = `${percent}%`;
      const percentNode = budgetRow.querySelector('.percent');
      if (percentNode) percentNode.textContent = `${percent}%`;
      return;
    }

    if (investmentRow) {
      if (del) {
        const assetName = investmentRow.cells[0].textContent.trim();
        if (confirm(`Delete investment "${assetName}"?`)) {
          investmentRow.remove();
          const count = $('#assetCount');
          if (count) count.textContent = Math.max(0, Number(count.textContent) - 1);
        }
        return;
      }
      const cells = investmentRow.cells;
      const asset = prompt('Edit asset name:', cells[0].textContent.trim());
      if (asset === null) return;
      const type = prompt('Edit asset type (Stock, Bond, Crypto, Money Market, Other):', cells[1].textContent.trim());
      if (type === null) return;
      const units = prompt('Edit units / shares:', cells[2].textContent.replace(/,/g, ''));
      if (units === null) return;
      const buy = prompt('Edit buy price:', cells[3].textContent.replace(/,/g, ''));
      if (buy === null) return;
      const current = prompt('Edit current price:', cells[4].textContent.replace(/,/g, ''));
      if (current === null) return;
      const nUnits = Number(units), nBuy = Number(buy), nCurrent = Number(current);
      if (!asset.trim() || ![nUnits,nBuy,nCurrent].every(Number.isFinite) || nUnits <= 0 || nBuy <= 0 || nCurrent <= 0) {
        alert('Please enter a name and valid positive numbers for units and prices.');
        return;
      }
      const value = nUnits * nCurrent, gain = (nCurrent - nBuy) / nBuy * 100;
      cells[0].textContent = asset.trim();
      cells[1].textContent = '';
      const tag = document.createElement('span');
      tag.className = `tag ${type.trim().toLowerCase()==='crypto'?'orange':'teal'}`;
      tag.textContent = type.trim() || 'Other';
      cells[1].append(tag);
      cells[2].textContent = nUnits.toLocaleString();
      cells[3].textContent = nBuy.toLocaleString();
      cells[4].textContent = nCurrent.toLocaleString();
      cells[5].textContent = value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
      cells[6].textContent = `${gain>=0?'+':''}${gain.toFixed(1)}%`;
      cells[6].className = `amount ${gain>=0?'up':'down'}`;
    }
  });

  let month=9;const label=$('#monthLabel');function renderMonth(){if(label)label.textContent=new Date(2026,month,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});}
  $('#prevMonth')?.addEventListener('click',()=>{month=(month+11)%12;renderMonth()});$('#nextMonth')?.addEventListener('click',()=>{month=(month+1)%12;renderMonth()});
});