import { Tab, TabContainer } from "./classes.js";

var inputBox = document.querySelector("input");
inputBox.focus();

const tabCont = new TabContainer();

/** Counts all currently open tabs (not searched tabs) */
async function updateTabCount() {
  var allTabs = await chrome.tabs.query({});
  document.querySelector("#tabCount").innerHTML = allTabs.length;
}
await updateTabCount();

/** @returns {Promise<chrome.tabs.Tab|undefined>} */
async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
 * Searches for tabs and displays them
 * Runs when the extension is opened, or when the user is typing on the search bar */
async function doSearch() {
  tabCont.clearElems();
  var allTabs = await chrome.tabs.query({});
  var currentTab = await getCurrentTab();
  var search = document.querySelector("input").value.toLowerCase();

  /** Filtered tabs based on search query. Uses a generator function that gets turned into a normal array. */
  const searchedTabs = [
    ...(function* () {
      for (let tab of allTabs) {
        if (
          tab.title.toLowerCase().includes(search) ||
          tab.url.toLowerCase().includes(search)
        ) {
          yield tab;
        }
      }
    })(),
  ];

  document.querySelector("#resultCount").innerHTML = searchedTabs.length;
  const collator = new Intl.Collator();
  searchedTabs.sort((a, b) => collator.compare(a.title, b.title));

  const template = document.getElementById("li_template");

  for (const tab of searchedTabs) {
    /** @type {HTMLLIElement} */
    const element = template.content.firstElementChild.cloneNode(true);

    const tabObj = new Tab(element, tab, currentTab);

    tabObj.setContents();

    tabObj.aElem.addEventListener("click", async (e) => {
      if (e.ctrlKey) {
        // select tab
        tabObj.selectTab();
      } else {
        // focus window as well as the active tab
        await tabObj.focusWindowTab();
      }
    });
    tabObj.closeButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      await tabCont.closeTab(tabObj.id);
      await updateTabCount();
    });

    tabObj.markIfCurrentTab();

    tabCont.add(tabObj);
  }

  tabCont.showAll();

  await updateTabCount();
}

await doSearch();

/**
 * delays running a function until some time has passed
 * @param {function} callback - the function to run
 * @param {number} wait - how long to wait
 */
function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      callback.apply(this, args);
    }, wait);
  };
}

inputBox.addEventListener(
  "keyup",
  debounce(async () => {
    doSearch();
  }, 250)
);

const purgeButton = document.querySelector("button#purge");
purgeButton.addEventListener("click", async () => {
  await tabCont.purgeDisplayed();

  await updateTabCount();
});

document.addEventListener("keyup", function (e) {
  /**
   * Navigates through the list of elements associated with the tabs
   * If none is currently selected, select the first item
   * If something is selected, unselect it, navigate up/down, and select the new item
   * @param {string} direction - the direction to move towards
   */
  function navigate(direction) {
    var tabList = document.querySelectorAll("body > ul > li");
    var selectedItems = document.querySelectorAll(".selected");

    if (selectedItems.length == 0) {
      selectedItem = tabList[0];
    } else {
      var selectedItem = selectedItems[0];
      selectedItem.classList.remove("selected");

      if (direction == "up") {
        selectedItem =
          selectedItem.previousSibling != null
            ? selectedItem.previousSibling
            : selectedItem;
      } else if (direction == "down") {
        selectedItem =
          selectedItem.nextSibling != null
            ? selectedItem.nextSibling
            : selectedItem.previousSibling != null
            ? selectedItem.previousSibling
            : selectedItem;
      }
    }

    if (selectedItem != undefined) {
      selectedItem.classList.add("selected");
      selectedItem.scrollIntoView();
    }
  }

  if (document.activeElement != document.querySelector("input")) {
    if (e.key == "k") {
      //Down
      navigate("down");
    } else if (e.key == "j") {
      // Up
      navigate("up");
    } else if (e.key == "Delete") {
      // Delete
      var selectedItems = document.querySelectorAll(".selected");
      selectedItems.forEach((element) => {
        element.querySelector(".tabContainer > .closeDiv > button").click();
      });
      navigate("down");
    }
  }
});

document.querySelector("#blacklistBtn").addEventListener("click", () => {
  var blacklist_query = document.querySelector("input").value;

  const element = document
    .querySelector("#blacklist_template")
    .content.firstElementChild.cloneNode(true);
  element.querySelector("p").textContent = blacklist_query;
  element.querySelector("input").checked = true;

  if (!tabCont.blacklist.has(blacklist_query)) {
    tabCont.addToBlacklist(blacklist_query);
    element.querySelector(".rmBlacklist").addEventListener("click", () => {
      tabCont.removeFromBlacklist(blacklist_query);
      element.remove();
    });

    document.querySelector("#blackListUl").appendChild(element);
  }

  // var blacklistItem = document.createElement("li");
  // blacklistItem.innerHTML = blacklist_query;
  // .appendChild(blacklistItem);
});
