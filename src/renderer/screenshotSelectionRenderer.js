// This script runs in the renderer process of the transparent screenshot window.

let activeBillId = null // Store the billId received from the main process
let mediaStream = null // To hold the desktop media stream
let currentSelectedSourceId = null // The ID of the currently selected monitor source

let isDrawing = false
let startX, startY
let selectionDiv // The div that shows the selection rectangle
let overlayCanvas // Canvas to draw the dimmed overlay
let ctxOverlay // Context for the overlay canvas

let videoElement // Hidden video element to play desktop stream
let captureCanvas // Hidden canvas to draw frames from video stream
let ctxCapture // Context for the capture canvas

let sourceSelectionContainer // Container for monitor selection buttons

// Variables for optimized drawing
let currentSelection = { x: 0, y: 0, width: 0, height: 0 }
let animationFrameId = null

document.addEventListener('DOMContentLoaded', async () => {
  // Get references to the HTML elements
  overlayCanvas = document.getElementById('overlayCanvas')
  selectionDiv = document.getElementById('selectionDiv')
  videoElement = document.getElementById('videoElement')
  captureCanvas = document.getElementById('captureCanvas')

  ctxOverlay = overlayCanvas.getContext('2d')
  ctxCapture = captureCanvas.getContext('2d')

  // Create container for monitor selection buttons
  sourceSelectionContainer = document.createElement('div')
  sourceSelectionContainer.id = 'sourceSelectionContainer'
  sourceSelectionContainer.style.position = 'absolute'
  sourceSelectionContainer.style.top = '50%'
  sourceSelectionContainer.style.left = '50%'
  sourceSelectionContainer.style.transform = 'translate(-50%, -50%)'
  sourceSelectionContainer.style.zIndex = '1002' // Above selection div
  sourceSelectionContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
  sourceSelectionContainer.style.padding = '20px'
  sourceSelectionContainer.style.borderRadius = '10px'
  sourceSelectionContainer.style.display = 'flex'
  sourceSelectionContainer.style.flexDirection = 'column'
  sourceSelectionContainer.style.gap = '15px'
  sourceSelectionContainer.style.alignItems = 'center'
  document.body.appendChild(sourceSelectionContainer)

  // Style the overlay canvas to cover the entire screen
  overlayCanvas.style.position = 'absolute'
  overlayCanvas.style.top = '0'
  overlayCanvas.style.left = '0'
  overlayCanvas.style.width = '100vw'
  overlayCanvas.style.height = '100vh'
  overlayCanvas.style.zIndex = '1000' // Ensure it's on top
  overlayCanvas.style.cursor = 'crosshair'

  // Set initial canvas dimensions
  overlayCanvas.width = window.innerWidth
  overlayCanvas.height = window.innerHeight
  captureCanvas.width = window.innerWidth
  captureCanvas.height = window.innerHeight

  // Initial draw of the dimmed overlay
  drawDimmedOverlay()

  // Listen for screen source ID and billId from the main process
  if (window.screenshotApi && window.screenshotApi.onSetScreenSource) {
    window.screenshotApi.onSetScreenSource(async (event, sourceIdFromMain, billId) => {
      // sourceIdFromMain will be null now
      console.log(
        `[renderer] Received billId: ${billId}. Source ID from main is: ${sourceIdFromMain}`
      )
      activeBillId = billId // Store the billId

      // Immediately get all desktop sources and display selection UI
      await listAndSelectSources()
    })
  } else {
    console.error('[renderer] window.screenshotApi.onSetScreenSource is not available.')
    // Fallback to list sources if IPC setup is somehow missed
    await listAndSelectSources()
  }

  // Mouse event listeners for selection
  overlayCanvas.addEventListener('mousedown', (e) => {
    // Only allow drawing if a source has been selected and stream is active
    if (!currentSelectedSourceId || !mediaStream) {
      console.warn(
        '[renderer] Cannot start drawing: No source selected or media stream not active.'
      )
      return
    }

    console.log('[renderer] Mouse Down Event')
    isDrawing = true
    startX = e.clientX
    startY = e.clientY

    currentSelection = { x: startX, y: startY, width: 0, height: 0 }
    updateSelectionDiv()

    selectionDiv.style.display = 'block'
    console.log('[renderer] selectionDiv display set to block.')
  })

  overlayCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return

    const currentX = e.clientX
    const currentY = e.clientY

    console.log(
      `[renderer] mousemove raw: startX=${startX}, startY=${startY}, currentX=${currentX}, currentY=${currentY}`
    )

    currentSelection.x = Math.min(startX, currentX)
    currentSelection.y = Math.min(startY, currentY)
    currentSelection.width = Math.abs(currentX - startX)
    currentSelection.height = Math.abs(currentY - startY)

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    animationFrameId = requestAnimationFrame(updateSelectionDiv)

    console.log(`[renderer] mousemove: currentSelection = ${JSON.stringify(currentSelection)}`)
  })

  overlayCanvas.addEventListener('mouseup', async (e) => {
    // Made async to await capture
    console.log('[renderer] Mouse Up Event')
    isDrawing = false
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    const endX = e.clientX
    const endY = e.clientY

    const x = Math.min(startX, endX)
    const y = Math.min(startY, endY)
    const width = Math.abs(endX - startX)
    const height = Math.abs(endY - startY)

    console.log(`[renderer] Final selection calculated: x=${x}, y=${y}, w=${width}, h=${height}`)
    console.log(`[renderer] Current selected source ID: ${currentSelectedSourceId}`)
    console.log(`[renderer] Active Bill ID: ${activeBillId}`)

    // Stop the media stream regardless of selection validity
    stopMediaStream()

    // Only send if a valid selection was made (non-zero width/height)
    if (width > 0 && height > 0 && currentSelectedSourceId && activeBillId) {
      console.log(`[renderer] Valid selection criteria met. Attempting to capture image.`)
      try {
        // Draw the current frame from the video to the capture canvas
        // This ensures we capture the exact moment of mouseUp
        ctxCapture.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height)
        console.log('[renderer] Latest frame drawn to captureCanvas.')

        const tempCropCanvas = document.createElement('canvas')
        const tempCropCtx = tempCropCanvas.getContext('2d')

        // Set the temporary canvas dimensions to the selection size
        tempCropCanvas.width = width
        tempCropCanvas.height = height

        // Draw the selected region from the captureCanvas to the temporary canvas
        tempCropCtx.drawImage(
          captureCanvas, // Source canvas
          x, // Source X
          y, // Source Y
          width, // Source Width
          height, // Source Height
          0, // Destination X
          0, // Destination Y
          width, // Destination Width
          height // Destination Height
        )
        console.log(`[renderer] Cropped image drawn to tempCropCanvas (${width}x${height}).`)

        const dataUrl = tempCropCanvas.toDataURL('image/png')
        console.log(`[renderer] Generated dataUrl length: ${dataUrl.length}`)

        if (window.screenshotApi && window.screenshotApi.regionSelected) {
          window.screenshotApi.regionSelected(
            x,
            y,
            width,
            height,
            currentSelectedSourceId,
            activeBillId,
            dataUrl
          ) // Pass dataUrl
          selectionDiv.style.display = 'none' // Hide selection div on valid selection
          console.log('[renderer] selectionDiv display set to none on valid selection.')
        } else {
          console.error('[renderer] window.screenshotApi.regionSelected is not available.')
        }
      } catch (captureError) {
        console.error('[renderer] Error during image capture or cropping:', captureError)
        // Inform main process about cancellation due to capture error
        if (window.screenshotApi && window.screenshotApi.cancelSelection) {
          window.screenshotApi.cancelSelection(activeBillId)
        }
      }
    } else {
      console.warn(
        '[renderer] Invalid selection (width or height is 0) or no source selected. Keeping overlay visible.'
      )
      selectionDiv.style.display = 'block' // Ensure it stays visible for retry
      console.log('[renderer] selectionDiv display remains block for retry.')
    }
  })

  // Keyboard listener for Escape key to cancel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      console.log('[renderer] Escape key pressed. Cancelling selection.')
      isDrawing = false
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      selectionDiv.style.display = 'none' // Hide selection div
      console.log('[renderer] selectionDiv display set to none on Escape.')

      stopMediaStream() // Stop the media stream on cancel

      if (window.screenshotApi && window.screenshotApi.cancelSelection) {
        window.screenshotApi.cancelSelection(activeBillId) // Pass billId on cancel
      } else {
        console.error('[renderer] window.screenshotApi.cancelSelection is not available.')
      }
    }
  })
})

