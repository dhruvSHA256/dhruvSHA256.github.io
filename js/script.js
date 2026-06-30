(function() {
    "use strict";

    const root = document.documentElement;
    const storageKey = "theme";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    function configuredTheme() {
        const theme = root.dataset.theme;
        return theme === "dark" || theme === "light" ? theme : "system";
    }

    function storedTheme() {
        const theme = localStorage.getItem(storageKey);
        return theme === "dark" || theme === "light" ? theme : null;
    }

    function effectiveTheme() {
        const theme = storedTheme() || configuredTheme();
        if (theme === "dark" || theme === "light") return theme;
        return prefersDark.matches ? "dark" : "light";
    }

    function applyTheme(theme) {
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        localStorage.setItem(storageKey, theme);
        updateToggle(theme);
        updateCodeTheme(theme);
        window.updateGiscusTheme();
    }

    function updateToggle(theme) {
        const button = document.querySelector(".theme-toggle");
        if (!button) return;

        const nextTheme = theme === "dark" ? "light" : "dark";
        button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
        button.setAttribute("title", `Switch to ${nextTheme} theme`);
    }

    function updateCodeTheme(theme) {
        const light = document.getElementById("giallo-light");
        const dark = document.getElementById("giallo-dark");
        if (!light || !dark) return;

        light.disabled = theme === "dark";
        dark.disabled = theme !== "dark";
    }

    window.getCurrentTheme = effectiveTheme;

    window.getSystemCommentTheme = function() {
        const config = window.giscusConfig || {};
        return effectiveTheme() === "dark"
            ? config.darkTheme || "noborder_dark"
            : config.lightTheme || "noborder_light";
    };

    window.updateGiscusTheme = function() {
        const iframe = document.querySelector("iframe.giscus-frame");
        if (!iframe) return;

        iframe.contentWindow.postMessage(
            { giscus: { setConfig: { theme: window.getSystemCommentTheme() } } },
            "https://giscus.app"
        );
    };

    root.dataset.theme = effectiveTheme();
    root.style.colorScheme = root.dataset.theme;
    updateCodeTheme(root.dataset.theme);

    document.addEventListener("DOMContentLoaded", () => {
        updateToggle(effectiveTheme());
        updateCodeTheme(effectiveTheme());

        const button = document.querySelector(".theme-toggle");
        if (button) {
            button.addEventListener("click", () => {
                applyTheme(effectiveTheme() === "dark" ? "light" : "dark");
                document.body.dispatchEvent(new CustomEvent("theme-changed"));
            });
        }
    });

    prefersDark.addEventListener("change", () => {
        if (storedTheme()) return;
        root.dataset.theme = effectiveTheme();
        root.style.colorScheme = root.dataset.theme;
        updateToggle(effectiveTheme());
        updateCodeTheme(effectiveTheme());
        window.updateGiscusTheme();
        document.body.dispatchEvent(new CustomEvent("theme-changed"));
    });
})();
