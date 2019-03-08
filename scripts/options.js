/// Global variables
// Debugging
const logToConsole = true;

// Settings container and div for addSearchEngine
const divContainer = document.getElementById("container");
const divAddSearchEngine = document.getElementById("addSearchEngine");

// Engine
const show = document.getElementById("show"); // Boolean
const name = document.getElementById("name"); // String
const keyword = document.getElementById("keyword"); // String
const multitab = document.getElementById("multitab"); // Boolean
const url = document.getElementById("url"); // String

// Settings
const openNewTab = document.getElementById("openNewTab");
const openNewWindow = document.getElementById("openNewWindow");
const sameTab = document.getElementById("sameTab");
const tabMode = document.getElementById("tabMode");
const tabActive = document.getElementById("tabActive");
const active = document.getElementById("active");
const optionsMenuLocation = document.getElementById("optionsMenuLocation");
const getFavicons = document.getElementById("getFavicons");
const cacheFavicons = document.getElementById("cacheFavicons");

// All engine buttons
const btnClearAll = document.getElementById("clearAll");
const btnSelectAll = document.getElementById("selectAll");
const btnReset = document.getElementById("reset");

// Add new search engine buttons
const btnTest = document.getElementById("test");
const btnAdd = document.getElementById("add");
const btnClear = document.getElementById("clear");

// Import/export
const btnDownload = document.getElementById("download");
const btnUpload = document.getElementById("upload");

let divSearchEngines = document.getElementById("searchEngines");
let storageSyncCount = 0;
let searchEngines = {};

// Translation variables
const move = browser.i18n.getMessage("move");
const up = browser.i18n.getMessage("up");
const down = browser.i18n.getMessage("down");
const remove = browser.i18n.getMessage("remove");
const multipleSearchEnginesSearch = browser.i18n.getMessage("multipleSearchEnginesSearch");
const titleShowEngine = browser.i18n.getMessage("titleShowEngine");
const placeHolderName = browser.i18n.getMessage("searchEngineName");
const placeHolderKeyword = browser.i18n.getMessage("placeHolderKeyword");
const notifySearchEngineAdded = browser.i18n.getMessage("notifySearchEngineAdded");

// Typing timer
var prevouslySavedData;
var nextSaveTime;
var saveInterval = 1500;
var typingTimerSearchEngineName;
var typingTimerKeyword;
var typingTimerQueryString;
var typingEventSearchEngineName;
var typingEventKeyword;
var typingEventQueryString;
var typingInterval = 1500;

/// Event handlers
document.addEventListener('DOMContentLoaded', restoreOptions);
browser.storage.onChanged.addListener(handleStorageChange);

// Settings
cacheFavicons.addEventListener("click", updateCacheFavicons);
getFavicons.addEventListener("click", updateGetFavicons);
tabMode.addEventListener("click", updateTabMode);
tabActive.addEventListener("click", updateTabMode);
optionsMenuLocation.addEventListener("click", updateOptionsMenuLocation);

// All engine buttons
btnClearAll.addEventListener("click", clearAll);
btnSelectAll.addEventListener("click", selectAll);

// Add new engine
btnReset.addEventListener("click", reset);
btnTest.addEventListener("click", testSearchEngine);
btnAdd.addEventListener("click", addSearchEngine);
btnClear.addEventListener("click", clear);

// Import/export
btnDownload.addEventListener("click", saveToLocalDisk);
btnUpload.addEventListener("change", handleFileUpload);

// Send a message to the background script
function sendMessage(action, data) {
    browser.runtime.sendMessage({"action": action, "data": data});
}

// Notification
function notify(message) {
    sendMessage("notify", message);
}

// Generic Error Handler
function onError(error) {
  console.log(`${error}`);
}

function upEventHandler(e) {
    e.stopPropagation();
    moveSearchEngineUp(e);
}

function downEventHandler(e) {
    e.stopPropagation();
    moveSearchEngineDown(e);
}

function removeEventHandler(e) {
    e.stopPropagation();
    removeSearchEngine(e);
}

