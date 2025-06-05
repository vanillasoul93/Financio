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
// --- CHANGE: Use a Map to store multiple screenshot windows, keyed by display ID ---
const screenshotWindows = new Map() // Map<displayId, BrowserWindow>
let activeBillIdForScreenshot = null // To keep track of the billId for the current screenshot session
let APP_BASE_PATH // To store the application's base path reliably (still useful for other assets)

const sqlite3 = require('sqlite3').verbose()
// --- FIX: Reverted dbPath logic to original, assuming DB is part of resources ---
const dbPath =
  process.env.NODE_ENV === 'development'
    ? path.join(app.getAppPath(), 'src', 'db', 'properpayments.db') // Adjusted for dev path
    : path.join(process.resourcesPath, 'db', 'properpayments.db') // Standard for bundled resources
// --- END FIX ---

const db = new sqlite3.Database(dbPath)

function runMigration() {
  console.log('Connecting to DB: ' + dbPath)
  // Add your migration logic here if needed
  // Example: db.run('CREATE TABLE IF NOT EXISTS my_table (id INTEGER PRIMARY KEY, name TEXT)');
  console.log('Database connection initialized.')
  // No need to disconnect immediately after connecting, keep it open for app lifetime
}

function createMainWindow() {
  console.log('Attempting to create mainWindow...')
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
      // --- FIX: Use __dirname for preload path relative to main process output ---
      preload: path.join(__dirname, '../preload', 'index.js'), // Correct path for electron-vite build output
      sandbox: false,
      nodeIntegration: false, // Keep false for security with contextIsolation true
      contextIsolation: true // Keep true for security
    }
  })

  mainWindow.webContents.openDevTools()
  mainWindow.setAlwaysOnTop(true, 'screen') // Consider if this should always be true
  mainWindow.setTitle('ProperPayment')

  mainWindow.on('closed', () => {
    console.log('mainWindow closed.')
    mainWindow = null
    // Close all screenshot windows if main window closes
    closeAllScreenshotWindows()
  })

  mainWindow.on('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Defensive check
      mainWindow.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // --- FIX: Use __dirname for renderer index.html path relative to main process output ---
    mainWindow.loadFile(path.join(__dirname, '../renderer', 'index.html')) // Correct path for electron-vite build output
  }
  console.log('mainWindow created successfully.')
}

// --- NEW FUNCTION: Create a screenshot window for a specific display ---
async function createScreenshotWindowForDisplay(display, billId) {
  console.log(
    `[main] Creating screenshotWindow for display ID: ${display.id} (Bounds: ${JSON.stringify(display.bounds)})`
  )

  const screenshotWin = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    fullscreen: false, // We set custom bounds, not fullscreen mode
    webPreferences: {
      preload: path.join(__dirname, '../preload', 'screenshotSelectionPreload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (!screenshotWin) {
    console.error(`[main] Failed to create screenshotWin for display ID: ${display.id}`)
    return null
  }

  screenshotWin.loadFile(path.join(__dirname, '../renderer', 'screenshotSelection.html'))

  screenshotWin.webContents.openDevTools() // Keep open for debugging each window

  screenshotWin.on('closed', () => {
    console.log(`[main] screenshotWindow for display ID: ${display.id} closed.`)
    screenshotWindows.delete(display.id) // Remove from our map
  })

  screenshotWin.on('ready-to-show', async () => {
    // Get the desktopCapturer source ID for this specific display
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    const displaySource = sources.find((source) => source.display_id === display.id.toString())

    if (displaySource) {
      console.log(
        `[main] Sending start-capture-stream to renderer for display ID: ${display.id}, source ID: ${displaySource.id}`
      )
      // Send the specific source ID for this display to its renderer
      screenshotWin.webContents.send('start-capture-stream', displaySource.id, billId)
      screenshotWin.show()
      screenshotWin.focus() // Ensure the window gets focus
      console.log(`[main] screenshotWindow for display ID: ${display.id} shown and focused.`)
    } else {
      console.error(
        `[main] Desktop capturer source not found for display ID: ${display.id}. Closing window.`
      )
      screenshotWin.destroy() // Close this window if source not found
    }
  })

  screenshotWindows.set(display.id, screenshotWin) // Add to our map
  return screenshotWin
}

// --- NEW FUNCTION: Close all active screenshot windows ---
function closeAllScreenshotWindows() {
  console.log('[main] Closing all screenshot windows.') // Changed to log
  screenshotWindows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.destroy()
    }
  })
  screenshotWindows.clear() // Clear the map
}

