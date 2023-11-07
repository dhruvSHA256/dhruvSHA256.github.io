const setTheme = (theme) => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
    if (theme == "dark") {
        document.body?.dispatchEvent(new CustomEvent("dark-theme-set"));
        changeGiscusTheme("noborder_dark");
    } else {
        document.body?.dispatchEvent(new CustomEvent("light-theme-set"));
        changeGiscusTheme("noborder_light");
    }
};

const hasCodeRun = localStorage.getItem("hasCodeRun");

if (!hasCodeRun) {
    const defaultTheme = "dark";
    setTheme(defaultTheme);
    localStorage.setItem("hasCodeRun", "true");
}

const getTheme = () => {
    const theme = localStorage.getItem("theme");
    if (theme) {
        setTheme(theme);
    }
};

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

function handleGiscusMessage(event) {
    if (event.origin !== "https://giscus.app") return;
    if (!(typeof event.data === "object" && event.data.giscus)) return;
    let globalColorMode =
        localStorage.getItem("theme") == "dark"
            ? "noborder_dark"
            : "noborder_light";
    changeGiscusTheme(globalColorMode);
}

window.addEventListener("message", handleGiscusMessage);

getTheme();
