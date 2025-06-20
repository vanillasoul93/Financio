import React from 'react'
import { LinearProgress, Box, Typography } from '@mui/material'

function UsageProgressBar({ value }) {
  const displayValue = Math.max(0, Math.min(100, value)) // Ensure value is between 0 and 100
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" value={displayValue} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant="body2"
          color="text.secondary"
        >{`${Math.round(displayValue)}%`}</Typography>
      </Box>
    </Box>
  )
}

export default UsageProgressBar
