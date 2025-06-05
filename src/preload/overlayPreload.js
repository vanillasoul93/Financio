// preloadOverlay.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('overlayAPI', {
  // data will be { region: {x,y,w,h}, displayId: "id_string" }
  sendRegion: (data) => ipcRenderer.send('capture-region', data),
  // Renamed from closeOverlay to be more specific, or you can keep closeOverlay if it just closes all
  cancelCapture: () => ipcRenderer.send('cancel-region-capture')
})
