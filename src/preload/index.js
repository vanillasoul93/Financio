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
      // Updated to include a cleanup function, which is good practice for listeners
      onReceivedData: (callback) => {
        const handler = (event, ...args) => callback(...args)
        ipcRenderer.on('received-data', handler)
        return () => {
          ipcRenderer.removeListener('received-data', handler)
        }
      },
      getAccounts: async (type) => {
        // Send a message to the main process and await the response
        const result = await ipcRenderer.invoke('get-accounts-by-type', type)
        if (result && result.error) {
          console.error('Error from main process:', result.error)
          throw new Error(result.error) // Re-throw to be caught in React component
        }
        return result
      },

      //BillPayment Section
      saveScreenshotToDisk: (billId, billTitle, imageData) =>
        ipcRenderer.invoke('save-screenshot-to-disk', { billId, billTitle, imageData }),

      // Existing method for opening websites
      openWebsite: (url) => ipcRenderer.send('open-website', url),
      // --- NEW: Screen Region Capture IPC Calls ---
      /**
       * Signals the main process to open the screen capture overlay window.
       * Call this when your "select region for screenshot" button is clicked.
       */
      openRegionCapture: () => ipcRenderer.send('open-overlay-window'),

      /**
       * Listens for a notification that a screenshot (from region selection) has been successfully taken.
       * The callback will receive the file path (or any data your main process sends).
       * @param callback Function to handle the success data (e.g., filePath).
       * @returns Function to remove the event listener.
       */
      onRegionCaptureSuccess: (callback) => {
        const handler = (event, ...args) => callback(...args) // Use ...args to be flexible with what main sends
        ipcRenderer.on('screenshot-taken', handler) // Ensure 'screenshot-taken' matches the channel used in main.js
        return () => {
          ipcRenderer.removeListener('screenshot-taken', handler)
        }
      },

      /**
       * Listens for errors that occurred during the region capture or screenshot process.
       * @param callback Function to handle the error message/data.
       * @returns Function to remove the event listener.
       */
      onRegionCaptureError: (callback) => {
        const handler = (event, ...args) => callback(...args) // Use ...args
        ipcRenderer.on('screenshot-error', handler) // Ensure 'screenshot-error' matches the channel used in main.js
        return () => {
          ipcRenderer.removeListener('screenshot-error', handler)
        }
      }
      // --- END: Screen Region Capture IPC Calls ---
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
