//-------------------------------------------------------------------
// Imports
//-------------------------------------------------------------------
const {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  screen
  // nativeImage // Not explicitly used in this file's logic, but available if needed
} = require('electron')
const path = require('path')
const fs = require('fs')
const { electronApp, optimizer, is } = require('@electron-toolkit/utils')
const sqlite3 = require('sqlite3').verbose()

//-------------------------------------------------------------------
// Constants and Global State
//-------------------------------------------------------------------
const ICONS_DIR = 'resources' // Relative to app path for built app
const DB_DIR_DEV = ['src', 'db']
const DB_DIR_PROD = 'db'
const DB_FILENAME = 'properpayments.db'

const iconPath = path.join(app.getAppPath(), ICONS_DIR, 'icon.png')
const dbPath = is.dev // Use electron-toolkit's 'is.dev' for consistency
  ? path.join(app.getAppPath(), ...DB_DIR_DEV, DB_FILENAME)
  : path.join(process.resourcesPath, DB_DIR_PROD, DB_FILENAME)

let mainWindow // Main application window
let activeOverlayWindows = new Map() // Stores active overlay windows
let db = new sqlite3.Database(dbPath) // Database connection object

//-------------------------------------------------------------------
// Main Application Setup and Window Management
//-------------------------------------------------------------------

/**
 * Initializes the database connection and runs migrations if necessary.
 */
function initializeDatabase() {
  console.log('Connecting to DB:', dbPath)
  // TODO: Add actual migration logic here if needed
  // e.g., db.serialize(() => { db.run('CREATE TABLE IF NOT EXISTS ...'); });
  console.log('Database connection initialized.')
}

// --- KNEX SETUP ---
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    // Store the database file in the user's app data folder.
    // This is the recommended location for application data.
    filename: dbPath
  },
  useNullAsDefault: true // Recommended for SQLite
})

// --- END KNEX SETUP ---

/**
 * Gets a basic overview for all investment accounts. (FINAL VERSION)
 * @returns {Promise<Array|{error: string}>}
 */
async function getBasicInvestmentOverview() {
  try {
    // These CTE definitions are correct and do not need to be changed.
    const investmentBuys = knex('transactions')
      .select('account_id')
      .sum('amount as total_invested_amount')
      .count('id as total_investment_count')
      .where('type', 'Investment')
      .groupBy('account_id')

    const currentHoldings = knex('transactions as t')
      .join('investment_details as id', 't.id', 'id.transaction_id')
      .select(
        't.account_id',
        'id.asset_id',
        knex.raw(
          "SUM(CASE WHEN t.flow = 'outflow' THEN id.quantity ELSE -id.quantity END) as current_quantity"
        )
      )
      .groupBy('t.account_id', 'id.asset_id')
      .having('current_quantity', '>', 0)

    const heldAssetCount = knex(currentHoldings.as('current_holdings'))
      .select('account_id', knex.raw('COUNT(asset_id) as distinct_assets_held'))
      .groupBy('account_id')

    // FINAL QUERY: Join the base accounts table with our calculated metrics from the CTEs.
    const finalResult = await knex('accounts as acc')
      .with('investment_buys', investmentBuys)
      .with('held_asset_count', heldAssetCount)
      .leftJoin('investment_buys as buys', 'acc.id', 'buys.account_id')
      .leftJoin('held_asset_count as held', 'acc.id', 'held.account_id')
      .select(
        // --- THIS IS THE ONLY CHANGE ---
        'acc.id as id', // Add the account ID and alias it as 'id' for the DataGrid
        // --- END CHANGE ---
        'acc.name as account',
        'acc.balance as current_balance',
        knex.raw('COALESCE(buys.total_invested_amount, 0) as amount_invested'),
        knex.raw('COALESCE(held.distinct_assets_held, 0) as assets_held'),
        knex.raw('COALESCE(buys.total_investment_count, 0) as investments_made')
      )
      .whereRaw('LOWER(acc.type) = ?', ['investment'])

    return finalResult
  } catch (error) {
    console.error('Error getting basic investment overview:', error)
    return { error: error.message }
  }
}

ipcMain.handle('get-investment-overview', async () => {
  // ADD THIS LINE
  console.log('--- IPC a handler "get-investment-overview" was triggered! ---')
  return await getBasicInvestmentOverview()
})

/**
 * Creates and configures the main application window.
 */
