var CropPosition = {
    TOP_MID: 0,
    BOTTOM_MID: 1,
    LEFT_TOP: 2,
    LEFT_MID: 3,
    LEFT_BOTTOM: 4,
    RIGHT_TOP: 5,
    RIGHT_MID: 6,
    RIGHT_BOTTOM: 7,
    MOVE: 8,
}
var MIN_CROP_SPACE = 50
var INITIAL_RECT_LINE_SIZE = 15

/**
 * @class
 */
export class Crop {
    /**
     * @type {number}
     * @private
     */
    #position = CropPosition.MOVE
    /**
     * @type {boolean}
     * @private
     */
    #isActive = false
    /**
     * @type {number[][]|null}
     * @public
     */
    cropCrds = null
    /**
     * @type {number[]}
     * @private
     */
    #cropMouseCrds = [0, 0]

    /**
     * @constructor
     */
    constructor() {}

    /**
     * @param {import("./editor").Ref} refs
     */
    drawCrop(refs) {
        requestAnimationFrame(() => {
            var { canvas, scale, crds } = refs
            var lineWidth = 1
            var [topLeft, bottomRight] = this.cropCrds.map(([x, y]) => [x * scale + crds[0], y * scale + crds[1]])
            var cropWidthHalf = (bottomRight[0] - topLeft[0]) / 2
            var cropHeightHalf = (bottomRight[1] - topLeft[1]) / 2

            canvas.context.strokeStyle = '#D0D5DD'
            canvas.context.lineWidth = lineWidth
            canvas.context.beginPath()
            canvas.context.moveTo(topLeft[0], topLeft[1])
            canvas.context.lineTo(bottomRight[0], topLeft[1])
            canvas.context.lineTo(bottomRight[0], bottomRight[1])
            canvas.context.lineTo(topLeft[0], bottomRight[1])
            canvas.context.closePath()
            canvas.context.stroke()

            var rectLinewWidth = 3
            var rectLineSize = INITIAL_RECT_LINE_SIZE

            canvas.context.lineWidth = rectLinewWidth
            canvas.context.beginPath()

            if (topLeft[0] + rectLineSize >= topLeft[0] + cropWidthHalf - rectLineSize) {
                canvas.context.moveTo(topLeft[0], topLeft[1])
                canvas.context.lineTo(bottomRight[0], topLeft[1])

                canvas.context.moveTo(topLeft[0], bottomRight[1])
                canvas.context.lineTo(bottomRight[0], bottomRight[1])
            } else {
                canvas.context.moveTo(topLeft[0], topLeft[1])
                canvas.context.lineTo(topLeft[0] + rectLineSize, topLeft[1])

                canvas.context.moveTo(bottomRight[0], topLeft[1])
                canvas.context.lineTo(bottomRight[0] - rectLineSize, topLeft[1])

                canvas.context.moveTo(topLeft[0] + cropWidthHalf - rectLineSize, topLeft[1])
                canvas.context.lineTo(topLeft[0] + cropWidthHalf + rectLineSize, topLeft[1])

                canvas.context.moveTo(topLeft[0], bottomRight[1])
                canvas.context.lineTo(topLeft[0] + rectLineSize, bottomRight[1])

                canvas.context.moveTo(bottomRight[0], bottomRight[1])
                canvas.context.lineTo(bottomRight[0] - rectLineSize, bottomRight[1])

                canvas.context.moveTo(topLeft[0] + cropWidthHalf - rectLineSize, bottomRight[1])
                canvas.context.lineTo(topLeft[0] + cropWidthHalf + rectLineSize, bottomRight[1])
            }

            if (topLeft[1] + rectLineSize >= topLeft[1] + cropHeightHalf - rectLineSize) {
                canvas.context.moveTo(topLeft[0], topLeft[1])
                canvas.context.lineTo(topLeft[0], bottomRight[1])

                canvas.context.moveTo(bottomRight[0], topLeft[1])
                canvas.context.lineTo(bottomRight[0], bottomRight[1])
            } else {
                canvas.context.moveTo(topLeft[0], topLeft[1])
                canvas.context.lineTo(topLeft[0], topLeft[1] + rectLineSize)

                canvas.context.moveTo(bottomRight[0], topLeft[1])
                canvas.context.lineTo(bottomRight[0], topLeft[1] + rectLineSize)

                canvas.context.moveTo(topLeft[0], bottomRight[1])
                canvas.context.lineTo(topLeft[0], bottomRight[1] - rectLineSize)

                canvas.context.moveTo(bottomRight[0], bottomRight[1])
                canvas.context.lineTo(bottomRight[0], bottomRight[1] - rectLineSize)

                canvas.context.moveTo(topLeft[0], topLeft[1] + cropHeightHalf - rectLineSize)
                canvas.context.lineTo(topLeft[0], topLeft[1] + cropHeightHalf + rectLineSize)

                canvas.context.moveTo(bottomRight[0], topLeft[1] + cropHeightHalf - rectLineSize)
                canvas.context.lineTo(bottomRight[0], topLeft[1] + cropHeightHalf + rectLineSize)
            }

            canvas.context.closePath()
            canvas.context.stroke()
        })
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {import("./editor").Ref} refs
     * @param {() => void} drawImage
     */
    #cropResize(x, y, refs, drawImage) {
        var { scale, originalCanvas } = refs
        var [initialX, initialY] = this.#cropMouseCrds
        var [topLeft, bottomRight] = this.cropCrds
        var diffX = (x - initialX) / scale
        var diffY = (y - initialY) / scale
        var minCropWidth = MIN_CROP_SPACE / scale

        var updateLeft = () => {
            var newCrd = 0

            if (diffX < 0) newCrd = Math.max(topLeft[0] + diffX, 0)
            else newCrd = Math.min(topLeft[0] + diffX, bottomRight[0] - minCropWidth)

            topLeft[0] = newCrd
        }

        const updateRight = () => {
            var newCrd = 0

            if (diffX < 0) newCrd = Math.max(bottomRight[0] + diffX, topLeft[0] + minCropWidth)
            else newCrd = Math.min(bottomRight[0] + diffX, originalCanvas.element.width)

            bottomRight[0] = newCrd
        }

        const updateTop = () => {
            var newCrd = 0

            if (diffY < 0) newCrd = Math.max(topLeft[1] + diffY, 0)
            else newCrd = Math.min(topLeft[1] + diffY, bottomRight[1] - minCropWidth)

            topLeft[1] = newCrd
        }

        const updateBottom = () => {
            var newCrd = 0

            if (diffY < 0) newCrd = Math.max(bottomRight[1] + diffY, topLeft[1] + minCropWidth)
            else newCrd = Math.min(bottomRight[1] + diffY, originalCanvas.element.height)

            bottomRight[1] = newCrd
        }

        switch (this.#position) {
            case CropPosition.LEFT_MID: {
                updateLeft()
                break
            }
            case CropPosition.RIGHT_MID: {
                updateRight()
                break
            }
            case CropPosition.TOP_MID: {
                updateTop()
                break
            }
            case CropPosition.BOTTOM_MID: {
                updateBottom()
                break
            }
            case CropPosition.LEFT_TOP: {
                updateLeft()
                updateTop()
                break
            }
            case CropPosition.RIGHT_TOP: {
                updateRight()
                updateTop()
                break
            }
            case CropPosition.LEFT_BOTTOM: {
                updateLeft()
                updateBottom()
                break
            }
            case CropPosition.RIGHT_BOTTOM: {
                updateRight()
                updateBottom()
                break
            }
            case CropPosition.MOVE: {
                var newLeft = topLeft[0] + diffX
                var newRight = bottomRight[0] + diffX
                var newTop = topLeft[1] + diffY
                var newBottom = bottomRight[1] + diffY

                if (newRight < originalCanvas.element.width && newLeft > 0) {
                    topLeft[0] = newLeft
                }

                if (newLeft > 0 && newRight < originalCanvas.element.width) {
                    bottomRight[0] = newRight
                }

                if (newBottom < originalCanvas.element.height && newTop > 0) {
                    topLeft[1] = newTop
                }

                if (newTop > 0 && newBottom < originalCanvas.element.height) {
                    bottomRight[1] = newBottom
                }
                break
            }
            default:
                break
        }

        this.#cropMouseCrds = [x, y]
        drawImage()
        this.drawCrop(refs)
    }

