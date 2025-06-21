import React, { useState } from 'react'
import { TextField, Button, Box } from '@mui/material'

function AddCheckingForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [balance, setBalance] = useState(0)

  const handleSubmit = () => {
    // Pass the form data up to the parent component
    onSubmit({ name, balance, type: 'Checking' })
  }

  return (
    <Box component="form" noValidate autoComplete="off">
      <TextField
        label="Account Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Current Balance"
        type="number"
        value={balance}
        onChange={(e) => setBalance(parseFloat(e.target.value))}
        fullWidth
        margin="normal"
      />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" sx={{ ml: 1 }}>
          Save
        </Button>
      </Box>
    </Box>
  )
}
export default AddCheckingForm
