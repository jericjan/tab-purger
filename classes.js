class Tab {

    /**
     * 
     * @param {Node} element - this is the HTML element that displays the tab
     * @param {tabs.Tab} tab - this is the actual tab object
     * @param {tabs.Tab} current_tab - the currently active tab
     */
    constructor(element, tab, current_tab) {
      this.element = element;
      this.tab = tab;
      this.current_tab = current_tab
    }

    /** returns the "a" element associated with the tab */
    get aElem(){
        return this.element.querySelector("a")
    }

    /** returns the close button element of the tab */
    get closeButton(){
        return this.element.querySelector(".close")
    }

    setContents(){
        const title = this.tab.title.trim();
        const pathname = this.tab.url;
        const faviUrl = this.tab.favIconUrl
        this.element.querySelector(".title").textContent = title;
        this.element.querySelector(".pathname").textContent = pathname;
        this.element.querySelector(".iconDiv > img").src = faviUrl;
        this.element.querySelector("a").setAttribute('id', `tab-${this.tab.id}`);        
    }

    selectTab(tabId){

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

    async closeTab(){
        window.event.stopPropagation();
        await chrome.tabs.remove(this.tab.id);
        this.element.querySelector(`#tab-${this.tab.id}`).parentElement.remove()        
    }

    /** Checks if it's the current tab and if it is, gives it the appropriate class name */
    checkIfCurrentTab(){
        if (this.current_tab.id == this.tab.id) {
            this.element.classList.add('current-tab')
        }
    }

}    

class TabContainer {

    constructor(){
        this.set = new Set()
    }

    add(elem){
        this.set.add(elem)
    }

    showAll(){
        document.querySelector("ul").append(...this.set);
    }

}

class TabPurger {

    constructor(){
        this.displayedTabs = document.querySelectorAll("ul > li > a")
    }

    async closeAll(){
        for (const tab of this.displayedTabs) {
            let id = parseInt(tab.id.slice(4))
            await chrome.tabs.remove(id);
            document.querySelector(`#tab-${id}`).parentElement.remove()
        }        
    }

}

export { Tab, TabContainer, TabPurger };
