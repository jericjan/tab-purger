import { Tab, TabContainer } from "./classes.js";

var inputBox = document.querySelector("input");
inputBox.focus();

const tabCont = new TabContainer(doSearch);
tabCont.loadBlacklist();

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

  /**
   * Checks if a string includes any of the substrings in the given array.
   *
   * @param {string} str - The string to search in.
   * @param {string[]} arr - The array of substrings to search for.
   * @return {boolean} - Returns true if any of the substrings are found in the string, otherwise returns false.
   */
  function stringIncludesAny(str, arr) {
    for (const bListStr of arr) {
      if (str.includes(bListStr)) {
        return true;
      }
    }
    return false;
  }

  /** Filtered tabs based on search query. Uses a generator function that gets turned into a normal array. */
  const searchedTabs = [
    ...(function* () {
      for (let tab of allTabs) {
        const titleOrUrlContainsSearch =
          tab.title.toLowerCase().includes(search) ||
          tab.url.toLowerCase().includes(search);
        const titleOrUrlIsBlacklisted =
          stringIncludesAny(tab.title.toLowerCase(), tabCont.blacklist) ||
          stringIncludesAny(tab.url.toLowerCase(), tabCont.blacklist);

        if (titleOrUrlContainsSearch && !titleOrUrlIsBlacklisted) {
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

    tabObj.element.addEventListener("click", async (e) => {
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
   * Navigates through the list of elements associated with the tabs.
   * If none is currently selected, select the first item.
   * If something is selected, unselect it, navigate up/down, and select the new item.
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

document.querySelector("#blacklistBtn").addEventListener("click", async () => {
  await tabCont.onBlacklistBtnClick.bind(tabCont)(
    document.querySelector("input").value
  );
});
