import React, { useState } from 'react'
import { Modal, Box, TextField, Button, Typography, useTheme } from '@mui/material'

function AddCreditCardForm({ open, onClose, onSubmit }) {
  const theme = useTheme()
  const colors = theme.colors

  // 1. State is updated for Credit Card fields
  const initialState = {
    name: '',
    balance: '',
    credit_limit: '',
    due_date: '',
    associated_website: '',
    institution: '',
    type: 'Credit Card' // Hardcoded type
  }

  const [formData, setFormData] = useState(initialState)
  const [errors, setErrors] = useState({})

  // 2. The handleChange function is generic and requires no changes
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

  // 3. Validation logic is updated for Credit Card fields
  const validateForm = () => {
    let isValid = true
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Card Name is required'
      isValid = false
    }
    if (!formData.name.trim()) {
      newErrors.institution = 'Financial Institution is required'
      isValid = false
    }
    if (formData.balance === '' || isNaN(Number(formData.balance))) {
      newErrors.balance = 'Current Balance must be a valid number'
      isValid = false
    }
    if (
      formData.credit_limit === '' ||
      isNaN(Number(formData.credit_limit)) ||
      Number(formData.credit_limit) < 0
    ) {
      newErrors.credit_limit = 'Credit Limit must be a positive number'
      isValid = false
    }
    if (!formData.due_date.trim()) {
      newErrors.due_date = 'Next Payment Due Date is required'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // 4. handleSubmit is adapted for credit card data
  const handleSubmit = (event) => {
    event.preventDefault()
    if (validateForm()) {
      // Transform the data before submitting
      const submissionData = {
        ...formData,
        // Ensure balance is stored as a negative number, as it's a liability
        balance: -Math.abs(Number(formData.balance)),
        credit_limit: Number(formData.credit_limit),
        type: formData.type.toLowerCase()
      }
      onSubmit(submissionData)
      handleCancel() // Reset form and close modal
    }
  }

  // 5. handleCancel resets the new form fields
  const handleCancel = () => {
    onClose()
    setFormData(initialState)
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
          Enter Credit Card Details
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
          {/* --- TEXTFIELDS UPDATED FOR CREDIT CARD --- */}
          <TextField
            required
            fullWidth
            margin="normal"
            name="name"
            label="Card Name (e.g., Chase Sapphire)"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            name="institution"
            label="Institution"
            value={formData.institution}
            onChange={handleChange}
            error={!!errors.institution}
            helperText={errors.institution}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            name="balance"
            label="Current Balance (enter as positive number)"
            type="number"
            value={formData.balance}
            onChange={handleChange}
            error={!!errors.balance}
            helperText={errors.balance}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            name="credit_limit"
            label="Credit Limit"
            type="number"
            value={formData.credit_limit}
            onChange={handleChange}
            error={!!errors.credit_limit}
            helperText={errors.credit_limit}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            name="due_date"
            label="Next Payment Due Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.due_date}
            onChange={handleChange}
            error={!!errors.due_date}
            helperText={errors.due_date}
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

export default AddCreditCardForm