function createMainWindow() {
  console.log('Creating mainWindow...')
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1050,
    minHeight: 850,
    show: false,
    autoHideMenuBar: true,
    title: 'ProperPayment',
    ...(process.platform === 'linux' ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'), // For electron-vite build output
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }
  mainWindow.setAlwaysOnTop(true, 'screen') // REVIEW: Consider if this should always be enabled or user-configurable.
  mainWindow.setTitle('ProperPayment')

  mainWindow.on('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
    }
  })

  mainWindow.on('closed', () => {
    console.log('mainWindow closed.')
    mainWindow = null
    // If main window closes, ensure overlays are also dealt with, though app might be quitting.
    closeAllOverlayWindows(false) // Pass false to not try and show main window again
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  console.log('mainWindow created successfully.')
}

/**
 * Shows and focuses the main application window.
 */
function showAndFocusMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('Showing and focusing mainWindow.')
    mainWindow.show()
    mainWindow.focus()
  } else {
    console.log('Main window not available to show/focus (might be closed or not yet created).')
  }
}

/**
 * Closes all active overlay windows.
 * @param {boolean} [shouldShowMainWindow=true] - Whether to show the main window afterwards.
 */
function closeAllOverlayWindows(shouldShowMainWindow = true) {
  if (activeOverlayWindows.size === 0) {
    if (shouldShowMainWindow) showAndFocusMainWindow() // Ensure main window is shown if no overlays were open
    return
  }
  console.log(`Closing ${activeOverlayWindows.size} overlay window(s).`)
  // Iterate over a copy of values because closing a window will trigger its 'closed' event,
  // which modifies the activeOverlayWindows map.
  const windowsToClose = Array.from(activeOverlayWindows.values())
  windowsToClose.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.close() // This will trigger the 'closed' event for each window
    }
  })
  // The 'closed' event on the last window is now primarily responsible for calling showAndFocusMainWindow.
  // However, if this function is called as a direct command (e.g. cancel), ensure main window is shown.
  // The map clear is now handled by individual 'closed' events.
  // If this function explicitly means "close them all NOW and show main window", then:
  // activeOverlayWindows.clear(); // If doing this, the individual 'closed' handlers need to be robust.
  // if (shouldShowMainWindow) showAndFocusMainWindow();
  // For now, let's rely on the individual 'closed' handlers to call showAndFocusMainWindow when the map becomes empty.
  // This function's job is just to command them to close.
}

//-------------------------------------------------------------------
// Application Lifecycle
//-------------------------------------------------------------------
app.whenReady().then(() => {
  console.log('Electron app is ready. App Path:', app.getAppPath())
  electronApp.setAppUserModelId('com.electron') // Example ID, customize if needed
  initializeDatabase()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  console.log('Application before-quit. Closing database connection.')
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message)
      } else {
        console.log('Database connection closed successfully.')
      }
    })
  }
})

//-------------------------------------------------------------------
// IPC Handlers: Screenshot and Overlay Management
//-------------------------------------------------------------------
ipcMain.on('open-overlay-window', () => {
  if (activeOverlayWindows.size > 0) {
    console.log('Overlay windows are already open. Focusing them.')
    activeOverlayWindows.forEach((win) => {
      if (win && !win.isDestroyed()) win.focus()
    })
    return
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('Hiding mainWindow for overlay.')
    mainWindow.hide()
  }

  const displays = screen.getAllDisplays()
  if (displays.length === 0) {
    console.error("No displays found by Electron's screen module.")
    showAndFocusMainWindow() // Show main window back if error
    return
  }
  console.log(`Found ${displays.length} display(s). Creating overlays.`)

  const overlayHtmlPath = path.join(__dirname, '../renderer/overlay.html')

  displays.forEach((display) => {
    console.log(
      `Creating overlay for display ID: ${display.id} - Bounds: ${JSON.stringify(display.bounds)}`
    )
    const overlayWin = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/overlayPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: is.dev
      }
    })

    overlayWin
      .loadFile(overlayHtmlPath, { query: { displayId: String(display.id) } })
      .then(() => console.log(`Overlay HTML loaded for display ${display.id}`))
      .catch((err) => console.error(`Failed to load overlay for display ${display.id}:`, err))

    if (is.dev) {
      // overlayWin.webContents.openDevTools({ mode: 'detach' }); // Uncomment for debugging overlays
    }

    activeOverlayWindows.set(overlayWin.id, overlayWin)

    overlayWin.on('closed', () => {
      console.log(`Overlay window (BrowserWindow ID ${overlayWin.id}) closed.`)
      activeOverlayWindows.delete(overlayWin.id)
      if (activeOverlayWindows.size === 0) {
        console.log('All overlay windows are now closed. Showing main window.')
      }
    })
  })
})

