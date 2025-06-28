import React, { useState } from 'react'
import { Box, Typography, useTheme, TextField, Button } from '@mui/material'

import { format, differenceInDays, isPast, isToday, isValid } from 'date-fns' // Re-import date-fns
import paymentReceipt from '../images/bill_payment_image.png' // Re-import image

/**
 * A compact card component for displaying Credit Card information.
 * It shows the card title, current balance, credit limit, and an amount paid field.
 * It also includes due date information, previous payment, and a confirmation image slot.
 *
 * @param {object} props - Component props.
 * @param {string} props.title - The title of the credit card (e.g., "Visa Platinum").
 * @param {number} props.initialBalance - The initial current balance of the card.
 * @param {number} props.initialCreditLimit - The initial credit limit of the card.
 * @param {number} props.initialAmountPaid - The initial amount paid towards the card.
 * @param {Date|string} props.dateDue - The payment due date for the credit card as a Date object or a parseable date string.
 * @param {number} [props.previousAmountPaid=0] - Optional. The amount of the previous payment made. Defaults to 0.
 * @param {string} [props.confirmationImageUrl] - Optional URL for a screenshot of the payment confirmation.
 * @param {string} props.website - The URL to open when the website button is clicked.
 * @param {function} [props.onSave] - Optional callback function to handle saving the updated card info.
 */
