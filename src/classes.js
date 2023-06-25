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
    this.currentTab = currentTab;
  }

  /** returns the close button element of the tab */
  get closeButton() {
    return this.element.querySelector(".close");
  }

  /** returns the tab's unique ID, not to be confused with the element's own ID*/
  get id() {
    return this.tab.id;
  }

  /** Sets the title, URL, icon, and ID of the HTML element*/
  setContents() {
    const title = this.tab.title.trim();
    const pathname = this.tab.url;
    const faviUrl = this.tab.favIconUrl;
    this.element.querySelector(".title").textContent = title;
    this.element.querySelector(".pathname").textContent = pathname;
    this.element.querySelector(".iconDiv > img").src = faviUrl;
    this.element.querySelector("a").setAttribute("id", `tab-${this.tab.id}`);
  }

  selectTab() {
    // unselects all tabs
    var selectedTabList = document.querySelectorAll(".selected");
    selectedTabList.forEach((element) => {
      element.classList.remove("selected");
    });

    // selects this tab
    this.element
      .querySelector(`#tab-${this.tab.id}`)
      .parentElement.classList.add("selected");
  }

  async focusWindowTab() {
    await chrome.tabs.update(this.tab.id, {
      active: true,
    });
    await chrome.windows.update(this.tab.windowId, {
      focused: true,
    });
  }

  get isCurrentTab() {
    return this.currentTab.id == this.tab.id;
  }

  /** Checks if it's the current tab and if it is, gives it the appropriate class name */
  markIfCurrentTab() {
    if (this.isCurrentTab) {
      this.element.classList.add("current-tab");
    }
  }
}

class TabContainer {
  /** For managing all Tab (not chrome.tabs.Tab) objects
   * @param {function} doSearch - The function that searches for tabs. Used for the blacklist
   */
  constructor(doSearch) {
    /**
     * A list of Tab objects.
     * Used for getting the IDs of the tabs in order to close them.
     * @type {Tab[]}
     */
    this.tabObjs = [];

    /** @type {Set<String>} */
    this.blacklist = new Set();

    /** @type {function}
     * @returns {Promise<void>}
     */
    this.doSearch = doSearch;
  }

  /**
   * @param {Tab} tabObj - gets added to {@link tabObjs} dict
   */
  add(tabObj) {
    this.tabObjs.push(tabObj);
  }

  /** @param {number} tabId */
  async closeTab(tabId) {
    console.log(`Closing tab ${tabId}.`);

    const index = this.tabObjs.findIndex(function (item) {
      return item.id === tabId;
    });

    if (
      !this.tabObjs[index].isCurrentTab ||
      confirm("This is the current tab! Are you sure you want to close it?")
    ) {
      this.tabObjs.splice(index, 1);
      await chrome.tabs.remove(tabId);
      document.querySelector(`#tab-${tabId}`).parentElement.remove();
    }
  }

  /** Displays all elements stored in the Tab objects by appending it to `ul` */
  showAll() {
    const getElems = function* () {
      for (const tabObj of this.tabObjs) {
        yield tabObj.element;
      }
    }.bind(this);

    const uniqueElems = new Set([...getElems()]); //removes dupes just in case
    document.querySelector("#tabListUl").append(...uniqueElems);
  }

  /** Clears all HTML elements associated with tabs w/o actually closing any tabs */
  clearElems() {
    document.querySelector("body > ul").innerHTML = "";

    // empty this cuz it'll get set again anyway
    this.tabObjs = [];
  }

  /** runs {@link closeTab()} on all currently displayed tabs */
  async purgeDisplayed() {
    const getIds = function* () {
      for (const tabObj of this.tabObjs) {
        yield tabObj.id;
      }
    }.bind(this);

    for (const id of [...getIds()]) {
      await this.closeTab(id);
    }
  }

  /**
   * Runs when the user clicks the "Add to Blacklist" button, and when the extension is first opened
   * @param {string} input - The blacklist query to be added
   * @param {boolean} init - A boolean that tells if the extension was just opened or if the button was clicked
   */
  async onBlacklistBtnClick(input, init = false) {
    console.log("thi is:");
    console.log(this);
    var blacklist_query = input;

    const element = document
      .querySelector("#blacklist_template")
      .content.firstElementChild.cloneNode(true);
    element.querySelector("p").textContent = blacklist_query;

    if (!this.blacklist.has(blacklist_query) || init == true) {
      await this.addToBlacklist(blacklist_query);
      element
        .querySelector(".rmBlacklist")
        .addEventListener("click", async () => {
          await this.removeFromBlacklist(blacklist_query);
          element.remove();
          this.doSearch();
        });

      document.querySelector("#blackListUl").appendChild(element);
      if (init == false) {
        this.doSearch();
      }
    } else {
      console.log("Already in blacklist");
    }
  }

  /**
   * Adds a query to the blacklist
   * @param {string} query - The query to add
   */
  async addToBlacklist(query) {
    this.blacklist.add(query);
    await this.saveBlacklist();
  }

  /**
   * Removes a query from the blacklist
   * @param {string} query - The query to remove
   */
  async removeFromBlacklist(query) {
    this.blacklist.delete(query);
    await this.saveBlacklist();
  }

  /**
   * Saves the entire blacklist to local storage
   */
  async saveBlacklist() {
    await chrome.storage.local.set({ blacklist: [...this.blacklist] });
  }

  /**
   * Loads the entire blacklist from local storage on startup
   */
  async loadBlacklist() {
    const storage = await chrome.storage.local.get(["blacklist"]);
    this.blacklist = new Set(storage.blacklist);
    for (const item of this.blacklist) {
      await this.onBlacklistBtnClick(item, true);
    }
  }
}

export { Tab, TabContainer };