ipcMain.on('cancel-region-capture', () => {
  console.log('Region capture cancelled by user.')
  closeAllOverlayWindows() // This will trigger the 'closed' event chain leading to showAndFocusMainWindow
  showAndFocusMainWindow()
})

ipcMain.on('capture-region', async (event, data) => {
  const { region: receivedLogicalRegion, displayId: targetDisplayIdStr } = data

  if (!receivedLogicalRegion || !targetDisplayIdStr) {
    console.error('Invalid data received for capture-region:', data)
    closeAllOverlayWindows() // Triggers showing main window
    showAndFocusMainWindow()
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('screenshot-error', 'Invalid data from overlay.')
    return
  }
  console.log(
    `Region received from display ID ${targetDisplayIdStr} (logical pixels):`,
    receivedLogicalRegion
  )
  closeAllOverlayWindows() // Command all overlays to close. The last one closing will trigger showAndFocusMainWindow.

  try {
    const targetDisplay = screen.getAllDisplays().find((d) => String(d.id) === targetDisplayIdStr)
    if (!targetDisplay) {
      console.error(`Target display with ID ${targetDisplayIdStr} not found.`)
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send('screenshot-error', `Display ${targetDisplayIdStr} not found.`)
      showAndFocusMainWindow()
      return // showAndFocusMainWindow already called via closeAllOverlayWindows
    }

    console.log(
      `Target display: ID=${targetDisplay.id}, Bounds=${JSON.stringify(targetDisplay.bounds)}, ScaleFactor=${targetDisplay.scaleFactor}`
    )
    const targetPhysicalWidth = Math.floor(targetDisplay.size.width * targetDisplay.scaleFactor)
    const targetPhysicalHeight = Math.floor(targetDisplay.size.height * targetDisplay.scaleFactor)
    console.log(
      `Requesting screenshot for display ${targetDisplay.id} at physical resolution: ${targetPhysicalWidth}x${targetPhysicalHeight}`
    )

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: targetPhysicalWidth, height: targetPhysicalHeight }
    })

    const targetSource = sources.find(
      (s) => s.display_id && s.display_id.includes(targetDisplayIdStr)
    )
    if (!targetSource) {
      console.error(`DesktopCapturer source not found for display ID ${targetDisplayIdStr}.`)
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send(
          'screenshot-error',
          `Screen source for display ${targetDisplayIdStr} not found.`
        )
      return
    }

    const fullScreenImage = targetSource.thumbnail
    const imageSize = fullScreenImage.getSize()
    if (imageSize.width === 0 || imageSize.height === 0) {
      console.error('ERROR: desktopCapturer source returned an image with zero dimensions.')
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send(
          'screenshot-error',
          'Failed to capture screen image (zero dimensions).'
        )
      return
    }
    console.log(
      `Using source: ${targetSource.name}, Physical size: ${imageSize.width}x${imageSize.height}`
    )

    const physicalRegion = {
      x: Math.floor(receivedLogicalRegion.x * targetDisplay.scaleFactor),
      y: Math.floor(receivedLogicalRegion.y * targetDisplay.scaleFactor),
      width: Math.floor(receivedLogicalRegion.width * targetDisplay.scaleFactor),
      height: Math.floor(receivedLogicalRegion.height * targetDisplay.scaleFactor)
    }

    let cropX = Math.max(0, Math.min(physicalRegion.x, imageSize.width - 1))
    let cropY = Math.max(0, Math.min(physicalRegion.y, imageSize.height - 1))
    let cropWidth = Math.max(0, Math.min(physicalRegion.width, imageSize.width - cropX))
    let cropHeight = Math.max(0, Math.min(physicalRegion.height, imageSize.height - cropY))

    const finalCropRect = { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
    if (finalCropRect.width <= 0 || finalCropRect.height <= 0) {
      console.error(
        'FATAL: Calculated crop rectangle has zero or negative dimensions.',
        finalCropRect
      )
      showAndFocusMainWindow()
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send('screenshot-error', 'Invalid crop dimensions.')
      showAndFocusMainWindow()
      return
    }
    console.log('Final crop rectangle (physical pixels):', finalCropRect)

    const croppedImage = fullScreenImage.crop(finalCropRect)
    if (croppedImage.isEmpty()) {
      console.error('ERROR: Cropped image is empty.')
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send('screenshot-error', 'Cropped image is empty.')
      showAndFocusMainWindow()
      return
    }
    console.log('Cropped image successful. Size:', croppedImage.getSize())

    const dataURL = croppedImage.toDataURL()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('screenshot-taken', dataURL)
      console.log('Screenshot processed and dataURL sent to renderer.')
      showAndFocusMainWindow()
    }
  } catch (error) {
    console.error('Error during screenshot capture:', error)
    showAndFocusMainWindow()
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send('screenshot-error', error.message)
  }
})

