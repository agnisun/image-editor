import { INITIAL_CANVAS_DRAW } from '../constants/canvas'

/**
 * @class
 */
export class Draw {
    /**
     * @type {boolean}
     * @private
     */
    #isDrawing = false
    /**
     * @type {number}
     * @public
     */
    canvasDrawSize = INITIAL_CANVAS_DRAW

    /**
     * @constructor
     */
    constructor() {}

    /**
     * @param {number} clientX
     * @param {number} clientY
     * @param {import("./editor").Ref} refs
     */
    #getOriginalCrds(clientX, clientY, { crds, scale }) {
        return [(clientX - crds[0]) / scale, (clientY - crds[1]) / scale]
    }

    /**
     * @param {import("./editor").Ref} refs
     */
    initCanvasDraw(refs) {
        var { canvasDraw, scale } = refs
        var newSize = this.canvasDrawSize * scale
        var lineWidth = 2

        canvasDraw.element.width = newSize
        canvasDraw.element.height = newSize

        var halfWidth = canvasDraw.element.width / 2
        var halfHeight = canvasDraw.element.height / 2

        canvasDraw.context.lineWidth = lineWidth * scale
        canvasDraw.context.strokeStyle = '#D0D5DD'

        canvasDraw.context.clearRect(0, 0, canvasDraw.element.width, canvasDraw.element.height)
        canvasDraw.context.beginPath()
        canvasDraw.context.arc(halfWidth, halfHeight, halfWidth - scale, 0, Math.PI * 2)
        canvasDraw.context.closePath()
        canvasDraw.context.stroke()
    }

    /**
     * @param {number} clientX
     * @param {number} clientY
     * @param {import("./editor").Ref} refs
     */
    #draw(clientX, clientY, refs) {
        var { originalCanvas, color } = refs
        var [originalX, originalY] = this.#getOriginalCrds(clientX, clientY, refs)

        originalCanvas.context.lineWidth = this.canvasDrawSize
        originalCanvas.context.strokeStyle = color
        originalCanvas.context.lineCap = 'round'
        originalCanvas.context.lineJoin = 'round'

        originalCanvas.context.lineTo(originalX, originalY)
        originalCanvas.context.stroke()
    }

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     * @param {() => void} drawImage
     */
    onMouseDown(event, refs, drawImage) {
        var { originalCanvas } = refs
        var [originalX, originalY] = this.#getOriginalCrds(event.clientX, event.clientY, refs)

        this.#isDrawing = true

        originalCanvas.context.beginPath()
        originalCanvas.context.moveTo(originalX, originalY)

        this.#draw(event.clientX, event.clientY, refs)
        drawImage()
    }

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     */
    onMouseUp(_event, { originalCanvas }) {
        originalCanvas.context.closePath()

        this.#isDrawing = false
    }

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     * @param {() => void} drawImage
     */
    onMouseMove(event, refs, drawImage) {
        var { canvasDraw } = refs

        canvasDraw.element.style.visibility = 'visible'
        canvasDraw.element.style.top = event.clientY + 'px'
        canvasDraw.element.style.left = event.clientX + 'px'

        if (this.#isDrawing) {
            this.#draw(event.clientX, event.clientY, refs)
            drawImage()
        }
    }
}
