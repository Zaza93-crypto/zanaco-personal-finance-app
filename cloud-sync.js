/* All Money shared cloud state. Requires supabase-config.js and Supabase SQL setup. */
(()=>{
 const cfg=window.ALLMONEY_SUPABASE_CONFIG||{};
 const keys=['allmoney_imports','allmoney_budgets','allmoney_investments_v1','allmoney_investment_fx','allmoney_investment_target_v1'];
 const ready=cfg.url&&cfg.anonKey&&!cfg.url.includes('YOUR_PROJECT')&&!cfg.anonKey.includes('YOUR_SUPABASE')&&window.supabase;
 function notice(msg){let n=document.getElementById('cloudSyncNotice');if(!n){n=document.createElement('div');n.id='cloudSyncNotice';n.style.cssText='position:relative;margin:10px 0;padding:10px 13px;border-radius:10px;background:#fff3d8;color:#795c1c;font:13px system-ui;z-index:100';(document.querySelector('main')||document.body).prepend(n)}n.textContent=msg}
 if(!ready){notice('Cloud sync not configured yet. This browser is still using local storage. Follow README-Cloud-Sync.txt to connect Supabase.');return}
 const client=window.supabase.createClient(cfg.url,cfg.anonKey);
 const snapshot=()=>{const o={};keys.forEach(k=>{const v=localStorage.getItem(k);if(v!==null){try{o[k]=JSON.parse(v)}catch{o[k]=v}}});return o};
 const stable=value=>JSON.stringify(value,(key,val)=>val&&typeof val==='object'&&!Array.isArray(val)?Object.keys(val).sort().reduce((acc,k)=>(acc[k]=val[k],acc),{}):val);
 const apply=data=>{keys.forEach(k=>{if(Object.prototype.hasOwnProperty.call(data||{},k)){const v=data[k];localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))}})};
 let userId=null,loaded=false,timer=null,applying=false,channel=null;
 const rawSet=localStorage.setItem.bind(localStorage);
 localStorage.setItem=function(k,v){rawSet(k,v);if(loaded&&!applying&&keys.includes(String(k)))scheduleSave()};
 async function save(){if(!loaded||!userId)return;const payload=snapshot();const {error}=await client.from('allmoney_state').upsert({user_id:userId,data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error){notice('Cloud sync error: '+error.message+' — export a backup before continuing.')}else notice('Cloud sync connected · saved across your signed-in browsers')}
 function scheduleSave(){clearTimeout(timer);timer=setTimeout(save,900)}
 function reloadOnce(){const path=location.pathname;const marker='allmoney_cloud_reload:'+path;if(sessionStorage.getItem(marker)==='1')return;sessionStorage.setItem(marker,'1');location.reload()}
 async function start(){const {data:{session},error:sessionError}=await client.auth.getSession();if(sessionError)throw sessionError;if(!session){location.replace('login.html');return}userId=session.user.id;notice('Connecting to your secure cloud data…');const {data,error}=await client.from('allmoney_state').select('data,updated_at').eq('user_id',userId).maybeSingle();if(error)throw error;
  if(data&&data.data){applying=true;apply(data.data);applying=false;loaded=true;notice('Cloud data loaded · syncing this browser');const marker='allmoney_cloud_reload:'+location.pathname;if(sessionStorage.getItem(marker)!=='1'){reloadOnce();return}sessionStorage.removeItem(marker)}
  else {loaded=true;await save()}
  channel=client.channel('allmoney-state-'+userId).on('postgres_changes',{event:'UPDATE',schema:'public',table:'allmoney_state',filter:'user_id=eq.'+userId},payload=>{if(!payload.new||!payload.new.data)return;if(stable(snapshot())===stable(payload.new.data))return;applying=true;apply(payload.new.data);applying=false;notice('Updated from another signed-in browser');location.reload()}).subscribe();
  client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')location.replace('login.html')});
  window.addEventListener('beforeunload',()=>{if(channel)client.removeChannel(channel)});
 }
 start().catch(e=>notice('Cloud sync setup/error: '+(e.message||String(e))+' · Your local browser data has not been intentionally deleted.'));
})();
