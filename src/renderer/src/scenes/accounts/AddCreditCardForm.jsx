import React, { useState } from 'react'
import { TextField, Button, Box } from '@mui/material'

function AddCreditCardForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [balance, setBalance] = useState(0)
  const [creditLimit, setCreditLimit] = useState(0)
  const [dueDate, setDueDate] = useState('') // e.g., 'YYYY-MM-DD'

  const handleSubmit = () => {
    onSubmit({
      name,
      balance: -Math.abs(balance),
      type: 'Credit Card',
      credit_limit: creditLimit,
      payment_due_date: dueDate
    })
  }

  return (
    <Box component="form" noValidate autoComplete="off">
      <TextField
        label="Card Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Current Balance (as positive number)"
        type="number"
        value={balance}
        onChange={(e) => setBalance(parseFloat(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Credit Limit"
        type="number"
        value={creditLimit}
        onChange={(e) => setCreditLimit(parseFloat(e.target.value))}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Next Payment Due Date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
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
export default AddCreditCardForm
