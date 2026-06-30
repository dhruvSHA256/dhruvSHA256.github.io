(function(window) {
    "use strict";

    const selector = ".mermaid";
    function mermaidTheme() {
        return window.getCurrentTheme && window.getCurrentTheme() === "dark" ? "dark" : "default";
    }

    function saveOriginalCode() {
        document.querySelectorAll(selector).forEach((element) => {
            if (!element.dataset.originalCode) {
                element.dataset.originalCode = element.textContent;
            }
        });
    }

    function resetDiagrams() {
        document.querySelectorAll(selector).forEach((element) => {
            if (element.dataset.originalCode) {
                element.removeAttribute("data-processed");
                element.textContent = element.dataset.originalCode;
            }
        });
    }

    function renderDiagrams() {
        if (!window.mermaid) return;
        window.mermaid.initialize({ startOnLoad: false, theme: mermaidTheme() });
        window.mermaid.init(undefined, document.querySelectorAll(selector));
    }

    window.initMermaid = function() {
        saveOriginalCode();
        renderDiagrams();
        document.body.addEventListener("theme-changed", () => {
            resetDiagrams();
            renderDiagrams();
        });
    };
})(window);
