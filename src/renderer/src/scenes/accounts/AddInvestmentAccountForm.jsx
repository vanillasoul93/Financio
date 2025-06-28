import React, { useState, useEffect } from 'react'
import { Modal, Box, TextField, Button, Typography, useTheme } from '@mui/material'

/**
 * A self-contained modal form for adding a new Investment account.
 * @param {object} props
 * @param {boolean} props.open - Controls if the modal is visible.
 * @param {function} props.onClose - Function to call when the modal should close.
 * @param {function} props.onSubmit - Function to call with the form data on successful submission.
 */
function AddInvestmentAccountForm({ open, onClose, onSubmit }) {
  const theme = useTheme()
  const colors = theme.colors

  const getInitialState = () => ({
    name: '',
    balance: '', // This will represent the cash balance in the brokerage
    associated_website: '',
    type: 'Investment' // Hardcoded type
  })

  const [formData, setFormData] = useState(getInitialState())
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Account Name is required'
      isValid = false
    }
    if (formData.balance === '' || isNaN(Number(formData.balance))) {
      newErrors.balance = 'Initial Cash Balance must be a valid number'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (validateForm()) {
      const submissionData = {
        ...formData,
        balance: Number(formData.balance),
        type: formData.type.toLowerCase()
      }
      onSubmit(submissionData)
      handleCancel()
    }
  }

  const handleCancel = () => {
    onClose()
    setFormData(getInitialState())
    setErrors({})
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box
        sx={{
          bgcolor: colors.primary[700],
          borderRadius: '15px',
          p: 4,
          width: { xs: '90%', md: '50%' }
        }}
      >
        <Typography variant="h3" component="h2" color={colors.greenAccent[400]} mb={2}>
          Enter New Investment Account Details
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
          <TextField
            required
            fullWidth
            margin="normal"
            name="name"
            label="Account Name (e.g., Fidelity Brokerage)"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            name="balance"
            label="Initial Cash Balance"
            type="number"
            value={formData.balance}
            onChange={handleChange}
            error={!!errors.balance}
            helperText={errors.balance}
          />
          <TextField
            fullWidth
            margin="normal"
            name="associated_website"
            label="Website (Optional)"
            type="url"
            value={formData.associated_website}
            onChange={handleChange}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleCancel}
              variant="contained"
              sx={{
                mr: 1,
                backgroundColor: colors.redAccent[500],
                '&:hover': { backgroundColor: colors.redAccent[600] }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: colors.greenAccent[500],
                '&:hover': { backgroundColor: colors.greenAccent[600] }
              }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default AddInvestmentAccountForm