// Add this near your other ipcMain handlers
ipcMain.on('screenshot-window-ready', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.show()
    win.focus()
  }
})

app.whenReady().then(() => {
  // APP_BASE_PATH is still useful for assets like 'icon.png' that are copied to the app root/resources
  APP_BASE_PATH = app.getAppPath()
  console.log('Electron app is ready. APP_BASE_PATH:', APP_BASE_PATH)

  electronApp.setAppUserModelId('com.electron')
  runMigration()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  //retrieve Bills
  ipcMain.handle('db-get-bills', async () => {
    console.log('Retrieving Bills from DB')
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bills_subscriptions WHERE type = "Bill"', (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  })

  //retrieve Subscriptions
  ipcMain.handle('db-get-subscriptions', async () => {
    console.log('Retrieving Subscriptions from DB')
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM bills_subscriptions WHERE type = "Subscription"', (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  })

  //retrieve credit cards
  ipcMain.handle('db-get-creditcards', async () => {
    console.log('Retrieving credit cards from DB')
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM credit_cards', (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  })

  //retrieve Goals
  ipcMain.handle('db-get-goals', async () => {
    console.log('Retrieving Goals from DB')
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM goals', (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  })

  //retrieve Expenses
  ipcMain.handle('db-get-expenses', async () => {
    console.log('Retrieving Expenses from DB')
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM expense', (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  })

  //open website
  ipcMain.on('open-website', (event, url) => {
    console.log('Opening website: ' + url)
    if (url.includes('https://') || url.includes('http://')) {
      shell.openExternal(url)
    } else {
      shell.openExternal('https://' + url)
    }
  })

  //Add bill or subscription to API (they are in the same database table and differntiated by field 'type')
  ipcMain.handle('add-bill-subscription', async (event, billData) => {
    console.log('BILL/Subscription TYPE IN ADD BILL MAIN: ' + billData.type)
    const sql = `
    INSERT INTO bills_subscriptions (
      name,
      amount_due,
      website,
      date_due,
      frequency_in_months,
      automatic,
      highest_payment,
      previous_payment,
      type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      billData.name,
      billData.amount_due,
      billData.website,
      billData.date_due,
      billData.frequency_in_months,
      billData.automatic,
      billData.highest_payment,
      billData.previous_payment,
      billData.type
    ]
    // Log 'this' at the start
    try {
      // 1. Execute the INSERT operation and await its completion
      await new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) {
            reject({ success: false, error: err.message })
            return
          }
          resolve({ success: true }) // Resolve when insertion is done
        })
      })
      // 2. Query for the last inserted row ID and await its result
      const lastIdResult = await new Promise((resolve, reject) => {
        db.get('SELECT last_insert_rowid() AS lastId', (err, row) => {
          if (err) {
            reject({ success: false, error: err.message })
            return
          }
          resolve(row ? row.lastId : null)
        })
      })
      return { success: true, billId: lastIdResult }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to add bill/subscription' }
    }
  })

  //Add CreditCard to Database
  ipcMain.handle('add-creditcard', async (event, creditCard) => {
    const sql = `
    INSERT INTO credit_cards (
      name,
      website,
      credit_balance,
      credit_limit,
      date_due,
      previous_payment
    ) VALUES (?, ?, ?, ?, ?, ?)
    `
    console.log('Adding credit card with the following props -------------')
    console.log('name: ' + creditCard.name)
    console.log('website: ' + creditCard.website)
    console.log('credit_balance: ' + creditCard.credit_balance)
    console.log('credit_limit: ' + creditCard.credit_limit)
    console.log('date_due: ' + creditCard.date_due)
    console.log('previous_payment: ' + creditCard.previous_payment)
    const params = [
      creditCard.name,
      creditCard.website,
      creditCard.credit_balance,
      creditCard.credit_limit,
      creditCard.date_due,
      creditCard.previous_payment
    ]
    try {
      const runResult = await new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) {
            console.error('Database Error during INSERT:', err) // Log the entire error object
            reject({ success: false, error: err.message })
            return
          }
          resolve({ success: true, lastID: this.lastID })
        })
      })

      if (!runResult.success) {
        return runResult
      }

      return { success: true, billId: runResult.lastID }
    } catch (error) {
      console.error('Error in add-creditcard handler:', error) // Log errors in the handler itself
      return { success: false, error: error.message }
    }
  })

  // Update Bill or Subscription Info API
  ipcMain.handle('update-bill-subscription', async (event, formData) => {
    console.log('UPDATE HANDLER MADE IT TO MAIN.js')
    console.log('ATTEMPTING TO UPDATE BILL/Subscription WITH INFORMATION!-----------------')
    console.log('id: ' + formData.id)
    console.log('name: ' + formData.name)
    console.log('amount due: ' + formData.amount_due)
    console.log('website: ' + formData.website)
    console.log('due date: ' + formData.date_due)
    console.log('frequency in months: ' + formData.frequency_in_months)
    console.log('automatic: ' + formData.automatic)
    console.log('highest payment: ' + formData.highest_payment)
    console.log('previous payment: ' + formData.previous_payment)
    console.log('---------------------------------------------------')

    const sql = `UPDATE bills_subscriptions SET name = ?, amount_due = ?, website = ?, date_due = ?, frequency_in_months = ?, automatic = ?, highest_payment = ?, previous_payment = ? WHERE id = ?`
    const params = [
      formData.name,
      formData.amount_due,
      formData.website,
      formData.date_due,
      formData.frequency_in_months,
      formData.automatic,
      formData.highest_payment,
      formData.previous_payment,
      formData.id
    ]

    try {
      await new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) {
            reject({ success: false, error: err.message })
            return
          }
          resolve({ success: true, formData: formData })
        })
      })

      return { success: true, formData: formData }
    } catch (error) {
      return error
    }
  })

  // Update Credit Card Info API
  ipcMain.handle('update-creditcard', async (event, cardData) => {
    console.log('UPDATE HANDLER MADE IT TO MAIN.js')
    console.log('ATTEMPTING TO UPDATE CREDIT CARD WITH INFORMATION!-----------------')
    console.log('id: ' + cardData.id)
    console.log('name: ' + cardData.name)
    console.log('website: ' + cardData.website)
    console.log('credit_balance: ' + cardData.credit_balance)
    console.log('credit_limit: ' + cardData.credit_limit)
    console.log('date_due: ' + cardData.date_due)
    console.log('previous_payment: ' + cardData.previous_payment)
    console.log('---------------------------------------------------')

    const sql = `UPDATE credit_cards SET name = ?, website = ?, credit_balance = ?, credit_limit = ?, date_due = ?, previous_payment = ? WHERE id = ?`
    const params = [
      cardData.name,
      cardData.website,
      cardData.credit_balance,
      cardData.credit_limit,
      cardData.date_due,
      cardData.previous_payment,
      cardData.id
    ]

    try {
      await new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) {
            console.error('Database Error during INSERT:', err) // Log the entire error object
            reject({ success: false, error: err.message })
            return
          }
          resolve({ success: true, lastID: this.lastID })
        })
      })

      return { success: true, cardData: cardData }
    } catch (error) {
      console.error('Error in update-creditcard handler:', error) // Log errors in the handler itself
      return { success: false, error: error.message }
    }
  })

  //Delete Bill API
  ipcMain.handle('delete-bill-subscription', async (event, billId) => {
    try {
      await new Promise((resolve, reject) => {
        db.run(`DELETE FROM bills_subscriptions WHERE id = ?`, billId, function (err) {
          if (err) {
            reject({ success: false, error: err.message })
            return
          }
          resolve({ success: true, billId: billId })
        })
      })

      return { success: true, billId: billId }
    } catch (error) {
      return error
    }
  })

  //Delete CreditCard
  ipcMain.handle('delete-creditcard', async (event, cardId) => {
    try {
      await new Promise((resolve, reject) => {
        db.run(`DELETE FROM credit_cards WHERE id = ?`, cardId, function (err) {
          if (err) {
            reject({ success: false, error: err.message })
            return
          }
          resolve({ success: true, cardId: cardId })
        })
      })

      return { success: true, cardId: cardId }
    } catch (error) {
      return error
    }
  })

  // Update goal after a goal is edited.
  ipcMain.on('update-goal', (event, goalData) => {
    console.log('id: ' + goalData.id)
    console.log('name: ' + goalData.name)
    console.log('description: ' + goalData.description)
    console.log('goal_value: ' + goalData.goal_value)
    console.log('current_value: ' + goalData.current_value)
    console.log('monthly_investment: ' + goalData.monthly_investment)
    console.log('goal_icon_name:' + goalData.icon)

    const sql = `UPDATE goals SET name = ?, description = ?, goal_value = ?, current_value = ?, icon = ?, monthly_investment = ? WHERE id = ?`
    const params = [
      goalData.name,
      goalData.description,
      goalData.goal_value,
      goalData.current_value,
      goalData.icon,
      goalData.monthly_investment,
      goalData.id
    ]

    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error updating item:', err.message)
        event.sender.send('update-item-response', { success: false, error: err.message })
        return
      }
      console.log(`Row(s) updated: ${this.changes}`)
    })
  })

  //Delete Goal API
  ipcMain.handle('delete-goal', async (event, goalId) => {
    try {
      await new Promise((resolve, reject) => {
        db.run(`DELETE FROM goals WHERE id = ?`, goalId, function (err) {
          if (err) {
            reject({ success: false, error: err.message })
            return
          }
          resolve({ success: true, goalId: goalId })
        })
      })

      return { success: true, goalId: goalId }
    } catch (error) {
      return error
    }
  })

  //Add Goal API
  ipcMain.on('add-goal', (event, goalData) => {
    console.log('name: ' + goalData.name)
    console.log('description: ' + goalData.description)
    console.log('goal_value: ' + goalData.goal_value)
    console.log('current_value: ' + goalData.current_value)
    console.log('monthly_investment: ' + goalData.monthly_investment)
    console.log('icon: ' + goalData.icon)

    // Prepare the SQL insert statement
    const sql = `
  INSERT INTO goals (name, description, goal_value, current_value, icon, monthly_investment)
  VALUES (?, ?, ?, ?, ?, ?)
  `

    // Execute the insert statement
    db.run(
      sql,
      [
        goalData.name,
        goalData.description,
        goalData.goal_value,
        goalData.current_value,
        goalData.icon,
        goalData.monthly_investment
      ],
      function (err) {
        if (err) {
          console.error('Failed to insert data:', err.message)
        } else {
          console.log(`Row inserted with ID: ${this.lastID}`)
        }

        // Close the database connection (only if you intend to close it immediately after insert, which is unusual for a running app)
        // db.close(); // Consider if this is truly desired here
      }
    )

    console.log('Data has been written to the database for Goal ' + goalData.name)
  })

  // Make a Pre Exit App to close DB Connections
  app.on('before-quit', () => {
    console.log('Running Pre Quit')
    db.close((err) => {
      if (err) {
        console.error('Database closing error:', err)
      } else {
        console.log('Database connection closed')
      }
    })
  })

  //Exit App
  ipcMain.on('exit-app', () => {
    console.log('Running Quit')
    //Close the screenshot window on application closed also
    // These are already handled by mainWindow.on('closed') and app.on('window-all-closed')
    // but keeping for explicit clarity if needed.
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Check if mainWindow exists and is not destroyed
      mainWindow.destroy()
      mainWindow = null
    }
    closeAllScreenshotWindows() // Ensure all screenshot windows are closed
    app.quit()
  })

  ipcMain.on('db-call', () => {
    console.log('MAKING DB CALL')
  })

  createMainWindow() // Call to create the main window

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow() // Call createMainWindow
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

console.log('[main] Registering ipcMain.handle for get-desktop-sources.')
ipcMain.handle('get-desktop-sources', async (event, opts) => {
  console.log('[main] Received request for desktop sources.')
  try {
    const sources = await desktopCapturer.getSources(opts)
    console.log(`[main] Found ${sources.length} desktop sources.`)
    return sources
  } catch (error) {
    console.error('[main] Error getting desktop sources:', error)
    throw error
  }
})

// IPC handler to initiate screenshot process from the main renderer
ipcMain.on('take-screenshot', async (event, billId) => {
  console.log(`[main] Received take-screenshot request for billId: ${billId}`)
  activeBillIdForScreenshot = billId // Store the billId for the session

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

    // --- CHANGE: Create a screenshot window for EACH display ---
    const allDisplays = screen.getAllDisplays()
    if (allDisplays.length === 0) {
      console.error('[main] No displays found to create screenshot windows.')
      if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('screenshot-taken', null, billId)
      }
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        mainWindow.show()
        console.log('[main] mainWindow shown as no displays found.')
      }
      return
    }

    // Close any existing screenshot windows before creating new ones
    closeAllScreenshotWindows()

    for (const display of allDisplays) {
      await createScreenshotWindowForDisplay(display, billId)
    }
    console.log(`[main] Created ${screenshotWindows.size} screenshot windows.`)
  } catch (error) {
    console.error('[main] Error in take-screenshot IPC handler:', error)
    if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('screenshot-taken', null, billId)
    }
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      console.log('[main] mainWindow shown on general error.')
    }
    closeAllScreenshotWindows() // Ensure windows are closed on error
  }
})

// IPC handler to receive selected region and captured image data from ANY screenshot window
ipcMain.on(
  'screenshot-region-selected',
  async (event, { x, y, width, height, sourceId, billId, dataUrl }) => {
    console.log(`[main] Received screenshot-region-selected from a renderer for billId: ${billId}`)
    console.log(`[main] Selection coordinates: x=${x}, y=${y}, width=${width}, height=${height}`)
    console.log(
      `[main] Received dataUrl length from renderer: ${dataUrl ? dataUrl.length : 'null'}`
    )

    // Close all screenshot windows regardless of which one sent the signal
    closeAllScreenshotWindows()

    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      console.log('[main] mainWindow shown after successful selection.')
    }

    try {
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

// IPC handler to cancel screenshot selection from ANY screenshot window
ipcMain.on('cancel-screenshot-selection', (event, billId) => {
  console.log(`[main] Received cancel-screenshot-selection from a renderer for billId: ${billId}`)
  // --- TEMPORARY DEBUGGING FIX: DO NOT HIDE WINDOW ---
  // if (screenshotWindows && !screenshotWindows.isDestroyed()) {
  //   screenshotWindow.hide();
  //   console.log('[main] screenshotWindow hidden on cancel.');
  // }
  console.log('[main] DEBUGGING: Screenshot windows are NOT hidden on cancel to allow inspection.')
  // --- END TEMPORARY DEBUGGING FIX ---

  if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('screenshot-taken', null, billId)
  }
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
    mainWindow.show()
    console.log('[main] mainWindow shown after cancellation.')
  }
})

ipcMain.handle('save-screenshot-to-disk', async (event, { billId, billTitle, imageData }) => {
  console.log(
    `[main] Received request to save screenshot for Bill ID: ${billId}, Title: ${billTitle}`
  )
  try {
    if (!imageData || !imageData.startsWith('data:image/png;base64,')) {
      throw new Error('Invalid or missing image data.')
    }

    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    const documentsPath = app.getPath('documents')
    const appDataDir = path.join(documentsPath, 'ProperPayments')

    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true })
      console.log(`[main] Created base directory: ${appDataDir}`)
    }

    const now = new Date()
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]
    const monthYearFolder = `${monthNames[now.getMonth()]}_${now.getFullYear()}`
    const saveDirectory = path.join(appDataDir, monthYearFolder)

    if (!fs.existsSync(saveDirectory)) {
      fs.mkdirSync(saveDirectory, { recursive: true })
      console.log(`[main] Created month/year directory: ${saveDirectory}`)
    }

    const sanitizedTitle = billTitle.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_')
    const timestamp = now.getTime()
    const fileName = `${sanitizedTitle}_${billId}_${timestamp}.png`
    const filePath = path.join(saveDirectory, fileName)

    await fs.promises.writeFile(filePath, imageBuffer)
    console.log(`[main] Screenshot saved successfully to: ${filePath}`)
    return { success: true, filePath: filePath }
  } catch (error) {
    console.error('[main] Error saving screenshot to disk:', error)
    return { success: false, error: error.message }
  }
})
