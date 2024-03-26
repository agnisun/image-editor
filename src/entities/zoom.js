import { MAX_SCALE_RANGE, MIN_SCALE_RANGE } from '../constants/scale'

/**
 * @class
 */
export class Zoom {
    /**
     * @type {string}
     * @public
     */
    mode = 'in'

    /**
     * @constructor
     */
    constructor() {}

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     * @param {(prevScale: number) => void} crdsScale
     * @param {() => void} drawImage
     */
    onMouseDown(event, refs, crdsScale, drawImage) {
        event.preventDefault()
        var { scale, crds, canvas, originalCanvas } = refs
        var scaleDiff = scale > 5 ? 2 : 0.2

        if (this.mode === 'out') scaleDiff *= -1

        refs.scale = Math.min(Math.max(MIN_SCALE_RANGE, Math.round((scale + scaleDiff) * 100) / 100), MAX_SCALE_RANGE)
        refs.scaledWidth = originalCanvas.element.width * refs.scale
        refs.scaledHeight = originalCanvas.element.height * refs.scale

        crds[0] += canvas.element.width / 2 - event.clientX
        crds[1] += canvas.element.height / 2 - event.clientY

        crdsScale(scale)
        drawImage()
    }
}
