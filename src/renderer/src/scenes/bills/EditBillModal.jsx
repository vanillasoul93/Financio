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

function EditBillModal({ open, onClose, onSubmit, data }) {
  const [formData, setFormData] = useState({
    name: '',
    amount_due: '',
    website: '',
    date_due: '',
    frequency_in_months: '',
    automatic: false,
    highest_payment: '',
    previous_payment: ''
  })

  const [errors, setErrors] = useState({
    name: '',
    amount_due: '',
    website: '',
    date_due: '',
    frequency_in_months: ''
  })

  // When the modal opens and 'data' prop changes, update the form data
  useEffect(() => {
    if (data) {
      if (data.automatic === 0) {
        data.automatic = false
      } else {
        data.automatic = true
      }
      setFormData({ ...data })
    }
  }, [data])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear the error for the changed field if it's no longer invalid
    if (
      errors[name] &&
      ((name === 'name' && value) ||
        (name === 'amount_due' && value.trim() && !isNaN(Number(value))) ||
        (name === 'website' && value.trim()) ||
        (name === 'date_due' && value.trim()) ||
        (name === 'frequency_in_months' &&
          value.trim() &&
          !isNaN(Number(value)) &&
          Number(value) > 0))
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
    if (!formData.amount_due) {
      newErrors.amount_due = 'Amount Due is required'
      isValid = false
    } else if (isNaN(Number(formData.amount_due))) {
      newErrors.amount_due = 'Amount Due must be a number'
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
    if (!formData.frequency_in_months) {
      newErrors.frequency_in_months = 'Frequency is required'
      isValid = false
    } else if (
      isNaN(Number(formData.frequency_in_months)) ||
      Number(formData.frequency_in_months) < 1
    ) {
      newErrors.frequency_in_months = 'Frequency must be a number greater than 0'
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
        amount_due: '',
        website: '',
        date_due: '',
        frequency_in_months: '',
        automatic: false,
        highest_payment: '',
        previous_payment: '',
        type: 'Bill'
      })
      setErrors({
        name: '',
        amount_due: '',
        website: '',
        date_due: '',
        frequency_in_months: ''
      })
    }
  }

  const handleCancel = () => {
    onClose()
  }

  const theme = useTheme()
  const colors = theme.colors

  return (
    <Modal
      open={open}
      onClose={onClose}
      data={data}
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
        <Typography id="payment-form-modal-title" variant="h6" component="h2" mb={2}>
          Edit Bill Details
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
            id="amount_due"
            name="amount_due"
            label="Amount Due"
            type="number"
            value={formData.amount_due}
            onChange={handleChange}
            error={!!errors.amount_due}
            helperText={errors.amount_due}
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
            id="frequency_in_months"
            name="frequency_in_months"
            label="Frequency (Months)"
            type="number"
            value={formData.frequency_in_months}
            onChange={handleChange}
            error={!!errors.frequency_in_months}
            helperText={errors.frequency_in_months}
          />
          <FormControlLabel
            control={
              <Checkbox name="automatic" checked={formData.automatic} onChange={handleChange} />
            }
            label="Automatic"
            type="boolean"
            sx={{ mt: 1, display: 'block' }}
          />
          <TextField
            fullWidth
            margin="normal"
            id="highest_payment"
            name="highest_payment"
            label="Highest Payment"
            type="number"
            value={formData.highest_payment}
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
              Update
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default EditBillModal