function sortByIndex(list) {
    let sortedList = {};
    let skip = false;

    // If there are no indexes, then add some arbitrarily
    for (let i = 0;i < Object.keys(list).length;i++) {
        let id = Object.keys(list)[i];
        if (list[id].index != null) {
            break;
        }
        if (list[id] != null) {
            sortedList[id] = list[id];
            sortedList[id]["index"] = i;
            skip = true;
        }
    }

    // If there are indexes, then sort the list
    if (!skip) {
       for (let i = 0;i < Object.keys(list).length;i++) {
           for (let id in list) {
               if (list[id] != null && list[id].index === i) {
                    sortedList[id] = list[id];
               }
           }
       }
    }
  
    return sortedList;
}

// Display the list of search engines
function listSearchEngines(list) {
    let divSearchEngines = document.getElementById("searchEngines");
    if (divSearchEngines != null) divContainer.removeChild(divSearchEngines);

    searchEngines = sortByIndex(list);
    divSearchEngines = document.createElement("ol");
    divSearchEngines.setAttribute("id", "searchEngines");
    for (let id in searchEngines) {
        let searchEngine = searchEngines[id];
        let lineItem = createLineItem(id, searchEngine);
        divSearchEngines.appendChild(lineItem);
    }
    divContainer.appendChild(divSearchEngines);
    storageSyncCount = divSearchEngines.childNodes.length;

}

// Create a navigation button using icons from ionicon (up arrow, down arrow and bin)
function createButton(ioniconClass, btnClass, btnTitle) {
    let button = document.createElement("button");
    let btnIcon = document.createElement("i");
    button.setAttribute("type", "button");
    button.setAttribute("class", btnClass);
    button.setAttribute("title", btnTitle);
    btnIcon.setAttribute("class", "icon " + ioniconClass);
    button.appendChild(btnIcon);
    return button;
}

