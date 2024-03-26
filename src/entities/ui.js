import { DrawState } from '../constants/drawstate'
import { createElement } from '../helpers/createElement'
import { rgbToHex } from '../helpers/rgbToHex'
import { Editor } from './editor'

/**
 * @Class
 */
export class UI {
    /**
     * @type {number[]}
     * @private
     */
    #colors = ['#000', '#ff0000', '#008000', '#0000ff', '#ffff00']
    /**
     * @type {Editor}
     * @private
     */
    #editor = null
    /**
     * @type {[HTMLElement, string, (event: MouseEvent) => void][]}
     * @private
     */
    #listeners = []
    #onResize = null
    #onWheel = null
    #onMouseDown = null
    #onMouseUp = null
    #onMouseMove = null

    /**
     * @constructor
     */
    constructor() {
        this.#initListeners()
    }

    #initListeners() {
        var menuState = document.getElementById('menu-state')
        var stateButtons = menuState.getElementsByClassName('button')
        var menuButton = document.getElementById('menu-button')
        var menuDropdown = document.getElementById('menu-dropdown')

        menuState.style.display = 'none'

        Array.prototype.forEach.call(stateButtons, (item) => {
            item.addEventListener('click', () => {
                this.#closePanel()
                this.#editor.setDrawState.call(this.#editor, item.dataset.drawstate)
                this.#openPanel(item.dataset.drawstate)
            })
        })

        Array.prototype.forEach.call(menuDropdown.children[0].children, (item) => {
            switch (item.dataset.label) {
                case 'open': {
                    item.addEventListener('change', this.#loadImage.bind(this))
                    break
                }
                case 'download': {
                    item.style.display = 'none'
                    item.addEventListener('click', this.#downloadImage.bind(this))
                    break
                }
            }
        })

        window.addEventListener('click', this.#windowOnClick.bind(this))
        menuButton.addEventListener('click', this.#menuButtonOnClick.bind(this))
    }

    #downloadImage() {
        var link = document.createElement('a')

        link.href = this.#editor.getDataURL()
        link.download = this.#editor.name
        link.click()
    }

    /**
     * @param {MouseEvent} event
     */
    #loadImage(event) {
        var filesList = event.target.files

        if (filesList && filesList.length > 0) {
            var file = filesList[0]
            var reader = new FileReader()

            reader.onload = () => {
                var dataUrl = reader.result

                try {
                    var image = new Image()
                    image.src = dataUrl

                    image.onload = (event) => {
                        var canvas = document.getElementById('canvas')
                        var editor = new Editor(event.target, { name: file.name, type: file.type })
                        var onResize = editor.onResize.bind(editor)
                        var onWheel = editor.onWheel.bind(editor)
                        var onMouseDown = editor.onMouseDown.bind(editor)
                        var onMouseUp = editor.onMouseUp.bind(editor)
                        var onMouseMove = editor.onMouseMove.bind(editor)

                        this.#listeners.push(
                            [window, 'resize', this.#onResize],
                            [canvas, 'wheel', this.#onWheel],
                            [canvas, 'mousedown', this.#onMouseDown],
                            [canvas, 'mouseup', this.#onMouseUp],
                            [canvas, 'mousemove', this.#onMouseMove]
                        )
                        this.#editor = editor

                        this.#closePanel()
                        this.#init()
                        this.#menuButtonOnClick()
                        this.#editor.drawImage()

                        window.addEventListener('resize', onResize, { passive: false })
                        canvas.addEventListener('wheel', onWheel)
                        canvas.addEventListener('mousedown', onMouseDown)
                        canvas.addEventListener('mouseup', onMouseUp)
                        canvas.addEventListener('mousemove', onMouseMove)

                        this.#onResize = onResize
                        this.#onWheel = onWheel
                        this.#onMouseDown = onMouseDown
                        this.#onMouseUp = onMouseUp
                        this.#onMouseMove = onMouseMove
                    }

                    image.onerror = () => {
                        console.error('Failed to load image.')
                    }
                } catch (error) {
                    console.error(error)
                }
            }

            reader.onerror = (event) => {
                var error = event.target?.error
                console.error(error)
            }

            reader.readAsDataURL(file)
        }
    }

    #init() {
        var menuState = document.getElementById('menu-state')
        var menuDropdown = document.getElementById('menu-dropdown')

        menuState.style.display = 'flex'

        Array.prototype.forEach.call(menuDropdown.children[0].children, (item) => {
            item.style.display = 'flex'
        })
    }

    /**
     * @param {HTMLElement} element
     * @param {string} type
     * @param {(event: MouseEvent) => void} listener
     */
    #addEventListener(element, type, listener) {
        element.addEventListener(type, listener)
        this.#listeners.push([element, type, listener])
    }

    /**
     * @param {MouseEvent} event
     */
    #panelSelectColor(event) {
        var selectedColor = document.getElementById('stroke-button')
        var match = event.target.style.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        var hex = rgbToHex(...[+match[1], +match[2], +match[3]])

        this.#editor.setColor(hex)
        selectedColor.style.backgroundColor = hex
    }

    #panelSetDrawSize(event) {
        var legend = event.target.parentElement.children[0]
        var text = legend.textContent.split(' ')
        text[1] = event.target.value + 'px'
        legend.textContent = text.join(' ')

        this.#editor.setCanvasDrawSize(+event.target.value)
    }

    #closePanel() {
        var menuPanel = document.getElementById('menu-panel')

        while (this.#listeners.length > 0) {
            var [element, type, listener] = this.#listeners.pop()
            element.removeEventListener(type, listener)
        }

        while (menuPanel.firstChild) {
            menuPanel.removeChild(menuPanel.firstChild)
        }

        menuPanel.classList.add('hide')
    }

