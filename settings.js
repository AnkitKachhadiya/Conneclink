"use strict";

const saveButton = document.querySelector("#save");
const connectionMessageTextArea = document.querySelector("#connection-message");
const meInput = document.querySelector("#me");
const characterCountSpan = document.querySelector("#character-count");

saveButton.addEventListener("click", () => {
    const connectionMessage = connectionMessageTextArea.value;
    const me = meInput.value;

    chrome.storage.local.set({ connectionMessage: connectionMessage });
    chrome.storage.local.set({ me: me });
    chrome.storage.local.set({ isExtensionOn: getExtensionStatus() });
});

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local
        .get(["connectionMessage", "me", "isExtensionOn"])
        .then(({ connectionMessage, me, isExtensionOn }) => {
            connectionMessageTextArea.value = connectionMessage;
            meInput.value = me;
            changeExtensionStatusOption(isExtensionOn);
            updateCharacterCount();
        });
});

connectionMessageTextArea.addEventListener("keyup", () => {
    updateCharacterCount();
});

function updateCharacterCount() {
    characterCountSpan.innerText = connectionMessageTextArea.value.length;
}

function changeExtensionStatusOption(isOn) {
    document.querySelector(
        `${isOn ? "#extension-on" : "#extension-off"}`
    ).checked = true;
}

function getExtensionStatus() {
    const extensionStatus = document.querySelector(
        'input[name="extension-status"]:checked'
    ).value;

    return extensionStatus === "on";
}
