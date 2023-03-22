
document.addEventListener("DOMContentLoaded", () => {
    browser.storage.sync.get("hideIncompleteData").then(result => {
        console.log(result);
        document.getElementById("hideIncompleteData").setAttribute("aria-pressed", result.hideIncompleteData && true);
    });

    document.getElementById("options").addEventListener("submit", () => {
        const hideIncompleteData = document.getElementById("hideIncompleteData").getAttribute("aria-pressed") === "true";
        browser.storage.sync.set({ hideIncompleteData });
    });

    Array.from(document.querySelectorAll(".toggle-button")).forEach(btn => btn.addEventListener("click", e => {
        const newValue = !(e.target.getAttribute("aria-pressed") === "true");
        e.target.setAttribute("aria-pressed", newValue);

        browser.storage.sync.set({ [e.target.id]: newValue });
    }));
})