// Display a single search engine in a row or line item
function createLineItem(id, searchEngine) {
    let searchEngineName = searchEngine.name;
    let lineItem = document.createElement("li");

    // Input elements for each search engine composing each line item
    let chkShowSearchEngine = document.createElement("input");
    let inputSearchEngineName = document.createElement("input");
    let inputKeyword = document.createElement("input");
    let chkMultiSearch = document.createElement("input");
    let inputQueryString = document.createElement("input");

    // Navigation and deletion buttons for each search engine or line item
    let upButton = createButton("ion-ios-arrow-up", "up", move + " " + searchEngineName + " " + up);
    let downButton = createButton("ion-ios-arrow-down", "down", move + " " + searchEngineName + " " + down);
    let removeButton = createButton("ion-ios-trash", "remove", remove + " " + searchEngineName);
    
    // Event handler for 'show search engine' checkbox click event
    chkShowSearchEngine.addEventListener("click", visibleChanged); // when users check or uncheck the checkbox

    // Event handlers for search engine name changes
    /*
    inputSearchEngineName.addEventListener("paste", searchEngineNameChanged); // when users paste text
    inputSearchEngineName.addEventListener("blur", searchEngineNameChanged); // when users leave the input field and content has changed
    inputSearchEngineName.addEventListener("keyup", function (e) {
		clearTimeout(typingTimerSearchEngineName);
		typingTimerSearchEngineName = setTimeout(searchEngineNameChanged, typingInterval);
    });
    inputSearchEngineName.addEventListener("keydown", function(e){
        typingEventSearchEngineName = e;
        clearTimeout(typingTimerSearchEngineName);
    });
    inputSearchEngineName.addEventListener("input", function (e) {
        let timeStamp = Math.floor(Date.now());
        let data = e.data;
        if (nextSaveTime === null) nextSaveTime = timeStamp + saveInterval;
        if (data = previouslySavedData || timeStamp < nextSaveTime ) return;
        prevouslySavedData = data;
        nextSaveTime = timeStampe + saveInterval;
        searchEngineNameChanged();
    });
    */
    inputSearchEngineName.addEventListener("cut", searchEngineNameChanged); // when users paste text
    inputSearchEngineName.addEventListener("paste", searchEngineNameChanged); // when users paste text
    inputSearchEngineName.addEventListener("input", function (e) {
        typingEventSearchEngineName = e;
        clearTimeout(typingTimerSearchEngineName);
        typingTimerSearchEngineName = setTimeout(searchEngineNameChanged, typingInterval);
    });
    inputSearchEngineName.addEventListener("change", function (e) {
        typingEventSearchEngineName = e;
        clearTimeout(typingTimerSearchEngineName);
        searchEngineNameChanged();
    });

    // Event handlers for keyword text changes
    inputKeyword.addEventListener("paste", keywordChanged); // when users paste text
    inputKeyword.addEventListener("change", keywordChanged); // when users leave the input field and content has changed
    inputKeyword.addEventListener("keyup", function (e) {
		clearTimeout(typingTimerKeyword);
		typingTimerKeyword = setTimeout(keywordChanged, typingInterval);
	});
	inputKeyword.addEventListener("keydown", function (e) {
		typingEventKeyword = e;
		clearTimeout(typingTimerKeyword);
	});
    
    // Event handler for 'include search engine in multi-search' checkbox click event
    chkMultiSearch.addEventListener("click", multiTabChanged); // when users check or uncheck the checkbox

    // Event handlers for query string changes
    inputQueryString.addEventListener("paste", queryStringChanged); // when users paste text
    inputQueryString.addEventListener("change", queryStringChanged); // when users leave the input field and content has changed
	inputQueryString.addEventListener("keyup", function (e) {
		//clearTimeout(typingTimerQueryString);
		//typingTimerQueryString = setTimeout(queryStringChanged, typingInterval);
	});
	inputQueryString.addEventListener("keydown", function (e) {
		//typingEventQueryString = e;
		//clearTimeout(typingTimerQueryString);
	});

    // Navigation and deletion buttons event handlers
    upButton.addEventListener("click", upEventHandler);
    downButton.addEventListener("click", downEventHandler);
    removeButton.addEventListener("click", removeEventHandler);

    // Set attributes for all the elements composing a search engine or line item
    lineItem.setAttribute("id", id);

    chkShowSearchEngine.setAttribute("type", "checkbox");
    chkShowSearchEngine.setAttribute("title", titleShowEngine);
    chkShowSearchEngine.setAttribute("id", id + "-chk");
    chkShowSearchEngine.checked = searchEngine.show;

    inputSearchEngineName.setAttribute("type", "text");
    inputSearchEngineName.setAttribute("id", id + "-name");
    inputSearchEngineName.setAttribute("placeholder", placeHolderName);
    inputSearchEngineName.setAttribute("value", searchEngineName);

    inputKeyword.setAttribute("type", "text");
    inputKeyword.setAttribute("id", id + "-kw");
    inputKeyword.setAttribute("class", "keyword");
    inputKeyword.setAttribute("placeholder", placeHolderKeyword);
    inputKeyword.setAttribute("value", searchEngine.keyword);

    chkMultiSearch.setAttribute("type", "checkbox");
    chkMultiSearch.setAttribute("id", id + "-mt");
    chkMultiSearch.setAttribute("title", multipleSearchEnginesSearch);
    chkMultiSearch.checked = searchEngine.multitab;

    inputQueryString.setAttribute("type", "url");
    inputQueryString.setAttribute("value", searchEngine.url);

    // Attach all the elements composing a search engine to the line item
    lineItem.appendChild(chkShowSearchEngine);
    lineItem.appendChild(inputSearchEngineName);
    lineItem.appendChild(inputKeyword);
    lineItem.appendChild(chkMultiSearch);
    lineItem.appendChild(inputQueryString);

    lineItem.appendChild(upButton);
    lineItem.appendChild(downButton);
    lineItem.appendChild(removeButton);

    return lineItem;
}

function clearAll() {
    let divSearchEngines = document.getElementById("searchEngines");
    let lineItems = divSearchEngines.childNodes;
    for (i=0;i<lineItems.length;i++) {
        let input = lineItems[i].firstChild;
        if (input != null && input.nodeName == "INPUT" && input.getAttribute("type") == "checkbox") {
            input.checked = false;
        }
    }
    saveOptions();
}

