const { contextBridge, ipcRenderer } = require('electron')

console.log('[preload/screenshotSelectionPreload] Preload script is running.')

// --- ADDED DEBUG LOG ---
console.log(
  '[preload/screenshotSelectionPreload] Preload script is running and exposing screenshotApi.'
)
// --- END ADDED DEBUG LOG ---

contextBridge.exposeInMainWorld('screenshotApi', {
  regionSelected: (x, y, width, height, sourceId, billId) => {
    ipcRenderer.send('screenshot-region-selected', {
      x,
      y,
      width,
      height,
      sourceId,
      billId
    })
  },
  cancelSelection: (billId) => {
    ipcRenderer.send('cancel-screenshot-selection', billId)
  }
})
