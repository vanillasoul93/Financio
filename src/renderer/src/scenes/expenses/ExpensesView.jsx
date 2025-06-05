import React from 'react'
import Header from '../../components/Header'
import { Box } from '@mui/material'

export default function ExpensesView() {
  return (
    <Box
      sx={{
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh', // Crucial: Takes full viewport height
        maxHeight: '100vh', // Explicitly limit max height too
        overflow: 'hidden' // Prevent outer box itself from scrolling
      }}
    >
      <Box display="flex" justifyContent={'space-between'} alignItems={'center'}>
        <Header title="EXPENSES" subtitle="Where's all my money goin'?" />
      </Box>
    </Box>
  )
}
