import { INITIAL_CANVAS_PIPETTE } from '../constants/canvas'
import { rgbToHex } from '../helpers/rgbToHex'

var PALETTE_LINEWIDTH = 2

/**
 * @class
 */
export class Pipette {
    /**
     * @type {boolean}
     * @private
     */
    #isActive = false
    #canvasPipetteSize = INITIAL_CANVAS_PIPETTE

    /**
     * @constructor
     */
    constructor() {}

    /**
     * @param {import("./editor").Ref} refs
     */
    initPipette(refs) {
        var { canvasPipette } = refs
        var x = this.#canvasPipetteSize / 2
        var y = this.#canvasPipetteSize / 2

        canvasPipette.context.clearRect(0, 0, this.#canvasPipetteSize, this.#canvasPipetteSize)
        canvasPipette.context.beginPath()
        canvasPipette.context.moveTo(x, 0)
        canvasPipette.context.lineTo(x, this.#canvasPipetteSize)
        canvasPipette.context.moveTo(0, y)
        canvasPipette.context.lineTo(this.#canvasPipetteSize, y)
        canvasPipette.context.closePath()
        canvasPipette.context.stroke()
    }

    /**
     * @param {import("./editor").Ref} refs
     * @param {string} color
     */
    #setColor(refs, color) {
        var strokeButton = document.getElementById('stroke-button')
        refs.color = color
        strokeButton.style.backgroundColor = color
    }

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     */
    onMouseDown(event, refs) {
        var { canvas } = refs

        this.#isActive = true
        var [r, g, b] = canvas.context.getImageData(event.clientX, event.clientY, 1, 1).data

        this.#setColor(refs, rgbToHex(r, g, b))
    }

    onMouseUp() {
        this.#isActive = false
    }

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     */
    onMouseMove(event, refs) {
        var { canvasPipette, canvas } = refs

        canvasPipette.element.style.visibility = 'visible'
        canvasPipette.element.style.top = event.clientY + 'px'
        canvasPipette.element.style.left = event.clientX + 'px'

        var [r, g, b] = canvas.context.getImageData(event.clientX, event.clientY, 1, 1).data
        var invertedColor = [r, g, b].map((color) => 255 - color)

        canvasPipette.context.lineWidth = PALETTE_LINEWIDTH
        canvasPipette.context.strokeStyle = rgbToHex(...invertedColor)

        this.initPipette(refs)

        if (this.#isActive) {
            this.#setColor(refs, rgbToHex(r, g, b))
        }
    }
}
