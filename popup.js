(function () {
    "use strict";

    const shadowDocument = document.querySelector("#conneclink").shadowRoot;

    const characterCountSpan = shadowDocument.querySelector("#character-count");
    const connectionMessageTextArea = shadowDocument.querySelector(
        "#final-connection-message"
    );
    const sendButton = shadowDocument.querySelector("#send");

    connectionMessageTextArea.addEventListener("keyup", () => {
        updateCharacterCount();
    });

    function updateCharacterCount() {
        characterCountSpan.innerText = connectionMessageTextArea.value.length;
    }

    sendButton.addEventListener("click", async () => {
        sendConnectionMessage();
    });

    const TARGET_ORIGIN = "https://www.linkedin.com";

    function sendConnectionMessage() {
        window.postMessage(
            {
                type: "SEND_REQUEST",
                message: connectionMessageTextArea.value,
            },
            TARGET_ORIGIN
        );
    }
})();