ipcMain.handle('save-screenshot-to-disk', async (event, { billId, billTitle, imageData }) => {
  console.log(`Saving screenshot for Bill ID: ${billId}, Title: ${billTitle}`)
  try {
    if (!imageData || !imageData.startsWith('data:image/png;base64,')) {
      throw new Error('Invalid image data format.')
    }
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    const documentsPath = app.getPath('documents')
    const appDataDir = path.join(documentsPath, 'ProperPayments') // App-specific folder
    const now = new Date()
    const monthYearFolder = `${now.toLocaleString('default', { month: 'long' })}_${now.getFullYear()}`
    const saveDirectory = path.join(appDataDir, monthYearFolder)

    await fs.promises.mkdir(saveDirectory, { recursive: true }) // Ensure directory exists

    const sanitizedTitle = billTitle.replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_')
    const timestamp = now.getTime()
    const fileName = `${sanitizedTitle}_${billId}_${timestamp}.png`
    const filePath = path.join(saveDirectory, fileName)

    await fs.promises.writeFile(filePath, imageBuffer)
    console.log(`Screenshot saved to: ${filePath}`)
    return { success: true, filePath: filePath }
  } catch (error) {
    console.error('Error saving screenshot:', error)
    return { success: false, error: error.message }
  }
})

//-------------------------------------------------------------------
// IPC Handlers: Database Operations
//-------------------------------------------------------------------

async function getAccountsByType(type) {
  try {
    const accounts = await knex('accounts').where('type', type).select('*')
    return accounts
  } catch (error) {
    console.error(`Error fetching ${type} accounts:`, error)
    throw error // Re-throw to be caught by IPC handler
  }
}

// --- IPC Main Handlers ---
ipcMain.handle('get-accounts-by-type', async (event, type) => {
  try {
    const accounts = await getAccountsByType(type)
    return accounts
  } catch (error) {
    console.error(`Failed to fetch accounts of type ${type} in main process:`, error)
    // Return an error object or null to the renderer
    return { error: error.message || 'An unknown error occurred' }
  }
})

/**
 * A reliable function to seed the database with sample investment data.
 * This should be placed in your main.js file.
 */
async function seedInvestmentData() {
  // An array of investment events to create. Much cleaner than a long SQL script.
  const investmentEvents = [
    // { symbol, type, quantity, price, fees, date }
    {
      symbol: 'AAPL',
      type: 'Buy',
      quantity: 10,
      price: 195.0,
      fees: 5.0,
      date: '2025-06-09 10:15:00'
    },
    {
      symbol: 'BTC',
      type: 'Buy',
      quantity: 0.05,
      price: 70000.0,
      fees: 2.5,
      date: '2025-06-11 22:45:00'
    },
    {
      symbol: 'TSLA',
      type: 'Buy',
      quantity: 5,
      price: 180.0,
      fees: 5.0,
      date: '2025-06-13 11:00:00'
    },
    {
      symbol: 'AAPL',
      type: 'Sell',
      quantity: 2,
      price: 210.0,
      fees: 1.0,
      date: '2025-06-16 14:30:00'
    },
    {
      symbol: 'GOOGL',
      type: 'Buy',
      quantity: 3,
      price: 175.0,
      fees: 1.0,
      date: '2025-06-18 09:45:00'
    },
    {
      symbol: 'BTC',
      type: 'Sell',
      quantity: 0.01,
      price: 72000.0,
      fees: 0.5,
      date: '2025-06-20 13:05:00'
    }
  ]

  try {
    // Use a Knex transaction to ensure all inserts succeed or fail together.
    await knex.transaction(async (trx) => {
      console.log('Starting investment seeding...')

      for (const event of investmentEvents) {
        // First, get the asset_id and account_id needed for the transaction
        const asset = await trx('assets').where('symbol', event.symbol).first()
        // We'll assume all transactions happen in an account with id=3 for this example
        const accountId = 3

        if (!asset) {
          console.warn(`Asset with symbol ${event.symbol} not found. Skipping.`)
          continue // Skip to the next event in the loop
        }

        const isBuy = event.type === 'Buy'
        const flow = isBuy ? 'outflow' : 'inflow'
        const transactionType = isBuy ? 'Investment' : 'Return'
        const totalValue = event.quantity * event.price + (isBuy ? event.fees : -event.fees)

        // --- THIS IS THE KEY PART ---

        // Step 1: Insert the transaction WITHOUT specifying an ID.
        // The .insert() method returns an array with the new ID.
        const [transactionId] = await trx('transactions').insert({
          account_id: accountId,
          title: `${event.type} ${event.quantity} shares of ${event.symbol}`,
          amount: totalValue,
          flow: flow,
          date_time: event.date,
          type: transactionType
        })

        // Step 2: Use the `transactionId` we just got from the database.
        await trx('investment_details').insert({
          transaction_id: transactionId, // Use the dynamically generated ID
          asset_id: asset.id,
          quantity: event.quantity,
          price_per_unit: event.price,
          fees: event.fees
        })

        console.log(
          `Successfully inserted transaction for ${event.symbol} with new ID: ${transactionId}`
        )
      }
    })
    console.log('Investment seeding completed successfully!')
    return { success: true }
  } catch (error) {
    console.error('Investment seeding failed:', error)
    return { error: error.message }
  }
}

