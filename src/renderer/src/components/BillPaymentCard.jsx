import React, { useState, useEffect } from 'react' // Import useState
import { Box, Typography, useTheme, TextField, Button, IconButton } from '@mui/material' // Import TextField, Button
import { tokens } from '../theme' // Assuming your theme's color tokens are defined here
import { format, differenceInDays, isPast, isToday, isValid } from 'date-fns'
import paymentReceipt from '../images/bill_payment_image.png'
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined'

/**
 * A compact card component for displaying bill payment information.
 * It shows the bill title, amounts due and paid, due date, days until due,
 * a confirmation screenshot, and the previous payment amount.
 *
 * @param {object} props - Component props.
 * @param {number} props.id - The id for the bill.
 * @param {string} props.title - The title of the bill (e.g., "Electricity Bill").
 * @param {number} props.amountDue - The total amount due for the bill.
 * @param {number} props.amountPaid - The amount that has been paid so far for the bill.
 * @param {string} [props.confirmationImageUrl] - Optional URL for a screenshot of the payment confirmation.
 * @param {Date|string} props.dateDue - The due date of the bill as a Date object or a parseable date string.
 * @param {number} [props.previousAmountPaid=0] - Optional. The amount of the previous payment made. Defaults to 0.
 * @param {function} [props.onSave] - Optional callback function to handle saving the updated payment info.
 */