function selectAll() {
    let divSearchEngines = document.getElementById("searchEngines");
    let lineItems = divSearchEngines.childNodes;
    for (i=0;i<lineItems.length;i++) {
        let input = lineItems[i].firstChild;
        if (input != null && input.nodeName == "INPUT" && input.getAttribute("type") == "checkbox") {
            input.checked = true;
        }
    }
    saveOptions();
}

function reset() {
    sendMessage("reset", "");
}

// Begin of user event handlers
function swapIndexes(previousItem, nextItem) {
    // Initialise variables
    let tmp = searchEngines[previousItem]["index"];

    searchEngines[previousItem]["index"] = searchEngines[nextItem]["index"];
    searchEngines[nextItem]["index"] = tmp;
    if (logToConsole) console.log("PREVIOUS item:" + JSON.stringify(searchEngines[previousItem]));
    if (logToConsole) console.log("NEXT item:" + JSON.stringify(searchEngines[nextItem]));
    searchEngines = sortByIndex(searchEngines);

    sendMessage("saveEngines", searchEngines);
}

function moveSearchEngineUp(e) {
    let lineItem = e.target.parentNode;
    let ps = lineItem.previousSibling;
    let pn = lineItem.parentNode;

    pn.removeChild(lineItem);
    pn.insertBefore(lineItem, ps);

    // Update indexes in sync storage
    swapIndexes(ps.getAttribute("id"), lineItem.getAttribute("id"));
}

function moveSearchEngineDown(e) {
    let lineItem = e.target.parentNode;
    let ns = lineItem.nextSibling;
    let pn = lineItem.parentNode;

    pn.removeChild(ns);
    pn.insertBefore(ns, lineItem);

    // Update indexes in sync storage
    swapIndexes(lineItem.getAttribute("id"), ns.getAttribute("id"));
}

function removeSearchEngine(e) {
    let lineItem = e.target.parentNode;
    let id = lineItem.getAttribute("id");
    let pn = lineItem.parentNode;
        
    pn.removeChild(lineItem);
    searchEngines[id] = null;
    searchEngines = sortByIndex(searchEngines);

    browser.storage.sync.remove(id).then(function (){
        sendMessage("saveEngines", searchEngines);
    }, onError);

}

function visibleChanged(e){
	let lineItem = e.target.parentNode;
	let id = lineItem.getAttribute("id");
    let visible = e.target.checked;
    
    searchEngines[id]["show"] = visible;

    sendMessage("saveEngines", searchEngines);
}

function searchEngineNameChanged(e) {
    if(e){
		if(e.target.value == typingEventSearchEngineName.target.value) return;
	}
    let event = e || typingEventSearchEngineName;
    if (!event) return;
	let lineItem = event.target.parentNode;
    let id = lineItem.getAttribute("id");
    let searchEngineName = event.target.value;
    
    searchEngines[id]["name"] = searchEngineName;

    sendMessage("saveEngines", searchEngines);
}

function keywordChanged(e){
	if(e){
		if(e.target.value == typingEventKeyword.target.value) return;
	}
    let event = e || typingEventKeyword;
    if (!event) return;
	let lineItem = event.target.parentNode;
	let id = lineItem.getAttribute("id");
    let keyword = event.target.value;

    searchEngines[id]["keyword"] = keyword;

    sendMessage("saveEngines", searchEngines);
}

function multiTabChanged(e){
	let lineItem = e.target.parentNode;
	let id = lineItem.getAttribute("id");
    let multiTab = e.target.checked;
    
    searchEngines[id]["multitab"] = multiTab;

    sendMessage("saveEngines", searchEngines);
}

function queryStringChanged(e){
	if(e){
		if(e.target.value == typingEventQueryString.target.value) return;
	}
    let event = e || typingEventQueryString;
    if (!event) return;
	let lineItem = event.target.parentNode;
	let id = lineItem.getAttribute("id");
    let queryString = event.target.value;
    
    searchEngines[id]["url"] = queryString;

    sendMessage("saveEngines", searchEngines);
}
// End of user event handlers

