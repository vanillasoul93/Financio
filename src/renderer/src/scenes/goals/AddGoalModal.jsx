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
  FormHelperText,
  InputAdornment
} from '@mui/material'

import IconPicker from '../../components/IconPicker' // Adjust the path as needed
import muiIconMap from '../../muiIconMap' // Import muiIconMap to render the selected icon

function GoalFormModal({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal_value: '',
    current_value: '',
    monthly_investment: '',
    icon: ''
  })

  const [errors, setErrors] = useState({
    name: '',
    description: '',
    goal_value: '',
    current_value: ''
  })

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)

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
        (name === 'description' && value.trim()) ||
        (name === 'goal_value' && value.trim() && !isNaN(Number(value)) && Number(value) > 0) ||
        (name === 'current_value' && value.trim()) ||
        (name === 'monthly_investment' &&
          value.trim() &&
          !isNaN(Number(value)) &&
          Number(value) > 0))
    ) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }))
    }
  }

  const handleSelectIcon = (iconName) => {
    setFormData((prevState) => ({
      ...prevState,
      icon: iconName
    }))
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
      isValid = false
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
      isValid = false
    }
    if (!formData.goal_value.trim()) {
      newErrors.goal_value = 'goal amount is required'
      isValid = false
    } else if (isNaN(Number(formData.goal_value)) || Number(formData.goal_value) < 1) {
      newErrors.goal_value = 'goal must be a number greater than 0'
      isValid = false
    }
    if (!formData.current_value.trim()) {
      newErrors.current_value = 'saved is required'
      isValid = false
    } else if (isNaN(Number(formData.current_value))) {
      newErrors.current_value = 'saved must be a number greater than 0'
      isValid = false
    }
    if (!formData.monthly_investment.trim()) {
      newErrors.monthly_investment = 'saved is required'
      isValid = false
    } else if (
      isNaN(Number(formData.monthly_investment)) ||
      Number(formData.monthly_investment) < 1
    ) {
      newErrors.monthly_investment = 'saved must be a number greater than 0'
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
        description: '',
        goal_value: '',
        current_value: '',
        monthly_investment: '',
        icon: ''
      })
      setErrors({
        name: '',
        description: '',
        goal_value: '',
        current_value: '',
        monthly_investment: ''
      })
    }
  }

  const handleCancel = () => {
    onClose()
    setFormData({
      name: '',
      description: '',
      goal_value: '',
      current_value: '',
      monthly_investment: '',
      icon: ''
    })
    setErrors({
      name: '',
      description: '',
      goal_value: '',
      current_value: '',
      monthly_investment: ''
    })
  }

  const theme = useTheme()
  const colors = theme.colors

  const SelectedIconComponent = formData.icon ? muiIconMap[formData.icon] : null

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
          variant="h2"
          fontWeight={600}
          color={colors.greenAccent[400]}
          mb={2}
        >
          New Goal
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
          <TextField
            required
            fullWidth
            margin="normal"
            id="name"
            name="name"
            label="Goal"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            required
            fullWidth
            multiline
            margin="normal"
            id="description"
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            id="goal_value"
            name="goal_value"
            label="Goal"
            type="number"
            value={formData.goal_value}
            onChange={handleChange}
            error={!!errors.goal_value}
            helperText={errors.goal_value}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            id="current_value"
            name="current_value"
            label="Saved"
            type="number"
            value={formData.current_value}
            onChange={handleChange}
            error={!!errors.current_value}
            helperText={errors.current_value}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            id="monthly_investment"
            name="monthly_investment"
            label="Monthly Goal"
            type="number"
            value={formData.monthly_investment}
            onChange={handleChange}
            error={!!errors.monthly_investment}
            helperText={errors.monthly_investment}
          />
          <TextField
            fullWidth
            margin="normal"
            id="icon"
            name="icon"
            label="Selected Icon"
            value={formData.icon || 'No Icon Selected'}
            InputProps={{
              readOnly: true,
              startAdornment: formData.icon ? (
                <InputAdornment position="start">
                  {SelectedIconComponent && (
                    <SelectedIconComponent sx={{ color: colors.grey[100] }} />
                  )}
                </InputAdornment>
              ) : null,
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={() => setIsIconPickerOpen(true)}
                    variant="contained"
                    sx={{
                      backgroundColor: colors.blueAccent[700],
                      '&:hover': {
                        backgroundColor: colors.blueAccent[600]
                      }
                    }}
                  >
                    Browse Icons
                  </Button>
                </InputAdornment>
              )
            }}
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

        <IconPicker
          open={isIconPickerOpen} // This still corresponds to isIconSelectorOpen in IconPicker
          onClose={() => setIsIconPickerOpen(false)} // This still corresponds to handleCloseIconSelector
          onSelectIcon={handleSelectIcon} // This still corresponds to handleIconSelect
          currentGoalIconName={formData.icon} // Pass the currently selected icon name
        />
      </Box>
    </Modal>
  )
}

export default GoalFormModal
