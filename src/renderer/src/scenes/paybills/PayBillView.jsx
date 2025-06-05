import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import dayjs from 'dayjs'
import { Box, Grid, useTheme, Typography, Fade } from '@mui/material'
import { tokens } from '../../theme'
import BillPaymentCard from '../../components/BillPaymentCard'
import CreditPaymentCard from '../../components/CreditPaymentCard'
import paymentReceipt from '../../images/bill_payment_image.png'
import placetest from '../../images/WavyBlue.jpg'

export default function PayBillView() {
  const [bills, setBills] = useState([])
  const [cards, setCards] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  // State to hold the captured screenshot data for a specific bill
  // Format: { billId: 'someId', imageUrl: 'data:image/png;base64,...' }

  // State to track if screenshot capture is in progress
  const [loadingScreenshot, setLoadingScreenshot] = useState(false)

  useEffect(() => {
    // Set initial date
    const currentDate = dayjs()

    const fetchData = async () => {
      try {
        // Mocking window.api calls for demonstration in this environment
        // In your actual Electron project, ensure window.api methods are correctly exposed
        const billsData =
          window.api && window.api.getBills
            ? await window.api.getBills()
            : [
                {
                  id: 'bill1',
                  name: 'Electricity Bill',
                  amount_due: 120.5,
                  amount_paid: 0,
                  date_due: '2025-06-15',
                  previous_payment: 110.25,
                  website: 'https://example.com/electricity'
                },
                {
                  id: 'bill2',
                  name: 'Internet Bill',
                  amount_due: 65.0,
                  amount_paid: 0,
                  date_due: '2025-06-20',
                  previous_payment: 65.0,
                  website: 'https://example.com/internet'
                },
                {
                  id: 'bill3',
                  name: 'Water Bill',
                  amount_due: 45.75,
                  amount_paid: 0,
                  date_due: '2025-06-10',
                  previous_payment: 40.0,
                  website: 'https://example.com/water'
                }
              ]
        const subscriptionsData =
          window.api && window.api.getSubscriptions ? await window.api.getSubscriptions() : []
        const cardsData =
          window.api && window.api.getCreditCards
            ? await window.api.getCreditCards()
            : [
                {
                  id: 'card1',
                  name: 'Visa Platinum',
                  date_due: '2025-07-01',
                  credit_balance: 1500,
                  credit_limit: 5000,
                  amount_paid_for_period: 0,
                  previous_payment: 100,
                  website: 'https://example.com/visa'
                },
                {
                  id: 'card2',
                  name: 'Mastercard Gold',
                  date_due: '2025-07-05',
                  credit_balance: 800,
                  credit_limit: 3000,
                  amount_paid_for_period: 0,
                  previous_payment: 50,
                  website: 'https://example.com/mastercard'
                }
              ]

        // Initialize bills with a confirmationImageUrl property if it doesn't exist
        const initializedBills = billsData.map((bill) => ({
          ...bill,
          confirmationImageUrl: bill.confirmationImageUrl || paymentReceipt
        }))

        setBills(initializedBills)
        setSubscriptions(subscriptionsData)
        setCards(cardsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        // Implement user-friendly error handling here (e.g., show a toast message)
      }
    }

    fetchData()

    // Centralized listener for screenshot results
    const handleScreenshotTaken = (event, imageData, billId) => {
      console.log(`[renderer/PayBillView] Screenshot taken for billId: ${billId}`)
      // --- START ADDITION: Log imageData length ---
      console.log(
        `[renderer/PayBillView] Received imageData length: ${imageData ? imageData.length : 'null'}`
      )
      // --- END ADDITION ---
      setLoadingScreenshot(false) // Stop loading regardless of success or failure

      // --- FIX: Update the specific bill's confirmationImageUrl directly ---
      setBills((prevBills) =>
        prevBills.map((bill) => {
          if (bill.id === billId) {
            if (imageData) {
              console.log(`[renderer/PayBillView] Updating bill ${billId} with new screenshot.`)
              console.log('image data: ' + imageData)

              // --- END ADDITION ---
              return { ...bill, confirmationImageUrl: imageData }
            } else {
              console.warn(
                `[renderer/PayBillView] Screenshot capture failed or cancelled for billId: ${billId}. Keeping existing image.`
              )
              return bill // Keep existing image if capture failed/cancelled
            }
          }
          return bill
        })
      )
      // --- END FIX ---
    }

    if (window.api && window.api.onScreenshotTaken) {
      window.api.onScreenshotTaken(handleScreenshotTaken)
      console.log('[renderer/PayBillView] Registered onScreenshotTaken listener.')
    } else {
      console.error(
        '[renderer/PayBillView] window.api.onScreenshotTaken is not available. Check preload script.'
      )
    }

    return () => {
      // Clean up the listener when the component unmounts
      if (window.api && window.api.removeListener) {
        window.api.removeListener('screenshot-taken', handleScreenshotTaken)
        console.log('[renderer/PayBillView] Unregistered onScreenshotTaken listener.')
      }
    }
  }, []) // Dependency array: re-run if currentBillIdForScreenshot changes

  // Function to be passed to BillPaymentCard to initiate screenshot
  const handleTakeScreenshotForBill = (billId) => {
    if (window.api && window.api.takeScreenshot) {
      console.log(`[renderer/PayBillView] Requesting screenshot for bill ID: ${billId}...`)
      setLoadingScreenshot(true) // Start global loading state
      window.api.takeScreenshot(billId) // Pass the billId to the main process
    } else {
      console.warn(
        '[renderer/PayBillView] window.api.takeScreenshot is not available. Ensure your preload script is set up.'
      )
      setLoadingScreenshot(false) // Reset loading if API is not available
      // For demonstration, update the specific bill with a placeholder image immediately
      setBills((prevBills) =>
        prevBills.map((bill) =>
          bill.id === billId
            ? {
                ...bill,
                confirmationImageUrl: placetest
              }
            : bill
        )
      )
    }
  }

  // Function to handle saving updated bill data from BillPaymentCard
  const handleSaveBill = (updatedBill) => {
    console.log('Saving updated bill:', updatedBill)
    // Here you would typically send this updatedBill data to your backend/database
    // For example: window.api.saveBill(updatedBill);
    // After saving, you might want to clear the activeScreenshotData if it was just for this save
  }

  return (
    <Box
      sx={{
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh', // This sets the overall page height
        maxHeight: '100vh',
        overflow: 'hidden' // This prevents the overall page from scrolling
      }}
    >
      {/* Overall Page Header */}
      <Box display="flex" justifyContent={'space-between'} alignItems={'center'}>
        <Header title="PAY BILLS" subtitle="And the money trickles away." />
      </Box>

      {/* Main Content Area: Takes remaining vertical height of the page */}
      <Box
        sx={{
          flexGrow: 1, // Allows this Box to fill vertical space
          marginTop: '16px',
          display: 'flex' // Makes its children (the two columns) flex items
        }}
      >
        <Fade in={true} timeout={500}>
          {/* Parent Grid Container for the two columns (as row flex) */}
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            {' '}
            {/* Takes all remaining space */}
            {/* --- Left Column (Bills) --- */}
            <Grid
              size={{ xs: 6 }}
              sx={{
                display: 'flex',
                flexDirection: 'column', // Stacks header and scrollable content vertically
                minHeight: 0, // Allows this Grid item to shrink
                paddingRight: '8px'
              }}
            >
              {/* Header for Bills Column (fixed at top) */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: colors.primary[600],
                  borderRadius: '8px',
                  padding: '16px',
                  gap: '8px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <Typography variant="h4" fontWeight="400" color={colors.grey[100]}>
                  Bill payments made this month
                </Typography>
                <Typography variant="h3" fontWeight="600" color={colors.grey[100]}>
                  $2876.45
                </Typography>
              </Box>

              {/* Header for Bills Column (fixed at top) */}
              <Typography
                variant="h4"
                fontWeight="bold"
                color={colors.grey[100]}
                sx={{ marginBottom: '8px', paddingLeft: '16px' }}
              >
                Bills
              </Typography>

              {/* Scrollable Content Wrapper for Bills - ADDED height: 0 */}
              <Box
                sx={{
                  flexGrow: 1, // Takes remaining vertical space in this column
                  overflowY: 'auto', // Enables scrolling
                  minHeight: 0, // Allows flex item to shrink
                  height: 0, // <--- ADDED THIS LINE: Crucial for some Flexbox scenarios
                  paddingRight: '8px'
                }}
              >
                {/* Inner Grid Container for BillPaymentCards (content) */}
                <Grid container direction="column" spacing={4}>
                  {bills.map((bill) => (
                    <Grid size={{ xs: 12 }} key={bill.id}>
                      <BillPaymentCard
                        id={bill.id}
                        title={bill.name}
                        amountDue={bill.amount_due}
                        amountPaid={bill.amount_paid} // Ensure amount_paid is passed
                        dateDue={bill.date_due}
                        previousAmountPaid={bill.previous_payment}
                        website={bill.website}
                        onSave={handleSaveBill} // Pass the centralized save handler
                        onTakeScreenshot={() => handleTakeScreenshotForBill(bill.id)} // Pass handler with bill.id
                        // Pass the captured image URL directly from the bill object
                        confirmationImageUrl={bill.confirmationImageUrl}
                        loadingScreenshot={loadingScreenshot} // Global loading state
                        setLoadingScreenshot={setLoadingScreenshot}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
            {/* --- Right Column (Credit Cards) --- */}
            <Grid
              size={{ xs: 6 }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                paddingRight: '8px'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: colors.primary[600],
                  borderRadius: '8px',
                  padding: '16px',
                  gap: '8px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <Typography variant="h4" fontWeight="400" color={colors.grey[100]}>
                  Credit Card payments made this month
                </Typography>
                <Typography variant="h3" fontWeight="600" color={colors.grey[100]}>
                  $854.26
                </Typography>
              </Box>
              {/* Header for Credit Cards Column (fixed at top) */}
              <Typography
                variant="h4"
                fontWeight="bold"
                color={colors.grey[100]}
                sx={{ marginBottom: '8px', paddingLeft: '16px' }}
              >
                Credit Cards
              </Typography>

              {/* Scrollable Content Wrapper for Credit Cards - ADDED height: 0 */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  height: 0, // <--- ADDED THIS LINE: Crucial for some Flexbox scenarios
                  paddingRight: '8px'
                }}
              >
                {/* Inner Grid Container for Credit Cards (content) */}
                <Grid container direction="column" spacing={4}>
                  {cards.map((card) => (
                    <Grid size={{ xs: 12 }} key={card.id}>
                      <CreditPaymentCard
                        title={card.name}
                        dateDue={card.date_due}
                        initialBalance={card.credit_balance}
                        initialCreditLimit={card.credit_limit}
                        initialAmountPaid={card.amount_paid_for_period}
                        previousAmountPaid={card.previous_payment}
                        website={card.website}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Fade>
      </Box>
    </Box>
  )
}
