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
let activeOverlayWindows = new Map() // To store active overlay windows <BrowserWindow.id, BrowserWindow>

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

function createOverlayWindow() {
  // 1. Get the primary display's information
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.size // Gets the resolution (e.g., 1920x1080)
  const { x, y } = primaryDisplay.bounds // Gets the top-left coordinates of the display

  console.log('Main process __dirname for overlay creation:', __dirname) // For path debugging
  console.log(`Primary display dimensions: ${width}x${height} at (${x},${y})`)

  overlayWindow = new BrowserWindow({
    // 2. Set window size and position to cover the entire monitor
    x: x, // Use bounds.x for multi-monitor or non-standard primary display setups
    y: y, // Use bounds.y
    width: width,
    height: height,

    // 3. Remove window border and title bar
    frame: false,

    // --- Other useful options for an overlay ---
    transparent: true, // Makes parts of the window transparent (if your HTML/CSS allows)
    alwaysOnTop: true, // Keeps the overlay on top of other applications
    skipTaskbar: true, // Prevents the window from appearing in the taskbar
    focusable: true, // Allows the window to receive focus and capture mouse/keyboard events
    // webContents: {
    //   openDevTools: true // Optional: for debugging the overlay window itself
    // },
    webPreferences: {
      preload: path.join(__dirname, '../preload/overlayPreload.js'), // Corrected path
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true // Enables DevTools in the overlay renderer if needed for debugging
    }
  })

  const overlayHtmlPath = path.join(__dirname, '../renderer/overlay.html') // Corrected path
  console.log('Attempting to load overlay.html from:', overlayHtmlPath)
  overlayWindow
    .loadFile(overlayHtmlPath)
    .then(() => {
      console.log('Overlay HTML loaded successfully.')
      // Optionally, ensure it's focused after loading, though 'focusable: true' and being a new window often handles this.
      // overlayWindow.focus();
    })
    .catch((err) => {
      console.error('Failed to load overlay HTML:', err)
    })

  overlayWindow.on('closed', () => {
    console.log('Overlay window closed.')
    overlayWindow = null
  })
}

