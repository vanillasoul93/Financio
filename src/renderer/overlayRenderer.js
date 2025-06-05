// overlayRenderer.js

// Access the exposed API from preloadOverlay.js
const overlayAPI = window.overlayAPI

const selectionBox = document.getElementById('selection-box')
let isDrawing = false
let startPoint = { x: 0, y: 0 }
let currentDisplayId = null // To store the display ID for this overlay instance

// Get displayId from URL query parameters when the script loads
document.addEventListener('DOMContentLoaded', () => {
  const queryParams = new URLSearchParams(window.location.search)
  currentDisplayId = queryParams.get('displayId')
  if (currentDisplayId) {
    console.log(`Overlay initialized for display ID: ${currentDisplayId}`)
  } else {
    console.error('Overlay launched without a displayId query parameter!')
  }
  // You could potentially display the ID on the overlay for debugging if needed
  // document.body.setAttribute('data-display-id', currentDisplayId);
})

document.addEventListener('mousedown', (event) => {
  if (event.button !== 0 || !currentDisplayId) return // Only primary button and if displayId is known

  isDrawing = true
  startPoint = { x: event.clientX, y: event.clientY } // These are relative to this window/display
  selectionBox.style.left = `${startPoint.x}px`
  selectionBox.style.top = `${startPoint.y}px`
  selectionBox.style.width = '0px'
  selectionBox.style.height = '0px'
  selectionBox.style.display = 'block'
})

document.addEventListener('mousemove', (event) => {
  if (!isDrawing || !currentDisplayId) return

  const currentX = event.clientX
  const currentY = event.clientY

  const x = Math.min(startPoint.x, currentX)
  const y = Math.min(startPoint.y, currentY)
  const width = Math.abs(startPoint.x - currentX)
  const height = Math.abs(startPoint.y - currentY)

  selectionBox.style.left = `${x}px`
  selectionBox.style.top = `${y}px`
  selectionBox.style.width = `${width}px`
  selectionBox.style.height = `${height}px`
})

document.addEventListener('mouseup', (event) => {
  if (event.button !== 0 || !isDrawing || !currentDisplayId) return

  isDrawing = false
  selectionBox.style.display = 'none'

  const endX = event.clientX
  const endY = event.clientY

  const x = Math.min(startPoint.x, endX)
  const y = Math.min(startPoint.y, endY)
  const width = Math.abs(startPoint.x - endX)
  const height = Math.abs(startPoint.y - endY)

  if (width > 0 && height > 0) {
    if (overlayAPI && overlayAPI.sendRegion) {
      console.log(`Sending region from display ${currentDisplayId}:`, { x, y, width, height })
      overlayAPI.sendRegion({
        region: { x, y, width, height },
        displayId: currentDisplayId
      })
    } else {
      console.error('overlayAPI.sendRegion is not available.')
    }
  } else {
    // No region selected, treat as cancel
    if (overlayAPI && overlayAPI.cancelCapture) {
      console.log('No region drawn, sending cancelCapture from display ' + currentDisplayId)
      overlayAPI.cancelCapture()
    }
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (overlayAPI && overlayAPI.cancelCapture && currentDisplayId) {
      // Ensure currentDisplayId is known
      console.log('Escape pressed, sending cancelCapture from display ' + currentDisplayId)
      overlayAPI.cancelCapture()
    } else {
      console.warn('overlayAPI.cancelCapture not available or displayId unknown for Escape key.')
    }
  }
})

// Initial state
if (selectionBox) selectionBox.style.display = 'none'
