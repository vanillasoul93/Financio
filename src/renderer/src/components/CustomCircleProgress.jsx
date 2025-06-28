import React, { useEffect, useState } from 'react'
import { Typography, Box, useTheme } from '@mui/material'

import { CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const CustomCircleProgress = ({ value, text }) => {
  // Renamed 'percentage' to 'value' for consistency with CircularProgressbar
  const theme = useTheme()
  const colors = theme.colors

  const getProgressColor = (progress) => {
    if (progress <= 20) {
      return colors.greenAccent[400]
    } else if (progress <= 65) {
      return colors.blueAccent[400]
    } else {
      return colors.redAccent[400]
    }
  }

  // No need for separate progressColor state if it's derived directly from `value`
  // useEffect(() => {}, []); // This useEffect is empty and can be removed

  return (
    // Wrap the CircularProgressbar in a Box.
    // This Box will now be responsible for sizing the progress bar.
    <Box
      sx={{
        width: '100%', // Take full width of its parent (the one with py={4} in DashboardView)
        height: '100%', // Take full height of its parent

        aspectRatio: '1 / 1', // Maintain a 1:1 aspect ratio to keep it circular
        display: 'flex', // Use flex to center the progress bar if needed
        justifyContent: 'center',
        alignItems: 'center',
        margin: 'auto' // Center it if its parent is wider than maxWidth
      }}
    >
      <CircularProgressbar
        value={value} // Use 'value' prop
        text={text || `${value}%`} // Use 'text' prop if provided, otherwise default to percentage
        circleRatio={0.75}
        styles={{
          root: {
            width: '100%', // Make the SVG take 100% of the Box's width
            height: '100%', // Make the SVG take 100% of the Box's height
            overflow: 'visible' // Ensure content isn't clipped if it slightly overflows
          },
          path: {
            stroke: getProgressColor(value), // Use 'value'
            strokeLinecap: 'round',
            transition: 'stroke-dashoffset 0.5s ease 0s',
            transform: 'rotate(-135deg)',
            transformOrigin: 'center center'
          },
          trail: {
            stroke: colors.primary[600],
            strokeLinecap: 'round',
            transform: 'rotate(-135deg)',
            transformOrigin: 'center center'
          },
          text: {
            fill: getProgressColor(value), // Use 'value'
            fontSize: '16px' // Keep font size fixed or make it dynamic if needed
          },
          background: {
            fill: '#3e98c7'
          }
        }}
      />
    </Box>
  )
}

export default CustomCircleProgress
