const {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  screen,
  nativeImage
} = require('electron')
const path = require('path') // Imports the entire path module
const fs = require('fs') // Imports the entire fs module
const { electronApp, optimizer, is } = require('@electron-toolkit/utils') // Use require for electron-toolkit
// Correct icon path for main process. Assumes 'icon.png' is placed in 'resources' folder at the app's root during build.
const icon = path.join(app.getAppPath(), 'resources', 'icon.png')

let mainWindow // Your main React application window (global)
let screenshotWindow // The transparent window for screenshot selection (global)
let APP_BASE_PATH // To store the application's base path reliably (still useful for other assets)

const sqlite3 = require('sqlite3').verbose()
const dbPath =
  process.env.NODE_ENV === 'development'
    ? path.join(app.getAppPath(), 'src', 'db', 'properpayments.db') // Adjusted for dev path
    : path.join(process.resourcesPath, 'db', 'properpayments.db') // Standard for bundled resources

const db = new sqlite3.Database(dbPath)

function runMigration() {
  console.log('Connecting to DB: ' + dbPath)
  console.log('Database connection initialized.')
}

function createMainWindow() {
  console.log('[main] Attempting to create mainWindow...')
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1050,
    minHeight: 850,
    show: false,
    autoHideMenuBar: true,
    title: 'ProperPayment',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload', 'index.js'), // Correct path for electron-vite build output
      sandbox: false,
      contextIsolation: true // Keep true for security
    }
  })

  mainWindow.webContents.openDevTools()
  mainWindow.setAlwaysOnTop(true, 'screen') // Consider if this should always be true
  mainWindow.setTitle('ProperPayment')

  mainWindow.on('closed', () => {
    console.log('[main] mainWindow closed.')
    mainWindow = null
    if (screenshotWindow && !screenshotWindow.isDestroyed()) {
      screenshotWindow.destroy()
      screenshotWindow = null
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      console.log('[main] mainWindow shown.')
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer', 'index.html'))
  }
  console.log('[main] mainWindow created successfully.')
}

function createScreenshotWindow() {
  console.log('[main] Attempting to create screenshotWindow...')
  const { width, height } = screen.getPrimaryDisplay().bounds

  screenshotWindow = new BrowserWindow({
    width,
    height,
    transparent: true,
    frame: false, // No window frame
    alwaysOnTop: true, // Keep it above other windows
    fullscreen: true, // Make it full screen
    webPreferences: {
      preload: path.join(__dirname, '../preload', 'screenshotSelectionPreload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (!screenshotWindow) {
    console.error(
      '[main] Failed to create screenshotWindow instance. It is undefined after new BrowserWindow().'
    )
    return
  }

  screenshotWindow.loadFile(path.join(__dirname, '../renderer', 'screenshotSelection.html'))

  screenshotWindow.on('closed', () => {
    console.log('[main] screenshotWindow closed.')
    screenshotWindow = null
    // If screenshot window closes unexpectedly, ensure main window is visible
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      console.log('[main] mainWindow shown after unexpected screenshotWindow close.')
    }
  })

  screenshotWindow.on('blur', () => {
    console.log('[main] screenshotWindow blurred (lost focus).')
    // For debugging, we won't hide it here yet.
    // If this log appears when the window disappears, it confirms a focus issue.
  })

  // screenshotWindow.webContents.openDevTools(); // Uncomment for debugging screenshot window
  console.log('[main] screenshotWindow created successfully.')
}

app.whenReady().then(() => {
  APP_BASE_PATH = app.getAppPath()
  console.log('[main] Electron app is ready. APP_BASE_PATH:', APP_BASE_PATH)

  electronApp.setAppUserModelId('com.electron')
  runMigration()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('db-get-bills', async () => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('db-get-subscriptions', async () => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('db-get-creditcards', async () => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('db-get-goals', async () => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('db-get-expenses', async () => {
    /* ... (no changes) ... */
  })
  ipcMain.on('open-website', (event, url) => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('add-bill-subscription', async (event, billData) => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('add-creditcard', async (event, creditCard) => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('update-bill-subscription', async (event, formData) => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('update-creditcard', async (event, cardData) => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('delete-bill-subscription', async (event, billId) => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('delete-creditcard', async (event, cardId) => {
    /* ... (no changes) ... */
  })
  ipcMain.on('update-goal', (event, goalData) => {
    /* ... (no changes) ... */
  })
  ipcMain.handle('delete-goal', async (event, goalId) => {
    /* ... (no changes) ... */
  })
  ipcMain.on('add-goal', (event, goalData) => {
    /* ... (no changes) ... */
  })

  app.on('before-quit', () => {
    console.log('[main] Running Pre Quit')
    db.close((err) => {
      if (err) {
        console.error('[main] Database closing error:', err)
      } else {
        console.log('[main] Database connection closed')
      }
    })
  })

  ipcMain.on('exit-app', () => {
    console.log('[main] Running Quit')
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy()
      mainWindow = null
    }
    if (screenshotWindow && !screenshotWindow.isDestroyed()) {
      screenshotWindow.destroy()
      screenshotWindow = null
    }
    app.quit()
  })

  ipcMain.on('db-call', () => {
    console.log('[main] MAKING DB CALL')
  })

  createMainWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handler to initiate screenshot process from the main renderer
ipcMain.on('take-screenshot', async (event, billId) => {
  console.log(`[main] Received take-screenshot request for billId: ${billId}`)
  try {
    if (!APP_BASE_PATH) {
      console.error('[main] APP_BASE_PATH is not set. Electron app might not be fully ready.')
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('screenshot-taken', null, billId)
      }
      return
    }

    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      mainWindow.hide()
      console.log('[main] mainWindow hidden for screenshot.')
    }

    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    const primaryScreenSource = sources.find(
      (source) => source.display_id === screen.getPrimaryDisplay().id.toString()
    )

    if (!primaryScreenSource) {
      console.error('[main] Primary screen source not found.')
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('screenshot-taken', null, billId)
      }
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show()
        console.log('[main] mainWindow shown after primary source not found.')
      }
      return
    }

    if (!screenshotWindow || screenshotWindow.isDestroyed()) {
      console.log('[main] Creating new screenshotWindow...')
      createScreenshotWindow()
    }

    if (!screenshotWindow || screenshotWindow.isDestroyed() || !screenshotWindow.webContents) {
      console.error('[main] Failed to create or access screenshotWindow. Cannot send source.')
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('screenshot-taken', null, billId)
      }
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show()
        console.log('[main] mainWindow shown after screenshotWindow invalid.')
      }
      return
    }

    console.log('[main] Screenshot window is available. Checking load status...')

    const sendSourceAndShow = () => {
      if (screenshotWindow && !screenshotWindow.isDestroyed() && screenshotWindow.webContents) {
        console.log('[main] Sending set-screen-source and showing screenshot window.')
        // --- FIX: Send only sourceId and billId to renderer for capture ---
        screenshotWindow.webContents.send('set-screen-source', primaryScreenSource.id, billId)
        screenshotWindow.show()
      } else {
        console.warn(
          '[main] Screenshot window was destroyed or invalid before sending source/showing.'
        )
        if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('screenshot-taken', null, billId)
        }
        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
          mainWindow.show()
          console.log('[main] mainWindow shown after screenshotWindow invalid during show.')
        }
      }
    }

    if (screenshotWindow.webContents.isLoading()) {
      console.log('[main] Screenshot window is still loading. Waiting for did-finish-load...')
      screenshotWindow.webContents.once('did-finish-load', sendSourceAndShow)
    } else {
      console.log('[main] Screenshot window already loaded. Sending source immediately.')
      sendSourceAndShow()
    }
  } catch (error) {
    console.error('[main] Error in take-screenshot IPC handler:', error)
    if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('screenshot-taken', null, billId)
    }
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      console.log('[main] mainWindow shown on general error.')
    }
  }
})

// IPC handler to receive selected region and captured image data from the screenshot selection window
ipcMain.on(
  'screenshot-region-selected',
  async (event, { x, y, width, height, sourceId, billId, dataUrl }) => {
    // --- FIX: Now receives dataUrl directly from renderer ---
    console.log(`[main] Received screenshot-region-selected for billId: ${billId}`)
    console.log(`[main] Selection coordinates: x=${x}, y=${y}, width=${width}, height=${height}`)
    console.log(
      `[main] Received dataUrl length from renderer: ${dataUrl ? dataUrl.length : 'null'}`
    ) // Log received dataUrl length

    if (screenshotWindow && !screenshotWindow.isDestroyed()) {
      screenshotWindow.hide()
      console.log('[main] screenshotWindow hidden after selection.')
    }

    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      console.log('[main] mainWindow shown after successful selection.')
    }

    try {
      // --- FIX: Removed desktopCapturer.getSources, tempCaptureWindow, capturePage, and cropping logic ---
      // The image capture and cropping now happen in the renderer process.
      // We directly use the dataUrl received from the renderer.

      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('screenshot-taken', dataUrl, billId) // Send the received dataUrl
      }

      console.log('[main] Screenshot processed and sent to main window.')
    } catch (error) {
      console.error('[main] Error in screenshot-region-selected IPC handler:', error)
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('screenshot-taken', null, billId)
      }
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show()
        console.log('[main] mainWindow shown on error in selection handler.')
      }
    }
  }
)

// IPC handler to cancel screenshot selection
ipcMain.on('cancel-screenshot-selection', (event, billId) => {
  console.log(`[main] Received cancel-screenshot-selection for billId: ${billId}`)
  if (screenshotWindow && !screenshotWindow.isDestroyed()) {
    screenshotWindow.hide()
    console.log('[main] screenshotWindow hidden on cancel.')
  }
  if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('screenshot-taken', null, billId)
  }
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
    mainWindow.show()
    console.log('[main] mainWindow shown after cancellation.')
  }
})