// Function to get desktop sources and display selection UI
async function listAndSelectSources() {
  if (!window.screenshotApi || !window.screenshotApi.getDesktopSources) {
    console.error(
      '[renderer] getDesktopSources API not available. Cannot list monitors. Cancelling screenshot.'
    )
    if (window.screenshotApi && window.screenshotApi.cancelSelection) {
      window.screenshotApi.cancelSelection(activeBillId)
    }
    return
  }

  try {
    const sources = await window.screenshotApi.getDesktopSources({
      types: ['screen'],
      thumbnailSize: { width: 200, height: 150 } // Request small thumbnails for display
    })
    console.log('[renderer] Desktop sources obtained:', sources)

    if (sources.length === 0) {
      const msg = document.createElement('p')
      msg.textContent = 'No screens found for capture.'
      msg.style.color = 'white'
      sourceSelectionContainer.appendChild(msg)
      // Automatically cancel if no sources
      if (window.screenshotApi && window.screenshotApi.cancelSelection) {
        window.screenshotApi.cancelSelection(activeBillId)
      }
      return
    }

    // Clear previous selection UI if any
    sourceSelectionContainer.innerHTML = ''

    const title = document.createElement('h2')
    title.textContent = 'Select a Monitor:'
    title.style.color = 'white'
    title.style.marginBottom = '10px'
    sourceSelectionContainer.appendChild(title)

    sources.forEach((source) => {
      const button = document.createElement('button')
      button.textContent = `Monitor: ${source.name}`
      button.style.padding = '10px 20px'
      button.style.fontSize = '16px'
      button.style.backgroundColor = '#4CAF50'
      button.style.color = 'white'
      button.style.border = 'none'
      button.style.borderRadius = '5px'
      button.style.cursor = 'pointer'
      button.style.transition = 'background-color 0.3s ease'
      button.onmouseover = () => (button.style.backgroundColor = '#45a049')
      button.onmouseout = () => (button.style.backgroundColor = '#4CAF50')

      button.onclick = () => selectSource(source.id)
      sourceSelectionContainer.appendChild(button)
    })

    // Show the selection container
    sourceSelectionContainer.style.display = 'flex'
    overlayCanvas.style.cursor = 'default' // Change cursor while selecting monitor
    overlayCanvas.style.pointerEvents = 'none' // Disable drawing on overlay until source selected
  } catch (error) {
    console.error('[renderer] Error listing desktop sources:', error)
    const msg = document.createElement('p')
    msg.textContent = `Error: ${error.message}. Could not list screens.`
    msg.style.color = 'red'
    sourceSelectionContainer.appendChild(msg)
    // Automatically cancel on error
    if (window.screenshotApi && window.screenshotApi.cancelSelection) {
      window.screenshotApi.cancelSelection(activeBillId)
    }
  }
}