const CreditPaymentCard = ({
  title,
  initialBalance,
  initialCreditLimit,
  initialAmountPaid,
  dateDue, // Reintroduced prop
  previousAmountPaid = 0, // Reintroduced prop with default
  confirmationImageUrl, // Reintroduced prop
  website, // Reintroduced prop
  onSave // Callback for saving
}) => {
  const theme = useTheme()
  const colors = theme.colors

  // Use state for editable fields, initialized with props
  const [currentBalance, setCurrentBalance] = useState(initialBalance)
  const [creditLimit, setCreditLimit] = useState(initialCreditLimit)
  const [amountPaid, setAmountPaid] = useState(initialAmountPaid) // This is the amount the user *intends* to pay now

  const today = new Date()

  // Attempt to create a Date object from dateDue.
  const parsedDateDue = new Date(dateDue + 'T00:00:00')
  const isDateDueValid = isValid(parsedDateDue)

  let dueDateObj = isDateDueValid ? parsedDateDue : null // Set to null if invalid

  // Initialize variables for date-related text and color
  let daysDueText = 'N/A'
  let daysDueColor = colors.grey[400] // Default grey color

  let formattedDateDue = 'N/A'

  // Only perform date calculations if dueDateObj is valid
  if (dueDateObj) {
    // Calculate days until due (can be negative if in the past)
    let daysUntilDue = differenceInDays(dueDateObj, today)
    //console.log('DATE DUE for ' + title + ': ' + dateDue)
    // Determine if the card is "paid" (e.g., if the amount entered covers the balance)
    // NOTE: For credit cards, 'paid' might mean covering the full balance,
    // or just the minimum payment due. This assumes covering the currentBalance.
    const isFullyPaid = amountPaid >= currentBalance

    // Determine if it's overdue (past due date AND not fully paid AND not due today)
    const isOverdue = isPast(dueDateObj) && !isToday(dueDateObj) && !isFullyPaid

    if (isFullyPaid && currentBalance <= 0) {
      // Consider if balance is also paid off
      daysDueText = 'Balance Paid'
      daysDueColor = colors.greenAccent[500] // Green for paid
    } else if (isOverdue) {
      daysDueText = `Overdue by ${Math.abs(daysUntilDue)} days`
      daysDueColor = colors.redAccent[500] // Red for overdue
    } else if (isToday(dueDateObj)) {
      daysDueText = 'Due Today'
      daysDueColor = colors.redAccent[500] // Red for due today
    } else if (daysUntilDue > 0 && daysUntilDue < 8) {
      // 1 to 7 days
      daysDueText = `Due in ${daysUntilDue} days`
      daysDueColor = 'goldenrod' // Distinct color for soon-to-be-due
    } else if (daysUntilDue > 7) {
      // More than 7 days
      daysDueText = `Due in ${daysUntilDue} days`
      daysDueColor = colors.blueAccent[500] // Blue for upcoming
    } else {
      // Fallback for dates in the past that are not overdue or other edge cases
      daysDueText = `Due on ${format(dueDateObj, 'MMM dd, yyyy')}`
      daysDueColor = colors.grey[400] // Grey for general past dates
    }

    // Format date due for consistent display
    formattedDateDue = format(dueDateObj, 'MMM dd, yyyy')
  }

  // Handler for opening the website
  const openWebsite = () => {
    if (website && window.api && window.api.openWebsite) {
      window.api.openWebsite(website)
    } else {
      console.warn('Website URL or openWebsite API not available.')
    }
  }

  // Handler for saving the data
  const handleSave = () => {
    if (onSave) {
      onSave({
        title,
        currentBalance,
        creditLimit,
        amountPaid, // The amount the user just entered to pay
        dateDue: dueDateObj ? dueDateObj.toISOString() : null, // Convert Date to ISO string for storage
        previousAmountPaid, // This typically would be updated after a successful payment
        confirmationImageUrl
      })
      console.log('Saving Credit Card Info:', {
        title,
        currentBalance,
        creditLimit,
        amountPaid,
        dateDue: dueDateObj ? dueDateObj.toISOString() : null,
        previousAmountPaid,
        confirmationImageUrl
      })
    } else {
      console.warn('onSave prop not provided. Data will not be saved.')
    }
  }

  // Placeholder image URL using theme colors for consistency
  const fallbackImageUrl = paymentReceipt

  return (
    <Box
      sx={{
        backgroundColor: colors.primary[500],
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
        width: '100%',
        minWidth: '0px'
      }}
    >
      {/* Card Title */}
      <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
        {title}
      </Typography>

      {/* Credit Limit - MODIFIED FOR DISABLED WITHOUT TEXT COLOR CHANGE */}
      <Box>
        <Typography variant="h6" color={colors.grey[300]} mb={0.5}>
          Limit:
        </Typography>
        <TextField
          fullWidth
          size="small"
          type="number"
          value={initialCreditLimit.toFixed(2)}
          disabled // Set to disabled
          // variant="standard" // Keep if you want the standard variant's look

          slotProps={{
            input: {
              // Removed readOnly as we are using disabled
              style: {
                textAlign: 'left',
                padding: '0',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                // CRITICAL: Override disabled text color and opacity
                color: colors.blueAccent[500], // Set to your desired color
                WebkitTextFillColor: colors.blueAccent[500], // For Safari/Chrome
                opacity: 1 // Prevent opacity reduction on disabled state
              },
              sx: {
                fontWeight: 'bold',

                // Ensure color is applied even if disabled, overriding MUI's default
                '& .Mui-disabled': {
                  color: colors.blueAccent[500],
                  WebkitTextFillColor: colors.blueAccent[500],
                  opacity: 1
                }
              }
            }
          }}
        />
      </Box>
      {/* Current Balance */}
      <Box>
        <Typography variant="h6" color={colors.grey[300]} mb={0.5}>
          Balance:
        </Typography>
        <TextField
          fullWidth
          size="small"
          type="number"
          value={currentBalance}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value)
            setCurrentBalance(isNaN(newValue) ? 0 : newValue)
          }}
          InputProps={{
            sx: {
              color: colors.redAccent[500],
              fontWeight: 'bold',
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                display: 'none'
              },
              '& input[type=number]': { MozAppearance: 'textfield' },
              padding: '0 8px',
              height: '35px'
            },
            inputProps: {
              style: {
                textAlign: 'left',
                padding: '0',
                height: '100%',
                display: 'flex',
                alignItems: 'center'
              }
            }
          }}
        />
      </Box>

      {/* Amount Paid (for current payment) */}
      <Box>
        <Typography variant="h6" color={colors.grey[300]} mb={0.5}>
          Payment:
        </Typography>
        <TextField
          fullWidth
          size="small"
          type="number"
          value={amountPaid}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value)
            setAmountPaid(isNaN(newValue) ? 0 : newValue)
          }}
          InputProps={{
            sx: {
              color: colors.greenAccent[500],
              fontWeight: 'bold',
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                display: 'none'
              },
              '& input[type=number]': { MozAppearance: 'textfield' },
              padding: '0 8px',
              height: '35px'
            },
            inputProps: {
              style: {
                textAlign: 'left',
                padding: '0',
                height: '100%',
                display: 'flex',
                alignItems: 'center'
              }
            }
          }}
        />
      </Box>

      {/* Date Due and Days Until Due */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6" color={colors.grey[300]}>
            Due Date:
          </Typography>
          <Typography variant="h6" color={colors.grey[100]}>
            {formattedDateDue}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="h6" fontWeight="700" color={daysDueColor}>
            {daysDueText}
          </Typography>
        </Box>
      </Box>

      {/* Previous Amount Paid */}
      <Box sx={{ mt: '10px' }}>
        <Typography variant="h6" color={colors.grey[300]}>
          Previous Payment:
        </Typography>
        <Typography variant="h6" color={colors.grey[100]} fontWeight="700">
          {previousAmountPaid > 0 ? `$${previousAmountPaid}` : 'N/A'}
        </Typography>
      </Box>

      {/* Confirmation Image */}
      <Box sx={{ mt: '10px' }}>
        <Typography variant="h6" color={colors.grey[300]} mb="5px">
          Confirmation Screenshot:
        </Typography>
        <img
          src={confirmationImageUrl || fallbackImageUrl} // Use confirmationImageUrl if provided, otherwise fallback
          alt={`Confirmation for ${title}`}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '150px',
            objectFit: 'cover',
            borderRadius: '4px'
          }}
          onError={(e) => {
            e.target.onerror = null
            e.target.src = fallbackImageUrl
          }}
        />
      </Box>

      {/* Button Container */}
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        {/* Website Button */}
        <Button
          variant="contained"
          sx={{
            margin: '4px',
            width: '100%',
            backgroundColor: colors.blueAccent[600],
            color: colors.grey[100],
            '&:hover': {
              backgroundColor: colors.blueAccent[800]
            }
          }}
          onClick={openWebsite}
          disabled={!website} // Disable if no website URL is provided
        >
          Website
        </Button>
        {/* Save Button */}
        <Button
          variant="contained"
          sx={{
            margin: '4px',
            width: '100%',
            backgroundColor: colors.greenAccent[700],
            color: colors.grey[100],
            '&:hover': {
              backgroundColor: colors.greenAccent[800]
            }
          }}
          onClick={handleSave}
        >
          Complete Payment
        </Button>
      </Box>
    </Box>
  )
}

export default CreditPaymentCard