function readData() {
    let oldSearchEngines = {};
    oldSearchEngines = searchEngines;
    searchEngines = {};

    let divSearchEngines = document.getElementById("searchEngines");
    let lineItems = divSearchEngines.childNodes;
    storageSyncCount = lineItems.length;
    for (let i = 0;i < storageSyncCount;i++) {
        let input = lineItems[i].firstChild;
        if (input != null && input.nodeName === "INPUT" && input.getAttribute("type") === "checkbox") {
            let label = input.nextSibling;
            let keyword = label.nextSibling;
            let multiTab = keyword.nextSibling;
            let url = multiTab.nextSibling;
            searchEngines[lineItems[i].id] = {};
            searchEngines[lineItems[i].id]["index"] = i;
            searchEngines[lineItems[i].id]["name"] = label.value;
            searchEngines[lineItems[i].id]["keyword"] = keyword.value;
            searchEngines[lineItems[i].id]["multitab"] = multiTab.checked;
            searchEngines[lineItems[i].id]["url"] = url.value;
            searchEngines[lineItems[i].id]["show"] = input.checked;
            searchEngines[lineItems[i].id]["base64"] = oldSearchEngines[lineItems[i].id].base64;
        }
    }
    return sortByIndex(searchEngines);
}

// Save the list of search engines to be displayed in the context menu
function saveOptions() {
    if (logToConsole) console.log("Search Engines BEFORE SAVE:\n"+JSON.stringify(searchEngines));
    searchEngines = readData();
    if (logToConsole) console.log("Search Engines AFTER SAVE:\n"+JSON.stringify(searchEngines));
    sendMessage("saveEngines", searchEngines);
}

function testSearchEngine() {
	sendMessage("testSearchEngine", { url: document.getElementById("url").value });
}

function addSearchEngine() {
    let id = name.value.replace(" ", "-").toLowerCase();
    let divSearchEngines = document.getElementById("searchEngines");
    let strUrl = url.value;
    let testUrl = "";

    // Make certain that query string url starts with "https" to enforce SSL
    if (!strUrl.startsWith("https://")) {
        if (strUrl.startsWith("http://")) {
            strUrl.replace("http://", "https://");
        } else {
            strUrl += "https://" + strUrl;
        }
    }

    // Create test url
    if (strUrl.includes("{searchTerms}")) {
        testUrl = strUrl.replace("{searchTerms}", "test");
    } else if (strUrl.includes("%s")) {
        testUrl = strUrl.replace("%s", "test");
    } else {
        testUrl = strUrl + "test";
    }

    // Validate query string url
    if (url.validity.typeMismatch || !isValidUrl(testUrl)) {
        notify(notifyUrlNotValid);
        return;
    }
    
    searchEngines[id] = {"index": storageSyncCount, "name": name.value, "keyword": keyword.value, "multitab": multitab.checked , "url": url.value, "show": show.checked};
    if (logToConsole) console.log("New search engine: " + id + "\n" + JSON.stringify(searchEngines[id]));

    let lineItem = createLineItem(id, searchEngines[id]);
    divSearchEngines.appendChild(lineItem);
    
    sendMessage("addNewSearchEngine", {"id": id, "searchEngine": searchEngines[id]});
    notify(notifySearchEngineAdded);
    
    // Clear HTML input fields to add a search engine
    clear();
}

function clear() {
    // Clear check boxes and text box entries of the line used to add a search engine
    show.checked = true;
    name.value = null;
    keyword.value = null;
    multitab.checked = false;
    url.value = null;
}

