import { Tab, TabContainer } from "./classes.js";


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator

var inputBox = document.querySelector("input")
inputBox.focus()

const tabCont = new TabContainer()

async function updateTabCount() {
    var all_tabs = await chrome.tabs.query({});
    document.querySelector("#tabCount").innerHTML = all_tabs.length
}
await updateTabCount()
// const search_button = document.querySelector("button#search");

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

/** Runs when the extension is opened, or when the user is typing on the search bar */
async function doSearch() {
    tabCont.clearElems()
    var all_tabs = await chrome.tabs.query({});
    var current_tab = await getCurrentTab();    
    var search = document.querySelector("input").value.toLowerCase();

    const tabs = [...(function*() {
        for (let tab of all_tabs) {
            if (tab.title.toLowerCase().includes(search) || tab.url.toLowerCase().includes(search)) {
                yield tab
            }
        }})()
    ]

    document.querySelector("#resultCount").innerHTML = tabs.length
    const collator = new Intl.Collator();
    tabs.sort((a, b) => collator.compare(a.title, b.title));

    const template = document.getElementById("li_template");    
    
    for (const tab of tabs) {
        const element = template.content.firstElementChild.cloneNode(true);

        const tabObj = new Tab(element, tab, current_tab)

        tabObj.setContents()

        tabObj.aElem.addEventListener("click", async (e) => {            

            if (e.ctrlKey) { // select tab            
                tabObj.selectTab()                
            } else { // focus window as well as the active tab
                await tabObj.focusWindowTab()
            }
        });
        tabObj.closeButton.addEventListener("click", async () => {
            // need to focus window as well as the active tab
            await tabCont.closeTab(tabObj.id)
            await updateTabCount()

        });

        tabObj.checkIfCurrentTab()        

        tabCont.add(tabObj)
    }
    
    tabCont.showAll()

    await updateTabCount()

}


await doSearch()

/** delays running a function until some time has passed*/
function debounce(callback, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(function () { callback.apply(this, args); }, wait);
    };
}

inputBox.addEventListener("keyup", debounce(async () => {
    doSearch()
}, 250))


const purge_button = document.querySelector("button#purge");
purge_button.addEventListener("click", async () => {

    await tabCont.purgeDisplayed()

    await updateTabCount()

});

document.addEventListener('keyup', function (e) {
    console.log(e.key)

    function navigate(direction) {

        var tabList = document.querySelectorAll("body > ul > li")
        var selectedItems = document.querySelectorAll(".selected")

        if (selectedItems.length == 0) {
            selectedItem = tabList[0]
        } else {
            var selectedItem = selectedItems[0]
            selectedItem.classList.remove('selected')

            if (direction == 'up') {
                selectedItem = (selectedItem.previousSibling != null) ? selectedItem.previousSibling : selectedItem
            } else if (direction == 'down') {
                selectedItem = (selectedItem.nextSibling != null) ? selectedItem.nextSibling : (selectedItem.previousSibling != null) ? selectedItem.previousSibling : selectedItem
            }
        }

        if (selectedItem != undefined) {
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