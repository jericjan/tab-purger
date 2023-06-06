class Tab {

    /**
     * 
     * @param {HTMLLIElement} element - this is the HTML element that displays the tab
     * @param {chrome.tabs.Tab} tab - this is the actual tab object
     * @param {chrome.tabs.Tab} currentTab - the currently active tab
     */
    constructor(element, tab, currentTab) {
      this.element = element;
      this.tab = tab;
      this.currentTab = currentTab
    }

    /** returns the "a" element associated with the tab */
    get aElem(){
        return this.element.querySelector("a")
    }

    /** returns the close button element of the tab */
    get closeButton(){
        return this.element.querySelector(".close")
    }

    /** returns the tab's unique ID, not to be confused with the element's own ID*/
    get id(){
        return this.tab.id
    }

    /** Sets the title, URL, icon, and ID of the HTML element*/
    setContents(){
        const title = this.tab.title.trim();
        const pathname = this.tab.url;
        const faviUrl = this.tab.favIconUrl
        this.element.querySelector(".title").textContent = title;
        this.element.querySelector(".pathname").textContent = pathname;
        this.element.querySelector(".iconDiv > img").src = faviUrl;
        this.element.querySelector("a").setAttribute('id', `tab-${this.tab.id}`);        
    }

    selectTab(){

        // unselects all tabs
        var selectedTabList = document.querySelectorAll(".selected")
        selectedTabList.forEach(element => {
            element.classList.remove('selected')
        });    

        // selects this tab
        this.element.querySelector(`#tab-${this.tab.id}`).parentElement.classList.add('selected')
    }

    async focusWindowTab(){

        await chrome.tabs.update(this.tab.id, {
            active: true
        });        
        await chrome.windows.update(this.tab.windowId, {
            focused: true
        });        
    }

    /** Checks if it's the current tab and if it is, gives it the appropriate class name */
    checkIfCurrentTab(){
        if (this.currentTab.id == this.tab.id) {
            this.element.classList.add('current-tab')
        }
    }

}    

class TabContainer {


    constructor(){        
        /**
         * a set of HTML elements
         * @type {Set<HTMLLIElement>}
         */        
        this.elems = new Set() 

        /**
         * a dict of Tab objects
         * @type {Object.<number, Tab>}
         */  
        this.tabObjs = {} // 
    }

    /**    
     * @param {Tab} tabObj - gets added to {@link tabObjs} dict
     * @param {HTMLLIElement} tabObj.element - gets added to {@link elems}
     */
    add(tabObj){
        this.elems.add(tabObj.element)
        this.tabObjs[tabObj.id] = tabObj
    }

    /** @param {number} tabId */
    async closeTab(tabId){
        console.log(`Closing tab ${tabId}.`) 
        await chrome.tabs.remove(tabId);
        document.querySelector(`#tab-${tabId}`).parentElement.remove()        
        delete this.tabObjs[tabId]


        // won't need to modify elems because it will be cleared out anyway everytime you doSearch() and elems is only used to append to "ul"
    }

    /** Displays all elements in `elems` by appending it to `ul` */
    showAll(){
        document.querySelector("ul").append(...this.elems);
    }

    /** Clears all HTML elements associated with tabs w/o actually closing any tabs */
    clearElems(){
        document.querySelector("body > ul").innerHTML = ""

        // empty these cuz they'll get set again anyway
        this.elems = new Set()
        this.tabObjs = {}
    }
    
    /** runs {@link closeTab()} on all currently displayed tabs */
    async purgeDisplayed(){
        for (const tabId in this.tabObjs){
            await this.closeTab(parseInt(tabId))
        }
    }

}


export { Tab, TabContainer };
