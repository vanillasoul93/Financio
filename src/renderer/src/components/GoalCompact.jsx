// components/CompactGoalCard.jsx
import React from 'react'
import { Box, Typography, LinearProgress, useTheme } from '@mui/material'
import { tokens } from '../theme' // Adjust path if necessary

// --- IMPORT YOUR MUI ICON MAP ---
import muiIconMap from '../muiIconMap' // Adjust path to where muiIconMap.js is located

const CompactGoalCard = ({ goal }) => {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  // Destructure the new field names from the goal object
  const { name, description, goal_value, current_value, icon, monthly_investment } = goal

  // Get the Icon Component from the map
  // Use a default icon (e.g., Star) if the 'icon' string from the database doesn't exist in your map
  const IconComponent = muiIconMap[icon] || muiIconMap.Star // Fallback to 'Star' or any other default icon you prefer

  // Calculate completion and remaining amount using the new field names
  const completionPercentage =
    goal_value > 0 ? Math.min(100, (current_value / goal_value) * 100) : 0 // Ensure it doesn't exceed 100%
  const remainingAmount = goal_value - current_value

  return (
    <Box
      sx={{
        backgroundColor: colors.primary[600],
        borderRadius: '8px',
        p: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      <Box display="flex" alignItems="center" gap="8px">
        {/* Render the dynamically selected IconComponent */}
        {IconComponent && (
          <IconComponent sx={{ fontSize: '48px', color: colors.blueAccent[500] }} />
        )}
        <Typography variant="h4" fontWeight="400" color={colors.grey[100]} noWrap>
          {name}
        </Typography>
      </Box>

      {/* You can display the description here if you want */}
      {/* {description && (
        <Typography variant="body2" color={colors.grey[400]} sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {description}
        </Typography>
      )} */}

      <LinearProgress
        variant="determinate"
        value={completionPercentage}
        sx={{
          height: '20px',
          borderRadius: '4px',
          marginBottom: '4px',
          backgroundColor: colors.primary[400],
          '& .MuiLinearProgress-bar': {
            backgroundColor: colors.blueAccent[500]
          }
        }}
      />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" color={colors.grey[300]} sx={{ whiteSpace: 'nowrap' }}>
          {/* Display current and target values, formatted as currency */}$
          {current_value.toLocaleString()} / ${goal_value.toLocaleString()}
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          color={colors.greenAccent[400]}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {/* Display remaining amount, ensuring it's not negative */}$
          {remainingAmount > 0 ? remainingAmount.toLocaleString() : '0'} Left
        </Typography>
      </Box>

      {/* Optionally display monthly investment */}
      {/* {monthly_investment > 0 && (
        <Typography variant="caption" color={colors.grey[500]} sx={{ mt: 0.5 }}>
          Investing ${monthly_investment.toLocaleString()} / month
        </Typography>
      )} */}
    </Box>
  )
}

export default CompactGoalCard
