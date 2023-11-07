// https://github.com/mermaid-js/mermaid/issues/1945
function setTheme(theme) {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
        document.body.dispatchEvent(new CustomEvent("dark-theme-set"));
        changeGiscusTheme("noborder_dark");
    } else {
        document.body.dispatchEvent(new CustomEvent("light-theme-set"));
        changeGiscusTheme("noborder_light");
    }
}

function modeSwitcher(theme) {
    if (theme == "dark") {
        setTheme("dark");
    } else {
        setTheme("light");
    }
}

const hasCodeRun = localStorage.getItem("hasCodeRun");

if (!hasCodeRun) {
    const defaultTheme = document.getElementsByTagName("head").className;
    setTheme(defaultTheme);
    localStorage.setItem("hasCodeRun", "true");
}

const getTheme = () => {
    const theme = localStorage.getItem("theme");
    if (theme) {
        setTheme(theme);
    }
};

// https://github.com/giscus/giscus/issues/336#issuecomment-1007922777
function changeGiscusTheme(theme) {
    function sendMessage(message) {
        const iframe = document.querySelector("iframe.giscus-frame");
        if (!iframe) return;
        iframe.contentWindow.postMessage({ giscus: message }, "https://giscus.app");
    }
    sendMessage({
        setConfig: {
            theme: theme,
        },
    });
}

const globalColorMode =
    document.getElementsByTagName("head").className == "dark"
        ? "noborder_dark"
        : "noborder_light";
function handleGiscusMessage(event) {
    if (event.origin !== "https://giscus.app") return;
    if (!(typeof event.data === "object" && event.data.giscus)) return;
    changeGiscusTheme(globalColorMode);
}

window.addEventListener("message", handleGiscusMessage);

getTheme();