const BillPaymentCard = ({
  id,
  title,
  amountDue,
  amountPaid,
  confirmationImageUrl, // Now directly receives the image URL from parent
  dateDue, // Expecting a Date object or parseable string
  previousAmountPaid = 0, // Default to 0 if not provided
  onSave, // Callback for saving
  website,
  onTakeScreenshot, // New prop: function to call for screenshot
  loadingScreenshot, // New prop: loading state from parent
  setLoadingScreenshot // New prop: setter for loading state from parent
}) => {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  // Use state for editable amounts, initialized with props
  const [currentAmountDue, setCurrentAmountDue] = useState(
    typeof amountDue === 'number' && !isNaN(amountDue) ? amountDue : 0
  )
  const [currentAmountPaid, setCurrentAmountPaid] = useState(
    typeof amountPaid === 'number' && !isNaN(amountPaid) ? amountPaid : 0
  )

  // Local state for image loading errors, distinct from screenshot capture process
  const [imageLoadError, setImageLoadError] = useState(null)
  const today = new Date()

  // Attempt to create a Date object from dateDue.
  // Use isValid() from date-fns to check if the created date is valid.
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
    // These calculations now depend on the *current* state values of amountDue and amountPaid
    let daysUntilDue = differenceInDays(dueDateObj, today)

    // Determine if the bill is fully paid based on current input values
    const isFullyPaid = currentAmountPaid >= currentAmountDue

    // Determine if it's overdue (past due date AND not fully paid AND not due today)
    const isOverdue = isPast(dueDateObj) && !isToday(dueDateObj) && !isFullyPaid

    if (isFullyPaid) {
      daysDueText = 'Paid'
      daysDueColor = colors.greenAccent[500] // Green for paid
    } else if (isOverdue) {
      daysDueText = `Overdue by ${Math.abs(daysUntilDue)} days`
      daysDueColor = colors.redAccent[500] // Red for overdue
    } else if (isToday(dueDateObj)) {
      daysDueText = 'Due Today'
      daysDueColor = colors.redAccent[500] // Red for due today
    } else if (daysUntilDue > 7) {
      daysDueText = `Due in ${daysUntilDue} days`
      daysDueColor = colors.blueAccent[500] // Blue for upcoming
    } else if (daysUntilDue > 0 && daysUntilDue < 8) {
      daysDueText = `Due in ${daysUntilDue} days`
      daysDueColor = 'goldenrod' // Blue for upcoming
    } else {
      // Fallback for dates in the past that are not overdue (e.g., if amountDue was 0, or other edge cases)
      daysDueText = `Due on ${format(dueDateObj, 'MMM dd,yyyy')}`
      daysDueColor = colors.grey[400] // Grey for general past dates
    }

    // Format date due for consistent display
    formattedDateDue = format(dueDateObj, 'MMM dd, yyyy')
  }
  //Onclick button {website}
  const openWebsite = () => {
    window.api.openWebsite(website)
  }

  const handleTakeScreenshot = () => {
    if (onTakeScreenshot) {
      setLoadingScreenshot(true) // Inform parent that loading has started
      setImageLoadError(null) // Clear any previous image load errors
      onTakeScreenshot() // Call the parent's function (which now includes the bill.id)
    } else {
      console.warn('onTakeScreenshot prop not provided to BillPaymentCard.')
      setImageLoadError('Screenshot functionality not available.')
    }
  }

  // Handler for saving the data
  const handleSave = async () => {
    if (onSave) {
      const updatedBillData = {
        id, // Pass the bill ID
        title,
        amountDue: currentAmountDue,
        amountPaid: currentAmountPaid,
        confirmationImageUrl: confirmationImageUrl,
        dateDue,
        previousAmountPaid
      }
      onSave(updatedBillData) // Call parent's save handler

      // If a screenshot is available, send it to the main process for saving
      if (confirmationImageUrl && confirmationImageUrl.startsWith('data:image/png;base64,')) {
        console.log(
          `[renderer/BillPaymentCard] Attempting to save screenshot for ${title} to disk.`
        )
        if (window.api && window.api.saveScreenshotToDisk) {
          try {
            const saveResult = await window.api.saveScreenshotToDisk(
              id, // Pass bill ID
              title,
              confirmationImageUrl
            )
            console.log(`[renderer/BillPaymentCard] Screenshot save result:`, saveResult)
            // Optionally, show a user notification about successful save
          } catch (error) {
            console.error('[renderer/BillPaymentCard] Error saving screenshot to disk:', error)
            // Optionally, show a user notification about save failure
          }
        } else {
          console.warn(
            '[renderer/BillPaymentCard] window.api.saveScreenshotToDisk is not available. Screenshot will not be saved to disk.'
          )
        }
      } else {
        console.log(
          '[renderer/BillPaymentCard] No valid screenshot data (or not a base64 image) to save to disk.'
        )
      }
    } else {
      console.warn('onSave prop not provided. Data will not be saved.')
    }
  }

  const copyPaymentField = () => {
    //paymentTextField.value = '100.00'
    setCurrentAmountPaid(currentAmountDue)
    console.log('payment field copied')
  }
  // Placeholder image URL using theme colors for consistency
  const fallbackImageUrl = paymentReceipt

  return (
    <Box
      sx={{
        backgroundColor: colors.primary[400], // A slightly lighter background for the card
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px', // Spacing between sections
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
        width: '100%', // Takes full width of its parent grid item
        // Limits the width on larger screens for a compact look
        minWidth: '0px'
        // Centers the card within its parent if maxWidth is active
      }}
    >
      {/* Bill Title */}
      <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
        {title}
      </Typography>

      {/* Amount Due and Amount Paid */}
      <Box display="flex" justifyContent="space-between" alignItems="center" gap="10px">
        <Box flexGrow={1} mr={0}>
          <Typography variant="h6" color={colors.grey[300]} mb={0.5}>
            Due:
          </Typography>
          <TextField
            id="dueTextfield"
            fullWidth
            size="small"
            type="number" // Set type to number for numeric input
            value={currentAmountDue} // Display with 2 decimal places
            onChange={(e) => {
              // Parse float, default to 0 if invalid input
              const newValue = parseFloat(e.target.value)
              setCurrentAmountDue(isNaN(newValue) ? 0 : newValue)
            }}
            InputProps={{
              sx: {
                color: colors.redAccent[500], // Text color for amount due
                fontWeight: 'bold',
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                },
                // Ensure background is transparent
                padding: '0 8px', // Adjust padding as needed
                height: '35px' // Set a fixed height to make it compact
              },
              inputProps: {
                style: {
                  textAlign: 'left', // Align text left
                  padding: '0', // Remove inner padding
                  height: '100%', // Fill TextField height
                  display: 'flex',
                  alignItems: 'center'
                }
              }
            }}
          />
        </Box>
        <Box display={'flex'} height="60px" alignItems={'flex-end'}>
          <IconButton sx={{ height: '35px', width: '35px' }} onClick={copyPaymentField}>
            <ArrowCircleRightOutlinedIcon
              sx={{ height: '35px', width: '35px', color: colors.greenAccent[400] }}
            />
          </IconButton>
        </Box>

        <Box flexGrow={1} ml={0}>
          <Typography variant="h6" color={colors.grey[300]} mb={0.5}>
            Payment:
          </Typography>
          <TextField
            id="paymentTextfield"
            fullWidth
            size="small"
            type="number" // Set type to number for numeric input
            value={currentAmountPaid} // Display with 2 decimal places
            onChange={(e) => {
              // Parse float, default to 0 if invalid input
              const newValue = parseFloat(e.target.value)
              setCurrentAmountPaid(isNaN(newValue) ? 0 : newValue)
            }}
            InputProps={{
              sx: {
                color: colors.greenAccent[500], // Text color for amount paid
                fontWeight: 'bold',
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                },
                backgroundColor: 'transparent',
                padding: '0 8px',
                height: '35px'
              },
              inputProps: {
                style: {
                  textAlign: 'right', // Align text right
                  padding: '0',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center'
                }
              }
            }}
          />
        </Box>
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
          <Typography
            variant="h6"
            fontWeight="600"
            color={daysDueColor} // Color changes based on bill status
          >
            {daysDueText}
          </Typography>
        </Box>
      </Box>
      {/* Previous Amount Paid */}
      <Box sx={{ mt: '10px' }}>
        <Typography variant="h6" color={colors.grey[300]}>
          Previous Payment:
        </Typography>
        <Typography variant="h6" color={colors.grey[100]} fontWeight="600">
          {previousAmountPaid > 0 ? `$${previousAmountPaid.toFixed(2)}` : 'N/A'}
        </Typography>
      </Box>

      {/* Confirmation Image */}
      <Box sx={{ mt: '10px' }}>
        <Typography variant="h6" color={colors.grey[300]} mb="5px">
          Confirmation Screenshot:
        </Typography>
        <img
          src={confirmationImageUrl || fallbackImageUrl}
          alt={`Confirmation for ${title}`}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '150px', // Limit height for compact view
            objectFit: 'cover', // Ensures the image covers the area, cropping if necessary
            borderRadius: '4px'
          }}
          onError={(e) => {
            e.target.onerror = null // Prevents infinite loop if fallback also fails
            e.target.src = fallbackImageUrl // Sets the fallback image on error
          }}
        />
        {imageLoadError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {imageLoadError}
          </Typography>
        )}
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
        {/* Screenshot Button */}
        <Button
          variant="contained"
          sx={{
            margin: '4px',
            width: '100%',
            backgroundColor: colors.blueAccent[600], // Using blue accent for screenshot button
            color: colors.grey[100],
            '&:hover': {
              backgroundColor: colors.blueAccent[800]
            }
          }}
          onClick={handleTakeScreenshot}
        >
          Take Screenshot
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

export default BillPaymentCard
