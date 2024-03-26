import { MAX_SCALE_RANGE, MIN_SCALE_RANGE, GRAB_SPACE } from '../constants/scale'
import { DrawState } from '../constants/drawstate'
import { Grab } from './grab'
import { Draw } from './draw'
import { Zoom } from './zoom'
import { Pipette } from './pipette'
import { Crop } from './crop'

/**
 * @typedef {Object} Canvas
 * @property {(HTMLCanvasElement|null)} element
 * @property {(CanvasRenderingContext2D|null)} context
 */

/**
 * @typedef {Object} Ref
 * @property {number[]} crds
 * @property {number} scale
 * @property {number} scaledWidth
 * @property {number} scaledHeight
 * @property {string} color
 * @property {Canvas} canvasPipette
 * @property {Canvas} canvasDraw
 * @property {Canvas} canvas
 * @property {Canvas} originalCanvas
 */

/**
 * @typedef {Object} ImageInfo
 * @property {string} name
 * @property {string} type
 */

/**
 * @class
 */
export class Editor {
    /**
     * @type {string}
     * @private
     */
    #drawState = DrawState.Default
    #refs = {
        scale: 0,
        color: '#000',
        scaledWidth: 0,
        scaledHeight: 0,
        crds: [0, 0],
        canvas: {
            element: null,
            context: null,
        },
        originalCanvas: {
            element: null,
            context: null,
        },
        canvasDraw: {
            element: null,
            context: null,
        },
        canvasPipette: {
            element: null,
            context: null,
        },
    }
    /**
     * @type {string}
     * @public
     */
    name = ''
    /**
     * @type {string}
     * @public
     */
    type = ''
    #grab = new Grab()
    #draw = new Draw()
    #zoom = new Zoom()
    #pipette = new Pipette()
    #crop = new Crop()

    /**
     * @constructor
     * @param {HTMLImageElement} imageElement
     * @param {name: string, type: string} info
     */
    constructor(imageElement, { name, type }) {
        this.name = name
        this.type = type

        var canvas = document.getElementById('canvas')
        var canvasDraw = document.getElementById('canvas-draw')
        var originalCanvas = document.createElement('canvas')
        var canvasPipette = document.getElementById('canvas-pipette')

        this.#refs.canvas = { element: canvas, context: canvas.getContext('2d') }
        this.#refs.originalCanvas = { element: originalCanvas, context: originalCanvas.getContext('2d') }
        this.#refs.canvasDraw = { element: canvasDraw, context: canvasDraw.getContext('2d') }
        this.#refs.canvasPipette = { element: canvasPipette, context: canvasPipette.getContext('2d') }

        this.#initCanvas()
        this.#initOriginalCanvas(imageElement)

        this.#calculateScale()
        this.#initCanvasCrds()
    }

    /**
     * @returns {string}
     */
    getDataURL() {
        return this.#refs.originalCanvas.element.toDataURL(this.type)
    }

    #initCanvas() {
        var parent = this.#refs.canvas.element.parentElement
        var parentRect = parent.getBoundingClientRect()

        this.#refs.canvas.element.width = parentRect.width
        this.#refs.canvas.element.height = parentRect.height
    }

    /**
     * @param {HTMLImageElement} imageElement
     */
    #initOriginalCanvas(imageElement) {
        this.#refs.originalCanvas.element.width = imageElement.width
        this.#refs.originalCanvas.element.height = imageElement.height

        this.#refs.originalCanvas.context.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height)
    }

    #initCanvasCrds() {
        var x = (this.#refs.canvas.element.width - this.#refs.scaledWidth) / 2
        var y = (this.#refs.canvas.element.height - this.#refs.scaledHeight) / 2

        this.#refs.crds = [x, y]
    }

    /**
     * @param {number} newScale
     */
    #setScale(newScale) {
        var newWidth = this.#refs.originalCanvas.element.width * newScale
        var newHeight = this.#refs.originalCanvas.element.height * newScale

        this.#refs.scale = newScale
        this.#refs.scaledWidth = newWidth
        this.#refs.scaledHeight = newHeight
    }

    #calculateScale() {
        var scaleX = this.#refs.canvas.element.width / (this.#refs.originalCanvas.element.width + GRAB_SPACE * 2)
        var scaleY = this.#refs.canvas.element.height / (this.#refs.originalCanvas.element.height + GRAB_SPACE * 2)

        this.#setScale(Math.min(scaleX, scaleY, 1))
    }

    /**
     * @param {number} prevScale
     */
    #crdsScale(prevScale) {
        var scalingFactor = this.#refs.scale / prevScale
        var diffW = this.#refs.canvas.element.width - this.#refs.scaledWidth
        var diffH = this.#refs.canvas.element.height - this.#refs.scaledHeight

        if (this.#refs.scaledWidth < this.#refs.canvas.element.width) this.#refs.crds[0] = diffW / 2
        else {
            var halfW = this.#refs.canvas.element.width / 2
            var newX = halfW + (this.#refs.crds[0] - halfW) * scalingFactor

            this.#refs.crds[0] = Math.max(Math.min(GRAB_SPACE, newX), diffW - GRAB_SPACE)
        }

        if (this.#refs.scaledHeight < this.#refs.canvas.element.height) this.#refs.crds[1] = diffH / 2
        else {
            var halfH = this.#refs.canvas.element.height / 2
            var newY = halfH + (this.#refs.crds[1] - halfH) * scalingFactor

            this.#refs.crds[1] = Math.max(Math.min(GRAB_SPACE, newY), diffH - GRAB_SPACE)
        }
    }

    /**
     * @returns {string}
     */
    getColor() {
        return this.#refs.color
    }

    /**
     * @returns {number}
     */
    getCanvasDrawSize() {
        return this.#draw.canvasDrawSize
    }

    /**
     * @param {number} newSize
     */
    setCanvasDrawSize(newSize) {
        this.#draw.canvasDrawSize = newSize
        this.#draw.initCanvasDraw(this.#refs)
    }

    resetCropCrds() {
        this.drawImage()
        this.#crop.initCrop(this.#refs)
    }

    applyCropCrds() {
        var [topLeft, bottomRight] = this.#crop.cropCrds
        var newWidth = bottomRight[0] - topLeft[0]
        var newHeight = bottomRight[1] - topLeft[1]

        if (newWidth >= 1 && newHeight >= 1) {
            var imageData = this.#refs.originalCanvas.context.getImageData(topLeft[0], topLeft[1], newWidth, newHeight)

            this.#refs.originalCanvas.element.width = newWidth
            this.#refs.originalCanvas.element.height = newHeight

            this.#refs.originalCanvas.context.putImageData(imageData, 0, 0)
        }

        var newScaledWidth = this.#refs.originalCanvas.element.width * this.#refs.scale
        var newScaledHeight = this.#refs.originalCanvas.element.height * this.#refs.scale

        this.#refs.scaledWidth = newScaledWidth
        this.#refs.scaledHeight = newScaledHeight

        var x = (this.#refs.canvas.element.width - newScaledWidth) / 2
        var y = (this.#refs.canvas.element.height - newScaledHeight) / 2

        this.#refs.crds = [x, y]

        this.drawImage()

        this.#crop.initCrop(this.#refs)
    }

    /**
     * @param {string} newColor
     */
    setColor(newColor) {
        this.#refs.color = newColor
    }

    /**
     * @param {string} mode
     */
    setZoomMode(mode) {
        this.#zoom.mode = mode
        this.#refs.canvas.element.style.cursor = `zoom-${mode}`
    }

    drawImage() {
        requestAnimationFrame(() => {
            var [x, y] = this.#refs.crds

            this.#refs.canvas.context.imageSmoothingEnabled = false

            this.#refs.canvas.context.clearRect(0, 0, this.#refs.canvas.element.width, this.#refs.canvas.element.height)

            this.#refs.canvas.context.fillStyle = '#fff'
            this.#refs.canvas.context.fillRect(0, 0, this.#refs.canvas.element.width, this.#refs.canvas.element.height)
            this.#refs.canvas.context.drawImage(
                this.#refs.originalCanvas.element,
                x,
                y,
                Math.floor(this.#refs.scaledWidth),
                Math.floor(this.#refs.scaledHeight)
            )
        })
    }

    /**
     * @param {string} drawState
     */
    setDrawState(drawState) {
        this.#drawState = drawState
        this.#refs.canvasDraw.element.style.visibility = 'hidden'
        this.#refs.canvasPipette.element.style.visibility = 'hidden'

        this.drawImage()

        switch (drawState) {
            case DrawState.Default: {
                this.#refs.canvas.element.style.cursor = 'default'
                break
            }
            case DrawState.Grab: {
                this.#refs.canvas.element.style.cursor = 'grab'
                break
            }
            case DrawState.Draw: {
                this.#refs.canvas.element.style.cursor = 'none'
                this.#draw.initCanvasDraw(this.#refs)
                break
            }
            case DrawState.Zoom: {
                this.#refs.canvas.element.style.cursor = `zoom-${this.#zoom.mode}`
                break
            }
            case DrawState.Pipette: {
                this.#refs.canvas.element.style.cursor = 'none'
                this.#pipette.initPipette(this.#refs)
                break
            }
            case DrawState.Crop: {
                this.#crop.initCrop(this.#refs)
                break
            }
        }
    }

    /**
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        switch (this.#drawState) {
            case DrawState.Grab: {
                this.#grab.onMouseDown(event)
                break
            }
            case DrawState.Draw: {
                this.#draw.onMouseDown(event, this.#refs, this.drawImage.bind(this))
                break
            }
            case DrawState.Crop: {
                this.#crop.onMouseDown(event)
                break
            }
            case DrawState.Zoom: {
                this.#zoom.onMouseDown(event, this.#refs, this.#crdsScale.bind(this), this.drawImage.bind(this))
                break
            }
            case DrawState.Pipette: {
                this.#pipette.onMouseDown(event, this.#refs)
                break
            }
        }

        Array.prototype.forEach.call(document.getElementsByClassName('button'), (item) => {
            item.disabled = true
        })
    }

    /**
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        switch (this.#drawState) {
            case DrawState.Grab: {
                this.#grab.onMouseUp(event)
                break
            }
            case DrawState.Draw: {
                this.#draw.onMouseUp(event, this.#refs)
                break
            }
            case DrawState.Crop: {
                this.#crop.onMouseUp()
                break
            }
            case DrawState.Pipette: {
                this.#pipette.onMouseUp()
                break
            }
        }

        Array.prototype.forEach.call(document.getElementsByClassName('button'), (item) => {
            item.disabled = false
        })
    }

    /**
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        switch (this.#drawState) {
            case DrawState.Grab: {
                this.#grab.onMouseMove(event, this.#refs, this.drawImage.bind(this))
                break
            }
            case DrawState.Draw: {
                this.#draw.onMouseMove(event, this.#refs, this.drawImage.bind(this))
                break
            }
            case DrawState.Crop: {
                this.#crop.onMouseMove(event, this.#refs, this.drawImage.bind(this))
                break
            }
            case DrawState.Pipette: {
                this.#pipette.onMouseMove(event, this.#refs)
                break
            }
        }
    }

    onResize() {
        this.#initCanvas()
        this.#calculateScale()
        this.#initCanvasCrds()

        switch (this.#drawState) {
            case DrawState.Crop: {
                this.drawImage()
                this.#crop.initCrop(this.#refs)
                break
            }
            default:
                this.drawImage()
                break
        }
    }

    /**
     * @param {WheelEvent} event
     */
    onWheel(event) {
        event.preventDefault()

        var prevScale = this.#refs.scale
        var changeRate = -0.0005

        if (this.#refs.scale > 3) changeRate *= 10

        this.#setScale(Math.min(Math.max(MIN_SCALE_RANGE, this.#refs.scale + event.deltaY * changeRate), MAX_SCALE_RANGE))
        this.#crdsScale(prevScale)

        switch (this.#drawState) {
            case DrawState.Crop: {
                this.drawImage()
                this.#crop.drawCrop(this.#refs)
                break
            }
            case DrawState.Draw: {
                this.#draw.initCanvasDraw(this.#refs)
            }
            default:
                this.drawImage()
                break
        }
    }
}
