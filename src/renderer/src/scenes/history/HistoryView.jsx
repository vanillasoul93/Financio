import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  useTheme
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import Header from '../../components/Header'

// Import your centralized icon map and names
import muiIconMap, { allMuiIconNames } from '../../muiIconMap'

export default function HistoryView() {
  const theme = useTheme()
  const colors = theme.colors
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredIconNames, setFilteredIconNames] = useState(allMuiIconNames)
  const [selectedIconName, setSelectedIconName] = useState(null)
  const [SelectedIconComponent, setSelectedIconComponent] = useState(null) // Renamed for clarity

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    const filtered = allMuiIconNames.filter((name) =>
      name.toLowerCase().includes(lowerCaseSearchTerm)
    )
    setFilteredIconNames(filtered)
  }, [searchTerm])

  useEffect(() => {
    if (selectedIconName) {
      setSelectedIconComponent(() => muiIconMap[selectedIconName]) // Get directly from map
    } else {
      setSelectedIconComponent(null)
    }
  }, [selectedIconName])

  const handleIconSelect = (iconName) => {
    setSelectedIconName(iconName)
  }

  const clearSelectedIcon = () => {
    setSelectedIconName(null)
    setSelectedIconComponent(null)
  }
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
        <Header title="HISTORY" subtitle="Payment History" />
      </Box>
    </Box>
  )
}
