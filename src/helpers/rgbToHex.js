/**
 * @param {string} r
 * @param {string} g
 * @param {string} b
 * @returns {string}
 */
export var rgbToHex = (r, g, b) => {
    /**
     * @param {string} c
     * @returns {string}
     */
    function componentToHex(c) {
        const hex = c.toString(16)

        return hex.length == 1 ? '0' + hex : hex
    }

    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
}