    /**
     *
     * @param {string} drawState
     */
    #openPanel(drawState) {
        var menuPanel = document.getElementById('menu-panel')

        switch (drawState) {
            case DrawState.Pipette:
            case DrawState.Draw: {
                menuPanel.classList.remove('hide')

                var strokeRow = createElement('fieldset', ['menu__panel-container'])
                var strokeLegend = createElement('legend', ['menu__panel-container__legend'], 'Stroke')
                var colorsRow = createElement('div', ['menu__panel-container__row'])

                this.#colors.forEach((color) => {
                    var button = createElement('button', ['menu__panel-container__button'])
                    button.style.backgroundColor = color
                    var listener = this.#panelSelectColor.bind(this)

                    this.#addEventListener(button, 'click', listener)

                    colorsRow.append(button)
                })

                var selectedColor = createElement('button', ['menu__panel-container__button'])
                selectedColor.setAttribute('id', 'stroke-button')
                selectedColor.style.backgroundColor = this.#editor.getColor()

                colorsRow.append(selectedColor)

                strokeRow.append(strokeLegend, colorsRow)

                menuPanel.append(strokeRow)

                if (drawState !== DrawState.Pipette) {
                    var canvasDrawSize = this.#editor.getCanvasDrawSize().toString()
                    var sizeRow = createElement('fieldset', ['menu__panel-container'])
                    var strokeLegend = createElement('legend', ['menu__panel-container__legend'], `Size ${canvasDrawSize}px`)
                    var sizeControl = document.createElement('input')
                    var listener = this.#panelSetDrawSize.bind(this)

                    sizeControl.setAttribute('type', 'range')
                    sizeControl.setAttribute('min', '5')
                    sizeControl.setAttribute('max', '1000')
                    sizeControl.setAttribute('value', canvasDrawSize)
                    sizeControl.addEventListener('input', listener)

                    this.#addEventListener(sizeControl, 'input', listener)

                    sizeRow.append(strokeLegend, sizeControl)

                    menuPanel.append(sizeRow)
                }
                break
            }
            case DrawState.Crop: {
                menuPanel.classList.remove('hide')

                var strokeRow = createElement('fieldset', ['menu__panel-container'])
                var strokeLegend = createElement('legend', ['menu__panel-container__legend'], 'Crop')
                var buttonsRow = createElement('div', ['menu__panel-container__row', 'menu__panel-container__row--crop'])
                var applyButton = createElement('button', ['menu__panel-container__button', 'menu__panel-container__button--crop'], 'Apply')
                var resetButton = createElement('button', ['menu__panel-container__button', 'menu__panel-container__button--crop'], 'Reset')
                buttonsRow.append(applyButton, resetButton)
                strokeRow.append(strokeLegend, buttonsRow)

                this.#addEventListener(applyButton, 'click', () => {
                    this.#editor.applyCropCrds.call(this.#editor)
                    this.#closePanel()
                })
                this.#addEventListener(resetButton, 'click', this.#editor.resetCropCrds.bind(this.#editor))

                menuPanel.append(strokeRow)
                break
            }
            case DrawState.Zoom: {
                menuPanel.classList.remove('hide')

                var strokeRow = createElement('fieldset', ['menu__panel-container'])
                var strokeLegend = createElement('legend', ['menu__panel-container__legend'], 'Zoom')
                var buttonsRow = createElement('div', ['menu__panel-container__row', 'menu__panel-container__row--crop'])
                var plusButton = createElement('button', ['menu__panel-container__button', 'menu__panel-container__button--crop'], 'Plus')
                var minusButton = createElement('button', ['menu__panel-container__button', 'menu__panel-container__button--crop'], 'Minus')
                buttonsRow.append(plusButton, minusButton)
                strokeRow.append(strokeLegend, buttonsRow)

                var plusListener = this.#editor.setZoomMode.bind(this.#editor, 'in')
                var minusListener = this.#editor.setZoomMode.bind(this.#editor, 'out')

                this.#addEventListener(plusButton, 'click', plusListener)
                this.#addEventListener(minusButton, 'click', minusListener)

                menuPanel.append(strokeRow)
                break
            }
            default: {
                menuPanel.classList.add('hide')
                break
            }
        }
    }

    /**
     * @param {MouseEvent} event
     */
    #windowOnClick(event) {
        var menuDropdown = document.getElementById('menu-dropdown')

        if (!menuDropdown.contains(event.target) && !event.target.closest('#menu-button')) {
            menuDropdown.classList.add('hide')
        }
    }

    #menuButtonOnClick() {
        var menuDropdown = document.getElementById('menu-dropdown')

        if (!menuDropdown.classList.contains('hide')) menuDropdown.classList.add('hide')
        else menuDropdown.classList.remove('hide')
    }
}