ipcMain.handle('seed-investments', async () => {
  return await seedInvestmentData()
})

/**
 * Helper function to promisify db.all
 * @param {string} sql - SQL query
 * @param {Array} [params=[]] - Query parameters
 * @returns {Promise<Array>}
 */
const dbAllAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('DB Error (dbAllAsync):', err.message, 'SQL:', sql.substring(0, 100))
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

/**
 * Helper function to promisify db.run
 * @param {string} sql - SQL statement
 * @param {Array} [params=[]] - Statement parameters
 * @returns {Promise<{lastID: number, changes: number}>}
 */
const dbRunAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    // Use function() to access `this.lastID` and `this.changes`
    db.run(sql, params, function (err) {
      if (err) {
        console.error('DB Error (dbRunAsync):', err.message, 'SQL:', sql.substring(0, 100))
        reject(err)
      } else {
        resolve({ lastID: this.lastID, changes: this.changes })
      }
    })
  })
}

// --- Database GET handlers ---
ipcMain.handle('db-get-bills', () => {
  console.log('IPC: Retrieving Bills')
  return dbAllAsync('SELECT * FROM bills_subscriptions WHERE type = "Bill"')
})
ipcMain.handle('db-get-subscriptions', () => {
  console.log('IPC: Retrieving Subscriptions')
  return dbAllAsync('SELECT * FROM bills_subscriptions WHERE type = "Subscription"')
})
ipcMain.handle('db-get-creditcards', () => {
  console.log('IPC: Retrieving Credit Cards')
  return dbAllAsync('SELECT * FROM credit_cards')
})
ipcMain.handle('db-get-goals', () => {
  console.log('IPC: Retrieving Goals')
  return dbAllAsync('SELECT * FROM goals')
})
ipcMain.handle('db-get-expenses', () => {
  console.log('IPC: Retrieving Expenses')
  return dbAllAsync('SELECT * FROM expense')
})

