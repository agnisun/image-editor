import { GRAB_SPACE } from '../constants/scale'

/**
 * @class
 */
export class Grab {
    /**
     * @type {number[]}
     * @private
     */
    #grabCrds = [0, 0]
    /**
     * @type {boolean}
     * @private
     */
    #isGrabbing = false

    /**
     * @constructor
     */
    constructor() {}

    /**
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        event.target.style.cursor = 'grabbing'

        this.#isGrabbing = true
        this.#grabCrds = [event.clientX, event.clientY]
    }

    /**
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        event.target.style.cursor = 'grab'

        this.#isGrabbing = false
    }

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     * @param {() => void} drawImage
     */
    onMouseMove(event, { crds, scaledWidth, scaledHeight, canvas }, drawImage) {
        if (!this.#isGrabbing || (scaledWidth < canvas.element.width && scaledHeight < canvas.element.height)) return

        var [initialX, initialY] = this.#grabCrds
        var diffX = scaledWidth < canvas.element.width ? 0 : event.clientX - initialX
        var diffY = scaledHeight < canvas.element.height ? 0 : event.clientY - initialY
        var newX = crds[0] + diffX
        var newY = crds[1] + diffY
        var prevX = crds[0]
        var prevY = crds[1]

        if (scaledWidth >= canvas.element.width) crds[0] = Math.min(GRAB_SPACE, Math.max(newX, canvas.element.width - scaledWidth - GRAB_SPACE))

        if (scaledHeight >= canvas.element.height) crds[1] = Math.min(GRAB_SPACE, Math.max(newY, canvas.element.height - scaledHeight - GRAB_SPACE))

        this.#grabCrds = [event.clientX, event.clientY]

        if (prevX !== newX || prevY !== newY) drawImage()
    }
}
