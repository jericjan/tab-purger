// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator

var inputBox = document.querySelector("input")
inputBox.focus()

async function getTabCount() {
var all_tabs = await chrome.tabs.query({});
document.querySelector("#tabCount").innerHTML = all_tabs.length
}
await getTabCount()
// const search_button = document.querySelector("button#search");

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

async function doSearch() {
    document.querySelector("body > ul").innerHTML = ""
    var all_tabs = await chrome.tabs.query({});
    var current_tab = await getCurrentTab();
    var tabs = []
    var search = document.querySelector("input").value.toLowerCase();
    for (let i = 0; i < all_tabs.length; i++) {
        if (all_tabs[i].title.toLowerCase().includes(search) || all_tabs[i].url.toLowerCase().includes(search)) {
            tabs.push(all_tabs[i])
        }	
    }	
	document.querySelector("#resultCount").innerHTML = tabs.length
    const collator = new Intl.Collator();
    tabs.sort((a, b) => collator.compare(a.title, b.title));

    const template = document.getElementById("li_template");
    const elements = new Set();
    for (const tab of tabs) {
        const element = template.content.firstElementChild.cloneNode(true);

        const title = tab.title.trim();
        const pathname = tab.url;
		const faviUrl = tab.favIconUrl
        element.querySelector(".title").textContent = title;
        element.querySelector(".pathname").textContent = pathname;
		element.querySelector(".iconDiv > img").src = faviUrl;
        element.querySelector("a").setAttribute('id', `tab-${tab.id}`);
        element.querySelector("a").addEventListener("click", async (e) => {
            // need to focus window as well as the active tab

            if (e.ctrlKey){
                var selectedTabList = document.querySelectorAll(".selected")
                selectedTabList.forEach(element => {
                    element.classList.remove('selected')
                });

                element.querySelector(`#tab-${tab.id}`).parentElement.classList.add('selected')

            } else{
                await chrome.tabs.update(tab.id, {
                    active: true
                });
                await chrome.windows.update(tab.windowId, {
                    focused: true
                });
            }
        });
        element.querySelector(".close").addEventListener("click", async () => {
            // need to focus window as well as the active tab
			window.event.stopPropagation();
            await chrome.tabs.remove(tab.id);
            element.querySelector(`#tab-${tab.id}`).parentElement.remove()
			await getTabCount()
            
        });
        if (current_tab.id == tab.id) {
            element.classList.add('current-tab')
        }
        elements.add(element);
    }
    document.querySelector("ul").append(...elements);
	await getTabCount()
    //  const tabIds = tabs.map(({ id }) => id);
    // const group = await chrome.tabs.group({ tabIds });
    //await chrome.tabGroups.update(group, { title: "DOCS" });	
}

// search_button.addEventListener("click", async () => {

// });
await doSearch()

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(function () { callback.apply(this, args); }, wait);
  };
}

inputBox.addEventListener("keyup",  debounce( async () => {
	doSearch()
}, 250))


const purge_button = document.querySelector("button#purge");
purge_button.addEventListener("click", async () => {
    var result_elems = document.querySelectorAll("ul > li > a")
    for (let i = 0; i < result_elems.length; i++) {
		let id = parseInt(result_elems[i].id.slice(4))
        await chrome.tabs.remove(id);
		document.querySelector(`#tab-${id}`).parentElement.remove()
    }
	await getTabCount()
});

document.addEventListener('keyup', function (e) {
    console.log(e.key)

    function navigate(direction){

        var tabList = document.querySelectorAll("body > ul > li")
        var selectedItems = document.querySelectorAll(".selected")

        if (selectedItems.length == 0) {
            selectedItem = tabList[0]
        } else {
            var selectedItem = selectedItems[0]
            selectedItem.classList.remove('selected')

            if (direction == 'up'){
                selectedItem = (selectedItem.previousSibling != null) ? selectedItem.previousSibling : selectedItem
            } else if (direction == 'down') {
                selectedItem = (selectedItem.nextSibling != null) ? selectedItem.nextSibling : (selectedItem.previousSibling != null) ? selectedItem.previousSibling : selectedItem
            }        
        }

        if (selectedItem != undefined){
            selectedItem.classList.add('selected')
            selectedItem.scrollIntoView()
        }
        



    }
    if (document.activeElement != document.querySelector("input")) {
        if (e.key == "k") { //Down      
            navigate("down")
        } else if (e.key == "j") { // Up
            navigate("up")
        } else if (e.key == "Delete") { // Delete
            var selectedItems = document.querySelectorAll(".selected")
            selectedItems.forEach(element => {
                element.querySelector(".tabContainer > .closeDiv > button").click()
            });
            navigate("down")
        }
    }
  });