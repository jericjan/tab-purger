class Tab {

    /**
     * For managing a tab and the HTML associated with it.       
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

    /** For managing all Tab (not chrome.tabs.Tab) objects */
    constructor(){        
        /**
         * A list of Tab objects.  
         * Used for getting the IDs of the tabs in order to close them.
         * @type {Tab[]}
         */  
        this.tabObjs = []
    }

    /**    
     * @param {Tab} tabObj - gets added to {@link tabObjs} dict
     * @param {HTMLLIElement} tabObj.element - gets added to {@link elems}
     */
    add(tabObj){        
        this.tabObjs.push(tabObj)
    }

    /** @param {number} tabId */
    async closeTab(tabId){
        console.log(`Closing tab ${tabId}.`) 
        await chrome.tabs.remove(tabId);
        document.querySelector(`#tab-${tabId}`).parentElement.remove()        

        const index = this.tabObjs.findIndex(function(item) {
            return item.id === tabId;
          });
        console.log("it's at index", index)
        this.tabObjs.splice(index, 1)

    }

    /** Displays all elements in `elems` by appending it to `ul` */
    showAll(){

        const getElems = function*() {            
            for (const tabObj of this.tabObjs){  
                yield tabObj.element
            }
        }.bind(this)

        const uniqueElems = new Set([...getElems()]) //removes dupes just in case
        document.querySelector("ul").append(...uniqueElems);
    }

    /** Clears all HTML elements associated with tabs w/o actually closing any tabs */
    clearElems(){
        document.querySelector("body > ul").innerHTML = ""

        // empty this cuz it'll get set again anyway
        this.tabObjs = []
    }
    
    /** runs {@link closeTab()} on all currently displayed tabs */
    async purgeDisplayed(){
        const getIds = function*() {            
            for (const tabObj of this.tabObjs){  
                yield tabObj.id
            }
        }.bind(this)

        for (const id of [...getIds()]){            
            await this.closeTab(id)
        }
    }

}


export { Tab, TabContainer };