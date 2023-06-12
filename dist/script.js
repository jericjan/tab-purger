import{Tab as e,TabContainer as t}from"./classes.js";var n=document.querySelector("input");n.focus();const l=new t;async function o(){var e=await chrome.tabs.query({});document.querySelector("#tabCount").innerHTML=e.length}async function c(){l.clearElems();var t=await chrome.tabs.query({}),n=await async function(){let[e]=await chrome.tabs.query({active:!0,lastFocusedWindow:!0});return e}(),c=document.querySelector("input").value.toLowerCase();function i(e,t){for(const n of t)if(e.includes(n))return!0;return!1}const r=[...function*(){for(let e of t){const t=e.title.toLowerCase().includes(c)||e.url.toLowerCase().includes(c),n=i(e.title.toLowerCase(),l.blacklist)||i(e.url.toLowerCase(),l.blacklist);t&&!n&&(yield e)}}()];document.querySelector("#resultCount").innerHTML=r.length;const a=new Intl.Collator;r.sort(((e,t)=>a.compare(e.title,t.title)));const s=document.getElementById("li_template");for(const t of r){const c=s.content.firstElementChild.cloneNode(!0),i=new e(c,t,n);i.setContents(),i.aElem.addEventListener("click",(async e=>{e.ctrlKey?i.selectTab():await i.focusWindowTab()})),i.closeButton.addEventListener("click",(async e=>{e.stopPropagation(),await l.closeTab(i.id),await o()})),i.markIfCurrentTab(),l.add(i)}l.showAll(),await o()}await o(),await c(),n.addEventListener("keyup",function(e,t){let n;return(...l)=>{clearTimeout(n),n=setTimeout((function(){e.apply(this,l)}),t)}}((async()=>{c()}),250));document.querySelector("button#purge").addEventListener("click",(async()=>{await l.purgeDisplayed(),await o()})),document.addEventListener("keyup",(function(e){function t(e){var t=document.querySelectorAll("body > ul > li"),n=document.querySelectorAll(".selected");if(0==n.length)l=t[0];else{var l=n[0];l.classList.remove("selected"),"up"==e?l=null!=l.previousSibling?l.previousSibling:l:"down"==e&&(l=null!=l.nextSibling?l.nextSibling:null!=l.previousSibling?l.previousSibling:l)}null!=l&&(l.classList.add("selected"),l.scrollIntoView())}if(document.activeElement!=document.querySelector("input"))if("k"==e.key)t("down");else if("j"==e.key)t("up");else if("Delete"==e.key){document.querySelectorAll(".selected").forEach((e=>{e.querySelector(".tabContainer > .closeDiv > button").click()})),t("down")}})),document.querySelector("#blacklistBtn").addEventListener("click",(()=>{var e=document.querySelector("input").value;const t=document.querySelector("#blacklist_template").content.firstElementChild.cloneNode(!0);t.querySelector("p").textContent=e,l.blacklist.has(e)||(l.addToBlacklist(e),t.querySelector(".rmBlacklist").addEventListener("click",(()=>{l.removeFromBlacklist(e),t.remove(),c()})),document.querySelector("#blackListUl").appendChild(t),c())}));