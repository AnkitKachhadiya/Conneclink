(function () {
    "use strict";

    chrome.runtime.onMessage.addListener(
        async (message, sender, sendResponse) => {
            switch (message.type) {
                case "SHOW_FLOATER":
                    isFloaterPresent() ? showFloater() : await loadFloater();
                    await composeInvitationMessage();
                    showConnectionMessage();
                    showCharacterCount();
                    break;
                case "HIDE_FLOATER":
                    hideFloater();
                    break;
                default:
                    console.log("default", message);
            }
        }
    );

    window.addEventListener(
        "message",
        async (event) => {
            const TARGET_ORIGIN = "https://www.linkedin.com";

            if (event.source !== window && event.origin !== TARGET_ORIGIN) {
                return;
            }

            composedInvitationMessage = event.data.message;
            await sendConnectionRequest();
        },
        false
    );

    async function loadFloater() {
        await delayFor(2000);

        const wrapper = document.createElement("div");
        wrapper.setAttribute("id", "conneclink");
        document.body.appendChild(wrapper);

        const host = document.querySelector("#conneclink");
        const root = host.attachShadow({ mode: "open" });

        root.appendChild(await getPopupStyle());
        root.appendChild(await getPopupHtml());
        root.appendChild(getPopupScript());
    }

    async function getPopupStyle() {
        const popupCss = chrome.runtime.getURL("popup.css");
        const cssResponse = await fetch(popupCss);
        const css = await cssResponse.text();

        const style = document.createElement("style");
        style.textContent = css;

        return style;
    }

    async function getPopupHtml() {
        const popupHtml = chrome.runtime.getURL("popup.html");
        const htmlResponse = await fetch(popupHtml);
        const html = await htmlResponse.text();

        const htmlMediator = document.createElement("div");
        htmlMediator.setAttribute("id", "head");
        htmlMediator.innerHTML = html.trim();

        return htmlMediator;
    }

    function getPopupScript() {
        const popupJs = chrome.runtime.getURL("popup.js");

        const script = document.createElement("script");
        script.src = popupJs;

        return script;
    }

    let composedInvitationMessage;

    const RECEIVER_NAME_TAG = "@name";
    const MY_NAME_TAG = "@me";
    const RECEIVER_LATEST_COMPANY_NAME_TAG = "@company";

    async function composeInvitationMessage() {
        let { connectionMessage } = await chrome.storage.local.get([
            "connectionMessage",
        ]);

        const { me } = await chrome.storage.local.get(["me"]);

        connectionMessage = connectionMessage.replace(
            RECEIVER_NAME_TAG,
            getFirstName()
        );
        connectionMessage = connectionMessage.replace(MY_NAME_TAG, me);
        connectionMessage = connectionMessage.replace(
            RECEIVER_LATEST_COMPANY_NAME_TAG,
            getCompanyName()
        );

        composedInvitationMessage = connectionMessage;
    }

    function getFirstName() {
        const connectingToName = document.querySelector(
            ".mt2 > .pv-text-details__left-panel > div > h1"
        )?.textContent;

        if (!connectingToName) {
            return "";
        }

        const [firstName] = connectingToName.split(" ");

        return firstName;
    }

    function getCompanyName() {
        const companyNameWrapper = document.querySelector(
            "ul.pv-text-details__right-panel > li"
        );

        if (!companyNameWrapper) {
            return "";
        }

        return getTextFromHtml(companyNameWrapper);
    }

    function showConnectionMessage() {
        const shadowDocument = document.querySelector("#conneclink").shadowRoot;

        shadowDocument.getElementById("final-connection-message").value =
            composedInvitationMessage;
    }

    function showCharacterCount() {
        const shadowDocument = document.querySelector("#conneclink").shadowRoot;

        const characterCountSpan =
            shadowDocument.querySelector("#character-count");

        characterCountSpan.innerText = composedInvitationMessage.length;
    }

    let ctaWrapperElement;
    let canInviteDirectly = false;
    async function sendConnectionRequest() {
        try {
            initializeCtaWrapper();

            findAndClickConnectButton();

            await checkInvitationModalVisible();

            checkDirectInvitationPresent();

            if (!canInviteDirectly) {
                await reachInvitationModal();
            }

            findAndClickAddANoteButton();

            await delayFor(1000);

            fillInvitationNote();
        } catch (error) {
            console.log(error);
        }
    }

    function initializeCtaWrapper() {
        ctaWrapperElement = document.querySelector(".pvs-profile-actions");

        if (!ctaWrapperElement) {
            throw "CTA wrapper element not found.";
        }
    }

    function findAndClickConnectButton() {
        isConnectWordPresentInCtaWrapperElement();

        isConnectButtonVisible()
            ? clickConnectButton()
            : clickConnectButtonFromDropdown();
    }

    function isConnectWordPresentInCtaWrapperElement() {
        if (!hasSearchStringText(ctaWrapperElement, "connect")) {
            throw "Connect button not found in CTA wrapper element.";
        }
    }

    function isConnectButtonVisible() {
        const ctaActions = ctaWrapperElement.children;

        for (const action of ctaActions) {
            if (getTextFromHtmlLowerCase(action) === "connect") {
                return true;
            }
        }

        return false;
    }

    function hasSearchStringText(element, searchString) {
        const text = getTextFromHtmlLowerCase(element);

        return text.search(new RegExp(`\\b${searchString}\\b`, "g")) >= 0;
    }

    function getTextFromHtmlLowerCase(html) {
        return getTextFromHtml(html).toLowerCase();
    }

    function getTextFromHtml(html) {
        return html.textContent.replace(/\n/g, "").replace(/\s+/g, " ").trim();
    }

    function clickConnectButton() {
        const [connectButton] = document.querySelector(
            ".pvs-profile-actions > .pvs-profile-actions__action"
        ).children;

        connectButton.click();
    }

    function clickConnectButtonFromDropdown() {
        const moreButtonOptions = document.querySelector(
            ".pvs-profile-actions > .artdeco-dropdown > .artdeco-dropdown__content > .artdeco-dropdown__content-inner > ul"
        ).children;

        if (!moreButtonOptions) {
            throw "More options dropdown does not have options.";
        }

        for (const option of moreButtonOptions) {
            if (hasSearchStringText(option, "connect")) {
                const [connectOption] = option.children;
                connectOption.click();
                return;
            }
        }
    }

    async function checkInvitationModalVisible() {
        await delayFor(1000);

        const invitationModalContent = document.querySelector(
            "#artdeco-modal-outlet"
        ).textContent;

        if (
            !invitationModalContent ||
            invitationModalContent.trim().length < 1
        ) {
            throw "Invitation modal not visible.";
        }
    }

    function delayFor(microseconds) {
        return new Promise((resolve) => setTimeout(resolve, microseconds));
    }

    function checkDirectInvitationPresent() {
        const modalActionBarWrapper = document.querySelector(
            ".artdeco-modal__actionbar"
        );

        canInviteDirectly = hasSearchStringText(
            modalActionBarWrapper,
            "add a note"
        );
    }

    function findAndClickAddANoteButton() {
        const modalActionBarButtons = document.querySelector(
            ".artdeco-modal__actionbar"
        ).children;

        if (!modalActionBarButtons) {
            throw "Modal action bar buttons not found.";
        }

        for (const button of modalActionBarButtons) {
            if (hasSearchStringText(button, "add a note")) {
                button.click();
                return;
            }
        }
    }

    async function reachInvitationModal() {
        chooseRememberOption();

        clickConnectButtonToMoveForward();
        await delayFor(1000);

        clickConnectButtonToMoveForward();
        await delayFor(1000);
    }

    function fillInvitationNote() {
        document.getElementById("custom-message").value =
            composedInvitationMessage;

        let event = new Event("change");
        document.getElementById("custom-message").dispatchEvent(event);
    }

    const rememberOptionToSelect = "we don't know each other";
    function chooseRememberOption() {
        const rememberOptions = document.querySelector(
            ".artdeco-modal__content > .artdeco-pill-choice-group"
        ).children;

        if (!rememberOptions) {
            throw "Remember options not found.";
        }

        for (const option of rememberOptions) {
            if (hasSearchStringText(option, rememberOptionToSelect)) {
                option.click();
                return;
            }
        }
    }

    function clickConnectButtonToMoveForward() {
        const modalActionBarButtons = document.querySelector(
            ".artdeco-modal__actionbar"
        ).children;

        if (!modalActionBarButtons) {
            throw "Modal action bar buttons not found.";
        }

        for (const button of modalActionBarButtons) {
            if (hasSearchStringText(button, "connect")) {
                button.click();
                return;
            }
        }
    }

    function isFloaterPresent() {
        return !!document.querySelector("#conneclink");
    }

    function hideFloater() {
        if (isFloaterPresent()) {
            document.querySelector("#conneclink").style.display = "none";
        }
    }

    function showFloater() {
        document.querySelector("#conneclink").style.display = "block";
    }
})();