function closeAllOverlayWindows() {
  console.log(`Closing ${activeOverlayWindows.size} overlay window(s).`)
  activeOverlayWindows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.close()
    }
  })
  activeOverlayWindows.clear()
}

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

  ipcMain.on('open-overlay-window', () => {
    if (!overlayWindow) {
      createOverlayWindow()
    } else {
      overlayWindow.focus() // If already open, just focus it
    }
  })

  // Listen for the renderer's request to close itself
  ipcMain.on('close-overlay-from-renderer', () => {
    if (overlayWindow) {
      overlayWindow.close()
    }
  })

  ipcMain.on('capture-region', async (event, receivedLogicalRegion) => {
    if (overlayWindow) {
      overlayWindow.close()
    }
    console.log('Region received in main (logical pixels):', receivedLogicalRegion)

    try {
      const allDisplays = screen.getAllDisplays()
      console.log('Electron screen.getAllDisplays():', JSON.stringify(allDisplays, null, 2))

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 3000, height: 2000 } // Request full resolution
      })

      // --- LOG ALL DETECTED SOURCES ---
      console.log(`desktopCapturer found ${sources.length} screen source(s):`)
      sources.forEach((source) => {
        const sourceImageSize = source.thumbnail.getSize()
        console.log(
          `  Source ID: ${source.id}, Name: ${source.name}, display_id: ${source.display_id || 'N/A'}, Thumbnail Size: ${sourceImageSize.width}x${sourceImageSize.height}, Is Empty: ${source.thumbnail.isEmpty()}`
        )
      })
      // --- END LOG ALL SOURCES ---

      const primaryDisplay = screen.getPrimaryDisplay()
      // Ensure consistent string comparison for display_id, though it might be undefined on some sources
      const primaryDisplaySource = sources.find(
        (s) => s.display_id && String(s.display_id) === String(primaryDisplay.id)
      )

      if (!primaryDisplaySource) {
        console.error(
          `Primary display source (ID: ${primaryDisplay.id}) NOT found among desktopCapturer sources that have a matching display_id. Will try falling back to the first screen source if available.`
        )
        // Fallback strategy: if the specific primary isn't found by display_id,
        // what is sources[0]? This part needs careful consideration.
        // For now, if it's not found, we should probably error out or log which source IS being used.
        if (sources.length > 0) {
          console.log(
            `Using the first available source as a fallback: ID ${sources[0].id}, Name: ${sources[0].name}`
          )
          // primaryDisplaySource = sources[0]; // Re-enable this line if you want to test with the first available source
        } else {
          console.error('No screen sources found by desktopCapturer at all.')
          if (mainWindow)
            mainWindow.webContents.send('screenshot-error', 'No screen sources available.')
          return
        }
        // If primaryDisplaySource is still null here after attempting fallback, exit
        if (!primaryDisplaySource) {
          console.error('Could not determine a valid screen source to capture.')
          if (mainWindow)
            mainWindow.webContents.send('screenshot-error', 'Could not determine screen source.')
          return
        }
      }

      const fullScreenImage = primaryDisplaySource.thumbnail
      const imageSize = fullScreenImage.getSize()
      const physicalImageWidth = imageSize.width
      const physicalImageHeight = imageSize.height
      const scaleFactor = primaryDisplay.scaleFactor // Get scaleFactor from the Electron 'screen' module's primaryDisplay object

      console.log('--- Screenshot Debug Info (Post-Source Selection) ---')
      console.log(
        'Primary Display (from screen module) ID:',
        primaryDisplay.id,
        'Bounds:',
        primaryDisplay.bounds,
        'Size:',
        primaryDisplay.size
      )
      console.log(
        'Selected Display Source for Capture: ID:',
        primaryDisplaySource.id,
        'Name:',
        primaryDisplaySource.name,
        'display_id:',
        primaryDisplaySource.display_id
      )
      console.log('Returned NativeImage physical size (from selected source):', imageSize) // VERY IMPORTANT!
      console.log('Selected Display Scale Factor:', scaleFactor)
      console.log('Received logical region:', receivedLogicalRegion)

      if (physicalImageWidth === 0 || physicalImageHeight === 0) {
        console.error(
          'ERROR: Selected desktopCapturer source returned an image with zero width or height.'
        )
        if (mainWindow)
          mainWindow.webContents.send(
            'screenshot-error',
            'Failed to capture screen image (zero dimensions from selected source).'
          )
        return
      }

      // ... (rest of your scaling and cropping logic from the previous good version) ...
      // Adjust received region coordinates by scaleFactor for physical pixels
      const physicalRegion = {
        x: Math.floor(receivedLogicalRegion.x * scaleFactor),
        y: Math.floor(receivedLogicalRegion.y * scaleFactor),
        width: Math.floor(receivedLogicalRegion.width * scaleFactor),
        height: Math.floor(receivedLogicalRegion.height * scaleFactor)
      }
      console.log('Calculated physical region:', physicalRegion)

      let cropX = physicalRegion.x
      let cropY = physicalRegion.y
      let cropWidth = physicalRegion.width
      let cropHeight = physicalRegion.height

      cropX = Math.max(0, Math.min(cropX, physicalImageWidth - 1))
      cropY = Math.max(0, Math.min(cropY, physicalImageHeight - 1))

      cropWidth = Math.max(0, Math.min(physicalRegion.width, physicalImageWidth - cropX))
      cropHeight = Math.max(0, Math.min(physicalRegion.height, physicalImageHeight - cropY))

      const finalCropRect = { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
      console.log('Final crop rectangle for NativeImage.crop (physical pixels):', finalCropRect)

      if (finalCropRect.width <= 0 || finalCropRect.height <= 0) {
        console.error(
          'FATAL: Calculated crop rectangle has zero or negative width/height.',
          finalCropRect
        )
        if (mainWindow)
          mainWindow.webContents.send(
            'screenshot-error',
            `Invalid crop dimensions: W ${finalCropRect.width}, H ${finalCropRect.height}. Image size: ${physicalImageWidth}x${physicalImageHeight}. Scaled region: ${JSON.stringify(physicalRegion)}`
          )
        return
      }

      const croppedImage = fullScreenImage.crop(finalCropRect)

      if (croppedImage.isEmpty()) {
        console.error('ERROR: Cropped image is empty.')
        if (mainWindow) mainWindow.webContents.send('screenshot-error', 'Cropped image is empty.')
        return
      }
      console.log('Cropped image successful. Size:', croppedImage.getSize())

      const dataURL = croppedImage.toDataURL()
      if (mainWindow) {
        mainWindow.webContents.send('screenshot-taken', dataURL)
        console.log('Screenshot processed and dataURL sent to renderer.')
      } else {
        console.warn('Main window not found, cannot send screenshot back to renderer.')
      }
    } catch (e) {
      console.error('Error during screenshot capture process:', e)
      if (mainWindow) mainWindow.webContents.send('screenshot-error', e.message)
    }
  })

  //END OF WINDOW.READY
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
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
