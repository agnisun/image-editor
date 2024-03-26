/**
 * @param {string} tag
 * @param {string[]} classTokens
 * @param {string} textContent
 */
export var createElement = function (tag, classTokens, textContent) {
    var elem = document.createElement(tag)
    elem.classList.add(...classTokens)

    if (textContent) elem.textContent = textContent

    return elem
}