function onGot(data) {
    if (logToConsole) console.log(data);
    let options = data.options;
    if (logToConsole) console.log(options);
    delete data.options;
    listSearchEngines(data);
    switch (options.tabMode) {
        case "openNewTab":
            openNewTab.checked = true;
            active.style.visibility = "visible";
            break;
        case "sameTab":
            sameTab.checked = true;
            active.style.visibility = "hidden";
            break;
        case "openNewWindow":
            openNewWindow.checked = true;
            active.style.visibility = "visible";
            break;
        default:
            openNewTab.checked = true;
            active.style.visibility = "visible";
            break;
    }

    if (options.tabActive === true) {
        tabActive.checked = true;
    } else {
		// Default value for tabActive is false
        tabActive.checked = false;
    }

    if (options.optionsMenuLocation === "top" || options.optionsMenuLocation === "bottom" || options.optionsMenuLocation === "none") {
		optionsMenuLocation.value = options.optionsMenuLocation;
    } else {
        // Default value for optionsMenuLocation is bottom
		optionsMenuLocation.value = "bottom";
    }

    if (options.favicons === false) {
        getFavicons.checked = false;
    } else {
        // Default setting is to fetch favicons for context menu list
        getFavicons.checked = true;
    } 

    if (options.cacheFavicons === false){
        cacheFavicons.checked = false;
    } else {
        // Default setting is to cache favicons in storage sync
        cacheFavicons.checked = true;
    }
    
}

// Restore the list of search engines to be displayed in the context menu from the local storage
function restoreOptions() {
    browser.storage.sync.get(null).then(onGot, onError);
}

function saveToLocalDisk() {
    saveOptions();
    let fileToDownload = new Blob([JSON.stringify(searchEngines, null, 2)], {
        type: "text/json",
        name: "searchEngines.json"
    });
    
    sendMessage("save", window.URL.createObjectURL(fileToDownload));
}

function handleFileUpload() {
    browser.storage.sync.clear().then(function() {
        let upload = document.getElementById("upload");
        let jsonFile = upload.files[0];
        let reader = new FileReader();
        reader.onload = function(event) {
            searchEngines = JSON.parse(event.target.result);
            listSearchEngines(searchEngines);
            saveOptions();
        };
        reader.readAsText(jsonFile);
    }, onError);
}

function updateTabMode() {
    if (sameTab.checked) {
        active.style.visibility = "hidden";
    } else {
        active.style.visibility = "visible";
    }

    let data = {};
	data["tabMode"] = document.querySelector('input[name="results"]:checked').value;
	data["tabActive"] = tabActive.checked;
	sendMessage("updateTabMode", data);
}

function updateCacheFavicons() {
	let cf = cacheFavicons.checked;
	sendMessage("updateCacheFavicons", {"cacheFavicons": cf});
}

function updateGetFavicons() {
    let fav = getFavicons.checked;
	sendMessage("updateGetFavicons", {"favicons": fav});
}

function updateOptionsMenuLocation() {
    let omat = optionsMenuLocation.value;
	sendMessage("updateOptionsMenuLocation", {"optionsMenuLocation": omat});
}

function isValidUrl(url) {
    try {
        (new URL(url));
        return true;
    }
    catch (e) {
        // Malformed URL
        return false;
    }
}

function handleStorageChange(changes, area) {
    if (area !== "sync") return;
    let ids = Object.keys(changes);
    for (let id of ids) {
        if (id === "options") {
            continue;    
        } else {
            searchEngines[id] = changes[id].newValue;
        }
    }
    listSearchEngines(searchEngines);
}

function i18n() {
    translateContent("data-i18n", "textContent");
    translateContent("data-i18n-placeholder", "placeholder");
    translateContent("data-i18n-title", "title");
}

function translateContent(attribute, type) {
    let i18nElements = document.querySelectorAll('[' + attribute + ']');

    for (let i in i18nElements) {
        try {
            if (i18nElements[i].getAttribute == null) continue;
            let i18n_attrib = i18nElements[i].getAttribute(attribute);
            let message = browser.i18n.getMessage(i18n_attrib);
            switch (type) {
                case "textContent": 
                    i18nElements[i].textContent = message; 
                    break;
                case "placeholder": 
                    i18nElements[i].placeholder = message; 
                    break;
                case "title": 
                    i18nElements[i].title = message; 
                    break;
                default: 
                    break;
            }
        } catch(ex) {
            console.error("i18n id " + IDS[id] + " not found");
        }
    }
}

i18n();