// --- Database CUD (Create, Update, Delete) handlers ---
ipcMain.handle('add-bill-subscription', async (event, billData) => {
  console.log('IPC: Adding Bill/Subscription - Type:', billData.type)
  const sql = `INSERT INTO bills_subscriptions (name, amount_due, website, date_due, frequency_in_months, automatic, highest_payment, previous_payment, type) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
  try {
    const { lastID } = await dbRunAsync(sql, params)
    console.log(`Added Bill/Subscription with ID: ${lastID}`)
    return { success: true, billId: lastID }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('add-creditcard', async (event, creditCard) => {
  console.log('IPC: Adding Credit Card - Name:', creditCard.name)
  const sql = `INSERT INTO credit_cards (name, website, credit_balance, credit_limit, date_due, previous_payment) 
               VALUES (?, ?, ?, ?, ?, ?)`
  const params = [
    creditCard.name,
    creditCard.website,
    creditCard.credit_balance,
    creditCard.credit_limit,
    creditCard.date_due,
    creditCard.previous_payment
  ]
  try {
    const { lastID } = await dbRunAsync(sql, params)
    console.log(`Added Credit Card with ID: ${lastID}`)
    return { success: true, cardId: lastID } // Changed billId to cardId for consistency
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update-bill-subscription', async (event, formData) => {
  console.log('IPC: Updating Bill/Subscription - ID:', formData.id)
  const sql = `UPDATE bills_subscriptions SET name = ?, amount_due = ?, website = ?, date_due = ?, 
               frequency_in_months = ?, automatic = ?, highest_payment = ?, previous_payment = ? 
               WHERE id = ?`
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
    const { changes } = await dbRunAsync(sql, params)
    console.log(`Updated Bill/Subscription ID: ${formData.id}, Rows affected: ${changes}`)
    return { success: true, changes }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update-creditcard', async (event, cardData) => {
  console.log('IPC: Updating Credit Card - ID:', cardData.id)
  const sql = `UPDATE credit_cards SET name = ?, website = ?, credit_balance = ?, 
               credit_limit = ?, date_due = ?, previous_payment = ? 
               WHERE id = ?`
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
    const { changes } = await dbRunAsync(sql, params)
    console.log(`Updated Credit Card ID: ${cardData.id}, Rows affected: ${changes}`)
    return { success: true, changes }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-bill-subscription', async (event, billId) => {
  console.log('IPC: Deleting Bill/Subscription - ID:', billId)
  try {
    const { changes } = await dbRunAsync('DELETE FROM bills_subscriptions WHERE id = ?', [billId])
    console.log(`Deleted Bill/Subscription ID: ${billId}, Rows affected: ${changes}`)
    return { success: true, changes }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-creditcard', async (event, cardId) => {
  console.log('IPC: Deleting Credit Card - ID:', cardId)
  try {
    const { changes } = await dbRunAsync('DELETE FROM credit_cards WHERE id = ?', [cardId])
    console.log(`Deleted Credit Card ID: ${cardId}, Rows affected: ${changes}`)
    return { success: true, changes }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Using ipcMain.on for these as per original code, implies fire-and-forget or custom response.
ipcMain.on('update-goal', (event, goalData) => {
  console.log('IPC: Updating Goal - ID:', goalData.id)
  const sql = `UPDATE goals SET name = ?, description = ?, goal_value = ?, 
               current_value = ?, icon = ?, monthly_investment = ? 
               WHERE id = ?`
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
    // Using function for `this.changes`
    if (err) {
      console.error('Error updating goal:', err.message)
      if (!event.sender.isDestroyed())
        event.sender.send('update-item-response', { success: false, error: err.message })
    } else {
      console.log(`Goal ID: ${goalData.id} updated, Rows affected: ${this.changes}`)
      if (!event.sender.isDestroyed())
        event.sender.send('update-item-response', { success: true, changes: this.changes })
    }
  })
})

ipcMain.handle('delete-goal', async (event, goalId) => {
  console.log('IPC: Deleting Goal - ID:', goalId)
  try {
    const { changes } = await dbRunAsync('DELETE FROM goals WHERE id = ?', [goalId])
    console.log(`Deleted Goal ID: ${goalId}, Rows affected: ${changes}`)
    return { success: true, changes }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.on('add-goal', (event, goalData) => {
  console.log('IPC: Adding Goal - Name:', goalData.name)
  const sql = `INSERT INTO goals (name, description, goal_value, current_value, icon, monthly_investment) 
               VALUES (?, ?, ?, ?, ?, ?)`
  const params = [
    goalData.name,
    goalData.description,
    goalData.goal_value,
    goalData.current_value,
    goalData.icon,
    goalData.monthly_investment
  ]
  db.run(sql, params, function (err) {
    // Using function for `this.lastID`
    if (err) {
      console.error('Error adding goal:', err.message)
      // Optionally send error response back if renderer expects it for 'on'
    } else {
      console.log(`Goal added with ID: ${this.lastID}`)
      // Optionally send success response back
    }
  })
})

//-------------------------------------------------------------------
// IPC Handlers: Utility
//-------------------------------------------------------------------
ipcMain.on('open-website', (event, url) => {
  console.log('IPC: Opening website:', url)
  const prefixedUrl =
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
  shell.openExternal(prefixedUrl)
})

ipcMain.on('exit-app', () => {
  console.log('IPC: Received exit-app. Quitting application.')
  app.quit()
})

ipcMain.on('ping', () => console.log('pong')) // Simple test/debug IPC

// Legacy db-call, seems for debugging, can be removed if not used.
ipcMain.on('db-call', () => {
  console.log('IPC: db-call received.')
})
