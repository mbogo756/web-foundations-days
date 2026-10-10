const noteText = document.querySelector("#note-text");
const characterCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearButton = document.querySelector("#clear-btn");
const darkThemeButton = document.querySelector("#theme-toggle");


function updateCounts() {
    const text = noteText.value;
    const trimmedText = text.trim();
    const words = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

    characterCount.textContent = `${text.length} / 200 characters`;
    wordCount.textContent = `${words} words`;

    characterCount.classList.toggle(
        "warning",
        text.length > 180 && text.length <= 200
    );
    characterCount.classList.toggle("over", text.length > 200);
}

noteText.value = localStorage.getItem("draft") || "";
updateCounts();


const savedTheme = localStorage.getItem("theme");
const isDark = savedTheme === "dark";

document.body.classList.toggle("dark", isDark);
darkThemeButton.textContent = isDark ? "Light mode" : "Dark mode";

noteText.addEventListener("input", () => {
    updateCounts();
    localStorage.setItem("draft", noteText.value);
});


function clearNote(){
    noteText.value = "";
    localStorage.removeItem("draft");
    updateCounts();
}

clearButton.addEventListener("click", clearNote);

noteText.addEventListener("keydown",(event) => {
    if(event.key === "Escape"){
        clearNote();
    }
});

darkThemeButton.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");

    darkThemeButton.textContent = isDark ? "Light mode" : "Dark mode";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});