    /**
     * @param {import("./editor").Ref} refs
     */
    initCrop(refs) {
        var { originalCanvas } = refs

        this.cropCrds = [
            [0, 0],
            [originalCanvas.element.width, originalCanvas.element.height],
        ]

        this.drawCrop(refs)
    }

    /**
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        event.preventDefault()

        this.#isActive = true
        this.#cropMouseCrds = [event.clientX, event.clientY]
    }

    onMouseUp() {
        this.#isActive = false
        this.#cropMouseCrds.current = [0, 0]
    }

    /**
     * @param {MouseEvent} event
     * @param {import("./editor").Ref} refs
     * @param {() => void} drawImage
     */
    onMouseMove(event, refs, drawImage) {
        var { clientX, clientY } = event

        if (this.#isActive) {
            this.#cropResize(clientX, clientY, refs, drawImage)
            return
        }

        var { canvas, scale, crds } = refs
        var [topLeft, bottomRight] = this.cropCrds.map(([x, y]) => [x * scale + crds[0], y * scale + crds[1]])
        var cursor = ''

        if (clientX <= topLeft[0] && clientY <= topLeft[1]) {
            cursor = 'nwse-resize'
            this.#position = CropPosition.LEFT_TOP
        } else if (clientX >= bottomRight[0] && clientY <= topLeft[1]) {
            cursor = 'nesw-resize'
            this.#position = CropPosition.RIGHT_TOP
        } else if (clientX <= topLeft[0] && clientY >= bottomRight[1]) {
            cursor = 'nesw-resize'
            this.#position = CropPosition.LEFT_BOTTOM
        } else if (clientX >= bottomRight[0] && clientY >= bottomRight[1]) {
            cursor = 'nwse-resize'
            this.#position = CropPosition.RIGHT_BOTTOM
        } else if (clientX <= topLeft[0] && clientY >= topLeft[1] && clientY <= bottomRight[1]) {
            cursor = 'ew-resize'
            this.#position = CropPosition.LEFT_MID
        } else if (clientX >= bottomRight[0] && clientY >= topLeft[1] && clientY <= bottomRight[1]) {
            cursor = 'ew-resize'
            this.#position = CropPosition.RIGHT_MID
        } else if (clientX >= topLeft[0] && clientX <= bottomRight[0] && clientY <= topLeft[1]) {
            cursor = 'ns-resize'
            this.#position = CropPosition.TOP_MID
        } else if (clientX >= topLeft[0] && clientX <= bottomRight[0] && clientY >= bottomRight[1]) {
            cursor = 'ns-resize'
            this.#position = CropPosition.BOTTOM_MID
        } else {
            cursor = 'move'
            this.#position = CropPosition.MOVE
        }

        canvas.element.style.cursor = cursor
    }
}
