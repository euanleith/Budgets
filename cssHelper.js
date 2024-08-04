let partyColours = {
    FF:'#66BB6',
    FG: '#6699FF',
    GP: '#99CC33',
    SF: '#008800',
    LP: '#CC0000',
    SD: '#752F8B',
    PBP: '#660000',
}

setupPopupButtons()
enumerateCitations()

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

// todo order sources programatically as well?
// todo and order inline citations by number
function enumerateCitations() {
    var citations = document.getElementsByClassName('citation')
    let hrefIds = {}
    let cnt = 1
    for (let i = 0; i < citations.length; i++) {
        let href = citations[i].href
        if (!(href in hrefIds)) hrefIds[href] = cnt++
        citations[i].innerHTML = ('[' + hrefIds[href] + ']').sup()
        // todo idk how to make colours look good and intuitive
//        citations[i].innerHTML='&#9724'.sup()
//        citations[i].style.color = partyColours[citations[i].className.split(' ')[1]]
    }
}

function getPartyColours() {
    let excludeIndices = [0, 2] // only want one colour for FFG; using FG as it's the most distinct
    return Object.values(partyColours).filter((_, i) => !excludeIndices.includes(i))
}