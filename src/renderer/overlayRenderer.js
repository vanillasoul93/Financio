// overlayRenderer.js
console.log('--- overlayRenderer.js script started ---') // <<< ADD THIS LINE AT THE VERY TOP

const overlayAPI = window.overlayAPI // From preloadOverlay.js

const selectionBox = document.getElementById('selection-box')
let isDrawing = false
let startPoint = { x: 0, y: 0 }
let currentDisplayId = null // Will be populated from URL

document.addEventListener('DOMContentLoaded', () => {
  const queryParams = new URLSearchParams(window.location.search)
  currentDisplayId = queryParams.get('displayId')
  console.log('overlay Renderer not running')
  if (currentDisplayId) {
    console.log(`Overlay renderer initialized for display ID: ${currentDisplayId}`)
  } else {
    console.error(
      'Overlay renderer: displayId query parameter is missing! Cannot associate with a display.'
    )
    // Optionally, disable functionality or show an error in the overlay
  }
})

document.addEventListener('mousedown', (event) => {
  if (event.button !== 0 || !currentDisplayId) return // Ensure displayId is known

  isDrawing = true
  startPoint = { x: event.clientX, y: event.clientY }
  if (selectionBox) {
    selectionBox.style.left = `${startPoint.x}px`
    selectionBox.style.top = `${startPoint.y}px`
    selectionBox.style.width = '0px'
    selectionBox.style.height = '0px'
    selectionBox.style.display = 'block'
  }
})

document.addEventListener('mousemove', (event) => {
  if (!isDrawing || !currentDisplayId) return

  const currentX = event.clientX
  const currentY = event.clientY
  const x = Math.min(startPoint.x, currentX)
  const y = Math.min(startPoint.y, currentY)
  const width = Math.abs(startPoint.x - currentX)
  const height = Math.abs(startPoint.y - currentY)

  if (selectionBox) {
    selectionBox.style.left = `${x}px`
    selectionBox.style.top = `${y}px`
    selectionBox.style.width = `${width}px`
    selectionBox.style.height = `${height}px`
  }
})

document.addEventListener('mouseup', (event) => {
  if (event.button !== 0 || !isDrawing || !currentDisplayId) return

  isDrawing = false
  if (selectionBox) {
    selectionBox.style.display = 'none'
  }

  const endX = event.clientX
  const endY = event.clientY
  const x = Math.min(startPoint.x, endX)
  const y = Math.min(startPoint.y, endY)
  const width = Math.abs(startPoint.x - endX)
  const height = Math.abs(startPoint.y - endY)

  if (width > 0 && height > 0) {
    if (overlayAPI && overlayAPI.sendRegion) {
      // --- THIS IS THE CRUCIAL PART ---
      const dataToSend = {
        region: { x, y, width, height }, // Nest the region object
        displayId: currentDisplayId // Include the displayId
      }
      console.log(
        `overlayRenderer.js: Sending data to main for capture-region:`,
        JSON.stringify(dataToSend)
      )
      overlayAPI.sendRegion(dataToSend)
      // --- END CRUCIAL PART ---
    } else {
      console.error('overlayRenderer.js: overlayAPI.sendRegion is not available.')
    }
  } else {
    // No actual region drawn, consider it a cancellation from this overlay
    if (overlayAPI && overlayAPI.cancelCapture) {
      console.log('overlayRenderer.js: No region drawn, sending cancelCapture.')
      overlayAPI.cancelCapture()
    }
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (overlayAPI && overlayAPI.cancelCapture && currentDisplayId) {
      console.log('overlayRenderer.js: Escape pressed, sending cancelCapture.')
      overlayAPI.cancelCapture()
    } else {
      console.warn(
        'overlayRenderer.js: overlayAPI.cancelCapture not available or displayId unknown for Escape key.'
      )
    }
  }
})

// Initial state
if (selectionBox) {
  selectionBox.style.display = 'none'
}
