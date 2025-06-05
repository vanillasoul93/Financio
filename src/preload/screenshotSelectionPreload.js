const { contextBridge, ipcRenderer } = require('electron')
// --- ADDED DEBUG LOG ---
console.log(
  '[preload/screenshotSelectionPreload] Preload script is running and exposing screenshotApi.'
)
// --- END ADDED DEBUG LOG ---

contextBridge.exposeInMainWorld('screenshotApi', {
  // Method for the renderer to send the selected region and captured image back to the main process
  regionSelected: (x, y, width, height, sourceId, billId, dataUrl) => {
    // Added dataUrl
    ipcRenderer.send('screenshot-region-selected', {
      x,
      y,
      width,
      height,
      sourceId,
      billId,
      dataUrl
    })
  },
  // Method for the renderer to signal cancellation
  cancelSelection: (billId) => {
    ipcRenderer.send('cancel-screenshot-selection', billId)
  },
  // --- FIX: Expose onStartCaptureStream instead of onSetScreenSource ---
  onStartCaptureStream: (callback) => {
    // Changed from onSetScreenSource
    ipcRenderer.on('start-capture-stream', callback) // Channel is 'start-capture-stream'
    // Return a cleanup function for this listener
    return () => ipcRenderer.removeListener('start-capture-stream', callback) // Changed channel
  },
  // --- END FIX ---
  // Expose desktopCapturer.getSources for the renderer to list available screens/windows
  getDesktopSources: (opts) => desktopCapturer.getSources(opts),
  // Expose ipcRenderer.removeListener for cleanup in the renderer (if needed for other listeners)
  removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener)
})
