setupPopupButtons()

// todo maybe create html programmatically from popup class?
function setupPopupButtons() {
    let popups = document.querySelectorAll('.popup')
    for (let i = 0; i < popups.length; i++) {
        let button = popups[i].querySelector('.popup-button')
        let box = popups[i].querySelector('.popup-box')
        let close = popups[i].querySelector('.popup-close')
        button.addEventListener("click", () => {
            box.classList.add("show")
        })
        window.addEventListener("click", (event) => {
            if (event.target == box || event.target == close || event.target.closest("a")) {
                box.classList.remove(
                    "show"
                )
            }
        })
    }
}
