import React, { useState, useEffect } from 'react'
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material'

function AddCardFormModal({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    date_due: '',
    credit_balance: '',
    credit_limit: '',
    previous_payment: ''
  })

  const [errors, setErrors] = useState({
    name: '',
    website: '',
    date_due: '',
    credit_balance: ''
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }))
    // Clear the error for the changed field if it's no longer invalid
    if (
      errors[name] &&
      ((name === 'name' && value.trim()) ||
        (name === 'website' && value.trim()) ||
        (name === 'date_due' && value.trim()) ||
        (name === 'credit_balance' && value.trim()) ||
        (name === 'credit_limit' && value.trim() && !isNaN(Number(value)) && Number(value) > 0))
    ) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
      isValid = false
    }
    if (!formData.website.trim()) {
      newErrors.website = 'Website is required'
      isValid = false
    }
    if (!formData.date_due.trim()) {
      newErrors.date_due = 'Due Date is required'
      isValid = false
    }
    if (!formData.credit_balance.trim()) {
      newErrors.credit_balance = 'Balance is required'
      isValid = false
    }
    if (!formData.credit_limit.trim()) {
      newErrors.credit_limit = 'Limit is required'
      isValid = false
    } else if (isNaN(Number(formData.credit_limit)) || Number(formData.credit_limit) < 1) {
      newErrors.credit_limit = 'Limit must be a number greater than 0'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
      setFormData({
        name: '',
        website: '',
        date_due: '',
        credit_balance: '',
        credit_limit: '',
        previous_payment: ''
      })
      setErrors({
        name: '',
        website: '',
        date_due: '',
        credit_balance: ''
      })
    }
  }

  const handleCancel = () => {
    onClose()
    setFormData({
      name: '',
      website: '',
      date_due: '',
      credit_balance: '',
      credit_limit: '',
      previous_payment: ''
    })
    setErrors({
      name: '',
      website: '',
      date_due: '',
      credit_balance: ''
    })
  }

  const theme = useTheme()
  const colors = theme.colors

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="payment-form-modal-title"
      aria-describedby="payment-form-modal-description"
      sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box
        sx={{
          bgcolor: colors.primary[400],
          borderRadius: '15px',
          m: '50px',
          p: '50px',
          width: '50%'
        }}
      >
        <Typography
          id="payment-form-modal-title"
          variant="h3"
          component="h2"
          color={colors.greenAccent[400]}
          mb={2}
        >
          Enter Credit Card Details
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
          <TextField
            required
            fullWidth
            margin="normal"
            id="name"
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            id="website"
            name="website"
            label="Website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            error={!!errors.website}
            helperText={errors.website}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            id="date_due"
            name="date_due"
            label="Due Date"
            type="date"
            InputLabelProps={{
              shrink: true
            }}
            value={formData.date_due}
            onChange={handleChange}
            error={!!errors.date_due}
            helperText={errors.date_due}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            id="credit_balance"
            name="credit_balance"
            label="Balance"
            type="number"
            value={formData.credit_balance}
            onChange={handleChange}
            error={!!errors.credit_balance}
            helperText={errors.credit_balance}
          />
          <TextField
            fullWidth
            margin="normal"
            id="credit_limit"
            name="credit_limit"
            label="Limit"
            type="number"
            value={formData.credit_limit}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            id="previous_payment"
            name="previous_payment"
            label="Previous Payment"
            type="number"
            value={formData.previous_payment}
            onChange={handleChange}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleCancel}
              variant="contained"
              sx={{ mr: 1 }}
              style={{ backgroundColor: colors.redAccent[500] }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              style={{ backgroundColor: colors.greenAccent[500] }}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default AddCardFormModal
