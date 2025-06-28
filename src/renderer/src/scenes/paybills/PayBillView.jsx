import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
// import dayjs from 'dayjs';
import { Box, Grid, useTheme, Typography, Fade } from '@mui/material'

import BillPaymentCard from '../../components/BillPaymentCard'
import CreditPaymentCard from '../../components/CreditPaymentCard'
import paymentReceipt from '../../images/bill_payment_image.png'

export default function PayBillView() {
  const [bills, setBills] = useState([])
  const [cards, setCards] = useState([])
  // const [subscriptions, setSubscriptions] = useState([]);
  const theme = useTheme()
  const colors = theme.colors

  const [activeBillIdForScreenshot, setActiveBillIdForScreenshot] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const billsData =
          window.api && window.api.getBills
            ? await window.api.getBills()
            : [
                /* Your mock bill data */
                {
                  id: 'bill1',
                  name: 'Electricity Bill',
                  amount_due: 120.5,
                  amount_paid: 0,
                  date_due: '2025-06-15',
                  previous_payment: 110.25,
                  website: 'https://example.com/electricity',
                  confirmationImageUrl: paymentReceipt,
                  loadingScreenshot: false
                },
                {
                  id: 'bill2',
                  name: 'Internet Bill',
                  amount_due: 65.0,
                  amount_paid: 0,
                  date_due: '2025-06-20',
                  previous_payment: 65.0,
                  website: 'https://example.com/internet',
                  confirmationImageUrl: paymentReceipt,
                  loadingScreenshot: false
                },
                {
                  id: 'bill3',
                  name: 'Water Bill',
                  amount_due: 45.75,
                  amount_paid: 0,
                  date_due: '2025-06-10',
                  previous_payment: 40.0,
                  website: 'https://example.com/water',
                  confirmationImageUrl: paymentReceipt,
                  loadingScreenshot: false
                }
              ]
        const cardsData =
          window.api && window.api.getCreditCards
            ? await window.api.getCreditCards()
            : [
                /* Your mock card data */
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

        const initializedBills = billsData.map((bill) => ({
          ...bill,
          confirmationImageUrl: bill.confirmationImageUrl || paymentReceipt,
          loadingScreenshot: bill.loadingScreenshot !== undefined ? bill.loadingScreenshot : false
        }))

        setBills(initializedBills)
        setCards(cardsData)
        // setSubscriptions(subscriptionsData);
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const handleRegionCaptureSuccess = (filePathOrDataUrl) => {
      if (activeBillIdForScreenshot) {
        setBills((prevBills) =>
          prevBills.map((bill) =>
            bill.id === activeBillIdForScreenshot
              ? { ...bill, confirmationImageUrl: filePathOrDataUrl, loadingScreenshot: false }
              : bill
          )
        )
        setActiveBillIdForScreenshot(null)
      }
    }

    const handleRegionCaptureError = (error) => {
      if (activeBillIdForScreenshot) {
        console.error(
          `[PayBillView] Region screenshot error for bill ID ${activeBillIdForScreenshot}:`,
          error
        )
        setBills((prevBills) =>
          prevBills.map((bill) =>
            bill.id === activeBillIdForScreenshot ? { ...bill, loadingScreenshot: false } : bill
          )
        )
        setActiveBillIdForScreenshot(null)
      }
    }

    let cleanupSuccess = () => {}
    let cleanupError = () => {}

    if (window.api && window.api.onRegionCaptureSuccess && window.api.onRegionCaptureError) {
      cleanupSuccess = window.api.onRegionCaptureSuccess(handleRegionCaptureSuccess)
      cleanupError = window.api.onRegionCaptureError(handleRegionCaptureError)
    } else {
      console.error('[PayBillView] Region capture IPC listeners not available on window.api.')
    }

    return () => {
      cleanupSuccess()
      cleanupError()
    }
  }, [activeBillIdForScreenshot])

  const handleTakeScreenshotForBill = (billId) => {
    if (window.api && window.api.openRegionCapture) {
      setActiveBillIdForScreenshot(billId)
      setBills((prevBills) =>
        prevBills.map((b) => (b.id === billId ? { ...b, loadingScreenshot: true } : b))
      )
      window.api.openRegionCapture()
    } else {
      console.warn('[PayBillView] window.api.openRegionCapture is not available.')
      setBills((prevBills) =>
        prevBills.map((b) => (b.id === billId ? { ...b, loadingScreenshot: false } : b))
      )
    }
  }

  const setBillLoadingState = (billId, isLoading) => {
    setBills((prevBills) =>
      prevBills.map((bill) =>
        bill.id === billId ? { ...bill, loadingScreenshot: isLoading } : bill
      )
    )
  }

  const handleSaveBill = (updatedBill) => {
    setBills((prevBills) => prevBills.map((b) => (b.id === updatedBill.id ? updatedBill : b)))
  }

  return (
    <Box
      sx={{
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      <Box display="flex" justifyContent={'space-between'} alignItems={'center'}>
        <Header title="PAY BILLS" subtitle="And the money trickles away." />
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          marginTop: '16px',
          display: 'flex'
        }}
      >
        <Fade in={true} timeout={500}>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            {/* --- Left Column (Bills) --- */}
            <Grid // This is a Grid item, its size is defined by the 'size' prop
              size={{ xs: 12, md: 6 }} // Corrected: Using 'size' prop for responsiveness
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                paddingRight: { xs: 0, md: '8px' } // Responsive padding
              }}
            >
              {/* Header for Bills Column (fixed at top) */}
              <Typography
                variant="h4"
                fontWeight="bold"
                color={colors.grey[100]}
                sx={{ marginBottom: '8px', paddingLeft: '16px' }}
              >
                Bills
              </Typography>
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

              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  height: 0, // <<< --- ADD THIS LINE ---
                  paddingRight: { xs: 0, md: '8px' } // Responsive padding for scrollbar
                }}
              >
                <Grid container direction="column" spacing={2}>
                  {bills.map((bill) => (
                    <Grid size={{ xs: 12 }} key={bill.id}>
                      {' '}
                      {/* Corrected: Using 'size' prop */}
                      <BillPaymentCard
                        id={bill.id}
                        title={bill.name}
                        amountDue={bill.amount_due}
                        amountPaid={bill.amount_paid}
                        dateDue={bill.date_due}
                        previousAmountPaid={bill.previous_payment}
                        website={bill.website}
                        onSave={() => handleSaveBill(bill)}
                        onTakeScreenshot={() => handleTakeScreenshotForBill(bill.id)}
                        confirmationImageUrl={bill.confirmationImageUrl}
                        loadingScreenshot={bill.loadingScreenshot}
                        setLoadingScreenshot={(isLoading) =>
                          setBillLoadingState(bill.id, isLoading)
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
            {/* --- Right Column (Credit Cards) --- */}
            <Grid // This is a Grid item
              size={{ xs: 12, md: 6 }} // Corrected: Using 'size' prop for responsiveness
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                paddingLeft: { xs: 0, md: '8px' } // Responsive padding
              }}
            >
              {/* Header for Credit Cards Column (fixed at top) */}
              <Typography
                variant="h4"
                fontWeight="bold"
                color={colors.grey[100]}
                sx={{ marginBottom: '8px', paddingLeft: '16px' }}
              >
                Credit Cards
              </Typography>
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

              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                  height: 0, // <<< --- ADD THIS LINE ---
                  paddingRight: { xs: 0, md: '8px' } // Responsive padding for scrollbar
                }}
              >
                <Grid container direction="column" spacing={2}>
                  {cards.map((card) => (
                    <Grid size={{ xs: 12 }} key={card.id}>
                      {' '}
                      {/* Corrected: Using 'size' prop */}
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
