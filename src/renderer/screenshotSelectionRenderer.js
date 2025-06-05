// Complete screenshotSelectionRenderer.js - Fixed dark overlay issue

// State variables
let activeBillId = null
let currentSelectedSourceId = null
let isDrawing = false
let startX = 0
let startY = 0
let animationFrameId = null

// DOM elements
let overlayCanvas
let selectionDiv
let ctxOverlay

// Current selection coordinates
const currentSelection = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
}

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', initializeScreenshotSelection)

function initializeScreenshotSelection() {
  setupDOMReferences()
  setupCanvas()
  setupEventListeners()
  setupMainProcessCommunication()
}

function setupDOMReferences() {
  overlayCanvas = document.getElementById('overlayCanvas')
  selectionDiv = document.getElementById('selectionDiv')
  ctxOverlay = overlayCanvas.getContext('2d')
}

function setupCanvas() {
  // Set canvas dimensions to match window size
  resizeCanvasToWindow()

  // Initial draw of the dimmed overlay
  drawDimmedOverlay()

  // Style the selection rectangle
  if (selectionDiv) {
    selectionDiv.style.border = '2px dashed rgba(255, 255, 255, 0.8)'
    selectionDiv.style.backgroundColor = 'rgba(0, 100, 255, 0.2)'
    selectionDiv.style.position = 'absolute'
    selectionDiv.style.display = 'none'
  }
}

function setupEventListeners() {
  // Mouse events for selection
  overlayCanvas.addEventListener('mousedown', handleSelectionStart)
  overlayCanvas.addEventListener('mousemove', handleSelectionMove)
  overlayCanvas.addEventListener('mouseup', handleSelectionEnd)

  // Keyboard events
  document.addEventListener('keydown', handleKeyPress)

  // Window resize
  window.addEventListener('resize', handleWindowResize)
}

function setupMainProcessCommunication() {
  if (!window.screenshotApi?.onStartCaptureStream) {
    console.error('Screenshot API not available')
    return
  }

  // Set up listener for when main process is ready
  const cleanupListener = window.screenshotApi.onStartCaptureStream((event, sourceId, billId) => {
    currentSelectedSourceId = sourceId
    activeBillId = billId
    console.log(`Ready to capture on display ${sourceId} for bill ${billId}`)
  })

  // Clean up when window closes
  window.addEventListener('beforeunload', () => {
    cleanupListener?.()
  })
}

// Canvas and drawing functions
function resizeCanvasToWindow() {
  overlayCanvas.width = window.innerWidth
  overlayCanvas.height = window.innerHeight
}

function drawDimmedOverlay() {
  ctxOverlay.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctxOverlay.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height)
}

function updateSelectionRectangle() {
  if (!selectionDiv) return

  selectionDiv.style.left = `${currentSelection.x}px`
  selectionDiv.style.top = `${currentSelection.y}px`
  selectionDiv.style.width = `${currentSelection.width}px`
  selectionDiv.style.height = `${currentSelection.height}px`
}

// Event handlers
function handleSelectionStart(e) {
  isDrawing = true
  startX = e.clientX
  startY = e.clientY

  currentSelection.x = startX
  currentSelection.y = startY
  currentSelection.width = 0
  currentSelection.height = 0

  selectionDiv.style.display = 'block'
  updateSelectionRectangle()
}

function handleSelectionMove(e) {
  if (!isDrawing) return

  const currentX = e.clientX
  const currentY = e.clientY

  currentSelection.x = Math.min(startX, currentX)
  currentSelection.y = Math.min(startY, currentY)
  currentSelection.width = Math.abs(currentX - startX)
  currentSelection.height = Math.abs(currentY - startY)

  // Use animation frames for smooth rendering
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = requestAnimationFrame(updateSelectionRectangle)
}

async function handleSelectionEnd(e) {
  if (!isDrawing) return
  isDrawing = false

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  const endX = e.clientX
  const endY = e.clientY

  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  // Minimum selection size (10x10 pixels)
  if (width < 10 || height < 10) {
    selectionDiv.style.display = 'none'
    return
  }

  try {
    // Visual feedback
    flashSelection(currentSelection.x, currentSelection.y, width, height)

    // Send coordinates to main process for native capture
    if (window.screenshotApi?.regionSelected) {
      window.screenshotApi.regionSelected(
        currentSelection.x,
        currentSelection.y,
        width,
        height,
        currentSelectedSourceId,
        activeBillId
      )
    }
  } catch (error) {
    console.error('Selection failed:', error)
    if (window.screenshotApi?.cancelSelection) {
      window.screenshotApi.cancelSelection(activeBillId)
    }
  } finally {
    selectionDiv.style.display = 'none'
  }
}

function handleKeyPress(e) {
  if (e.key === 'Escape') {
    cancelSelection()
  }
}

function handleWindowResize() {
  resizeCanvasToWindow()
  drawDimmedOverlay()
}

// Utility functions
function flashSelection(x, y, width, height) {
  // Save current overlay
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = overlayCanvas.width
  tempCanvas.height = overlayCanvas.height
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx.drawImage(overlayCanvas, 0, 0)

  // Draw white flash
  ctxOverlay.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctxOverlay.fillRect(x, y, width, height)

  // Restore after delay
  setTimeout(() => {
    ctxOverlay.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
    ctxOverlay.drawImage(tempCanvas, 0, 0)
  }, 100)
}

function cancelSelection() {
  isDrawing = false

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  selectionDiv.style.display = 'none'

  if (window.screenshotApi?.cancelSelection) {
    window.screenshotApi.cancelSelection(activeBillId)
  }
}