// Function to handle source selection and start capture
async function selectSource(sourceId) {
  console.log(`[renderer] Selected source ID: ${sourceId}`)
  currentSelectedSourceId = sourceId

  // Hide the selection UI
  sourceSelectionContainer.style.display = 'none'
  overlayCanvas.style.pointerEvents = 'auto' // Re-enable drawing on overlay
  overlayCanvas.style.cursor = 'crosshair' // Restore crosshair cursor

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: window.innerWidth, // Request exact screen resolution
          maxWidth: window.innerWidth,
          minHeight: window.innerHeight,
          maxHeight: window.innerHeight
        }
      }
    })
    console.log('[renderer] Media stream obtained for selected source.')

    videoElement.srcObject = mediaStream
    videoElement.play()

    videoElement.onloadedmetadata = () => {
      console.log('[renderer] Video metadata loaded for selected source. Drawing initial frame.')
      captureCanvas.width = videoElement.videoWidth
      captureCanvas.height = videoElement.videoHeight
      ctxCapture.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height)
      console.log(
        `[renderer] captureCanvas dimensions: ${captureCanvas.width}x${captureCanvas.height}`
      )
      // Now that the stream is active and drawn, the user can draw a selection
    }
  } catch (error) {
    console.error('[renderer] Error starting media stream for selected source:', error)
    const msg = document.createElement('p')
    msg.textContent = `Error capturing screen: ${error.message}. Please try again.`
    msg.style.color = 'red'
    sourceSelectionContainer.style.display = 'flex' // Show error message
    sourceSelectionContainer.appendChild(msg)
    // Automatically cancel if stream fails
    if (window.screenshotApi && window.screenshotApi.cancelSelection) {
      window.screenshotApi.cancelSelection(activeBillId)
    }
  }
}

// Helper function to stop the media stream
function stopMediaStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
    videoElement.srcObject = null
    console.log('[renderer] Media stream stopped.')
  }
}

// Function to update the selection div's style based on currentSelection
function updateSelectionDiv() {
  if (!selectionDiv) {
    console.error('[renderer] selectionDiv is null in updateSelectionDiv.')
    return
  }
  selectionDiv.style.left = `${currentSelection.x}px`
  selectionDiv.style.top = `${currentSelection.y}px`
  selectionDiv.style.width = `${currentSelection.width}px`
  selectionDiv.style.height = `${currentSelection.height}px`
  animationFrameId = null

  console.log(
    `[renderer] Updating selectionDiv: left=${selectionDiv.style.left}, top=${selectionDiv.style.top}, width=${selectionDiv.style.width}, height=${selectionDiv.style.height}, display=${selectionDiv.style.display}, calculated_width=${currentSelection.width}, calculated_height=${currentSelection.height}`
  )
}

// Function to draw the dimmed overlay (full screen)
function drawDimmedOverlay() {
  ctxOverlay.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
  ctxOverlay.fillStyle = 'rgba(0, 0, 0, 0.5)' // Dimmed black overlay
  ctxOverlay.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height)
}

// Optional: Redraw overlay on window resize
window.addEventListener('resize', () => {
  overlayCanvas.width = window.innerWidth
  overlayCanvas.height = window.innerHeight
  captureCanvas.width = window.innerWidth // Also resize capture canvas
  captureCanvas.height = window.innerHeight
  drawDimmedOverlay()
})
