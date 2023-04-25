"use strict";

const DEFAULT_EXTENSION_STATUS = true;
const DEFAULT_ME = "Iron Man";
const DEFAULT_CONNECTION_MESSAGE =
    "Hi @name, I recently came across the Software Developer position at @company." +
    "My background of 10+ years in software engineering aligns perfectly with what you're looking for, " +
    "and I'd love to be considered as a candidate. Any advice you can offer would be greatly appreciated." +
    "Thank you! @me";

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isExtensionOn: DEFAULT_EXTENSION_STATUS });
    chrome.storage.local.set({ me: DEFAULT_ME });
    chrome.storage.local.set({ connectionMessage: DEFAULT_CONNECTION_MESSAGE });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!isWebPageReady(changeInfo, tab) || !(await isExtensionTurnedOn())) {
        return;
    }

    isConnectionPage(tab) ? showFloater(tabId) : hideFloater(tabId);
});

const linkedinURL = "https://www.linkedin.com/";

function isWebPageReady(changeInfo, tab) {
    if (!tab.url || !tab.url.startsWith(linkedinURL)) {
        return false;
    }

    if (tab.status !== "complete" || !changeInfo.status) {
        return false;
    }

    return true;
}

async function isExtensionTurnedOn() {
    const { isExtensionOn } = await chrome.storage.local.get(["isExtensionOn"]);

    return isExtensionOn;
}

function showFloater(tabId) {
    chrome.tabs.sendMessage(tabId, {
        type: "SHOW_FLOATER",
    });
}

function hideFloater(tabId) {
    chrome.tabs.sendMessage(tabId, {
        type: "HIDE_FLOATER",
    });
}

const linkedinProfileURL = "https://www.linkedin.com/in/";

function isConnectionPage(tab) {
    return tab.url.startsWith(linkedinProfileURL);
}
