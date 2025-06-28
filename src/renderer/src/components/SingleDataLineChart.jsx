import React from 'react'
import { useState, useEffect } from 'react'
import { Box, useTheme, Typography } from '@mui/material'

import { LineChart } from '@mui/x-charts/LineChart'

export default function SingleDataLineChart({ aData, xLabels, label }) {
  const theme = useTheme()
  const colors = theme.colors

  useEffect(() => {
    aData.map((data) => {
      console.log('dataA Value:' + data)
    })

    xLabels.map((data) => {
      console.log('XLabel Value:' + data)
    })
  }, [])

  return (
    <Box>
      <LineChart
        height={300}
        series={[
          {
            id: 'Limit',
            data: aData,
            area: true,
            showMark: false,
            color: colors.greenAccent[400]
          }
        ]}
        xAxis={[{ scaleType: 'point', data: xLabels }]}
        yAxis={[{ width: 50 }]}
        margin={'10px'}
        grid={{ vertical: false, horizontal: true }}
        sx={{
          '& .MuiLineElement-root': {
            strokeWidth: 3
          },
          '& .MuiAreaElement-series-Balance': {
            fill: "url('#colorGradient')"
          },
          '& .MuiAreaElement-series-Limit': {
            fill: "url('#greenGradient')"
          }
        }}
      >
        <defs>
          <linearGradient id="colorGradient" gradientTransform="rotate(90)">
            <stop offset="5%" stopColor={colors.blueAccent[400]} stopOpacity=".2" />
            <stop offset="95%" stopColor={colors.blueAccent[400]} stopOpacity=".0" />
          </linearGradient>
          <linearGradient id="greenGradient" gradientTransform="rotate(90)">
            <stop offset="5%" stopColor={colors.greenAccent[400]} stopOpacity=".2" />
            <stop offset="95%" stopColor={colors.greenAccent[400]} stopOpacity=".0" />
          </linearGradient>
        </defs>
      </LineChart>
    </Box>
  )
}
