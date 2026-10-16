/* UI shell only: never modifies transactions, login state, storage or calculations. */
(function(){
  function init(){
    if(document.body.classList.contains("am-redesigned"))return;
    document.body.classList.add("am-redesigned");
    const name=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    const current=({ "index.html":"Overview","tracker.html":"Financial Tracker","budget.html":"Budget Planner","investment.html":"Investment Tracker" })[name]||"Overview";
    const links=[
      ["index.html","⌂","Overview"],
      ["tracker.html","▤","Financial Tracker"],
      ["budget.html","▦","Budget Planner"],
      ["investment.html","↗","Investment Tracker"]
    ];
    const sidebar=document.createElement("aside");
    sidebar.className="am-sidebar";
    sidebar.setAttribute("aria-label","Main navigation");
    const brand=document.createElement("div");
    brand.className="am-brand";
    brand.innerHTML='<div class="am-brand-icon" aria-hidden="true">◈</div><span>All Money<small>Personal Finance</small></span>';
    sidebar.appendChild(brand);
    const nav=document.createElement("nav");
    links.forEach(function(entry){
      const a=document.createElement("a");
      a.href=entry[0];a.className=entry[2]===current?"active":"";
      if(a.className==="active")a.setAttribute("aria-current","page");
      const icon=document.createElement("span");icon.className="am-nav-icon";icon.setAttribute("aria-hidden","true");icon.textContent=entry[1];
      const label=document.createElement("span");label.className="am-nav-text";label.textContent=entry[2];
      a.append(icon,label);nav.appendChild(a);
    });
    sidebar.appendChild(nav);
    const foot=document.createElement("div");foot.className="am-sidebar-footer";foot.textContent="ALL MONEY · FINANCIAL WORKSPACE";
    sidebar.appendChild(foot);
    const top=document.createElement("div");top.className="am-topbar";
    const search=document.createElement("div");search.className="am-search";search.textContent="⌕  "+current+"  ·  Your financial workspace";
    const account=document.createElement("div");account.className="am-account";
    account.innerHTML='<span class="am-welcome">All Money</span><span class="am-avatar" aria-hidden="true">AM</span>';
    top.append(search,account);
    document.body.prepend(top);document.body.prepend(sidebar);
    document.title="All Money | "+current;
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
