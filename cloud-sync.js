/* Cloudflare D1 sync for All Money. */
(() => {
  const KEYS = ['allmoney_imports','allmoney_budgets','allmoney_investments_v1','allmoney_investment_fx','allmoney_investment_target_v1'];
  if (location.pathname.endsWith('login.html')) return;
  function notice(message, error=false) {
    let el=document.getElementById('cloudSyncNotice');
    if(!el){el=document.createElement('div');el.id='cloudSyncNotice';el.style.cssText='margin:10px 0;padding:10px 13px;border-radius:10px;font:13px system-ui;overflow-wrap:anywhere;position:relative;z-index:10;';(document.querySelector('main')||document.body).prepend(el);}
    el.textContent=message;el.style.background=error?'#fff0f1':'#e8f8f3';el.style.color=error?'#a63242':'#14765e';
  }
  const stable=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((o,key)=>(o[key]=v[key],o),{}):v);
  function snapshot(){const s={};for(const k of KEYS){const raw=localStorage.getItem(k);if(raw===null)s[k]=null;else{try{s[k]=JSON.parse(raw)}catch{s[k]=raw}}}return s;}
  function apply(s){for(const k of KEYS){if(!Object.prototype.hasOwnProperty.call(s||{},k))continue;if(s[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,typeof s[k]==='string'?s[k]:JSON.stringify(s[k]));}}
  async function request(url,options={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json',...(options.headers||{})},...options});let d={};try{d=await r.json()}catch{}if(r.status===401){location.replace('/login.html');throw Error('Your session expired. Please sign in again.')}if(!r.ok)throw Error(d.error||`Request failed (${r.status})`);return d;}
  let ready=false,busy=false,timer=null,lastCloudStamp=null,lastSnapshot=null;
  const originalSet=localStorage.setItem.bind(localStorage),originalRemove=localStorage.removeItem.bind(localStorage);
  function schedule(){if(!ready)return;clearTimeout(timer);timer=setTimeout(()=>push(),700);}
  localStorage.setItem=function(k,v){originalSet(k,v);if(KEYS.includes(String(k)))schedule()};
  localStorage.removeItem=function(k){originalRemove(k);if(KEYS.includes(String(k)))schedule()};
  async function push(){if(!ready||busy)return;const current=snapshot();if(stable(current)===stable(lastSnapshot))return;busy=true;try{const result=await request('/api/sync',{method:'PUT',body:JSON.stringify({state:current})});lastSnapshot=current;lastCloudStamp=result.updatedAt||lastCloudStamp;notice('Cloud sync saved. Checking for updates from your other devices.');}catch(e){notice('Cloud sync error: '+e.message,true)}finally{busy=false;if(stable(snapshot())!==stable(lastSnapshot))schedule();}}
  async function poll(){if(!ready||busy)return;try{const result=await request('/api/sync');if(!result.state)return;const current=snapshot();if(result.updatedAt&&result.updatedAt!==lastCloudStamp&&stable(current)!==stable(result.state)){busy=true;apply(result.state);lastSnapshot=snapshot();lastCloudStamp=result.updatedAt;sessionStorage.removeItem('cf_sync_reload:'+location.pathname);location.reload();return;}lastCloudStamp=result.updatedAt||lastCloudStamp;if(stable(current)!==stable(lastSnapshot))schedule();}catch(e){if(!String(e.message).includes('session expired'))notice('Cloud sync check failed: '+e.message,true)}}
  async function start(){notice('Connecting to Cloudflare sync…');const result=await request('/api/sync');if(result.state){apply(result.state);lastCloudStamp=result.updatedAt||null;lastSnapshot=snapshot();const marker='cf_sync_reload:'+location.pathname;if(sessionStorage.getItem(marker)!=='1'){sessionStorage.setItem(marker,'1');location.reload();return;}sessionStorage.removeItem(marker);}else lastSnapshot=null;ready=true;if(!result.state)await push();notice('Cloud sync connected. Changes save automatically.');setInterval(poll,3000);}
  start().catch(e=>notice('Cloud sync unavailable: '+e.message,true));
})();
