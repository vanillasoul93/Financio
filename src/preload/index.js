import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      //Bill/Subscription API Calls
      getBills: () => ipcRenderer.invoke('db-get-bills'),
      updateBillOrSubscription: (billData) =>
        ipcRenderer.invoke('update-bill-subscription', billData),
      deleteBillOrSubscription: (id) => ipcRenderer.invoke('delete-bill-subscription', id),
      addBillOrSubscription: (data) => ipcRenderer.invoke('add-bill-subscription', data),
      getSubscriptions: () => ipcRenderer.invoke('db-get-subscriptions'),
      //Credit Card API Calls
      getCreditCards: () => ipcRenderer.invoke('db-get-creditcards'),
      addCreditCard: (data) => ipcRenderer.invoke('add-creditcard', data),
      updateCreditCard: (cardData) => ipcRenderer.invoke('update-creditcard', cardData),
      deleteCreditCard: (id) => ipcRenderer.invoke('delete-creditcard', id),

      //Goal API Calls
      getGoals: () => ipcRenderer.invoke('db-get-goals'),
      addGoal: (goal) => ipcRenderer.send('add-goal', goal),
      getGoalUpdates: () => ipcRenderer.invoke('db-get-goals'),
      updateGoal: (goal) => ipcRenderer.send('update-goal', goal),
      deleteGoal: (id) => ipcRenderer.invoke('delete-goal', id),

      //Misc API calls
      onReceivedData: (callback) => ipcRenderer.on('received-data', callback),

      // Method to request a screenshot
      takeScreenshot: (billId) => ipcRenderer.send('take-screenshot', billId),
      // Listener for when a screenshot is taken and returned
      // Now returns a cleanup function
      onScreenshotTaken: (callback) => {
        ipcRenderer.on('screenshot-taken', callback)
        // Return a function to clean up this specific listener
        return () => ipcRenderer.removeListener('screenshot-taken', callback)
      },

      //BillPayment Section
      saveScreenshotToDisk: (billId, billTitle, imageData) =>
        ipcRenderer.invoke('save-screenshot-to-disk', { billId, billTitle, imageData }),

      // Existing method for opening websites
      openWebsite: (url) => ipcRenderer.send('open-website', url)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
