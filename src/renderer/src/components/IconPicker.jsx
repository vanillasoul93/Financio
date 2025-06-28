import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Box,
  Typography,
  useTheme,
  Grid // Import Grid component
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close' // Keep CloseIcon for the title bar
import muiIconMap, { allMuiIconNames } from '../muiIconMap' // Adjust the path as needed

function IconPicker({
  open: isIconSelectorOpen,
  onClose: handleCloseIconSelector,
  onSelectIcon: handleIconSelect,
  currentGoalIconName
}) {
  const theme = useTheme()
  const colors = theme.colors
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIconNames = allMuiIconNames.filter((iconName) =>
    iconName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
  }
  const handleIconSelectionAndClose = (iconName) => {
    handleIconSelect(iconName) // Call the parent's onSelectIcon prop
    handleCloseIconSelector() // Call the parent's onClose prop to close the dialog
  }

  return (
    <Dialog
      open={isIconSelectorOpen}
      onClose={handleCloseIconSelector}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.primary[900],
          color: colors.grey[100],
          borderRadius: '8px'
        }
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: `1px solid ${colors.grey[700]}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        Select an Icon
        <IconButton onClick={handleCloseIconSelector} sx={{ color: colors.grey[100] }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            mb: 2, // Margin bottom for spacing
            '& .MuiPaper-root': {
              backgroundColor: colors.primary[900]
            },
            '& .MuiOutlinedInput-root': {
              color: colors.grey[100],
              '& fieldset': {
                borderColor: colors.grey[500]
              },
              '&:hover fieldset': {
                borderColor: colors.grey[400]
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.blueAccent[500]
              }
            },
            '& .MuiInputLabel-root': {
              color: colors.grey[300]
            },
            '& .MuiInputAdornment-root .MuiSvgIcon-root': {
              color: colors.grey[300]
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />

        <Grid
          container
          spacing={1}
          sx={{
            maxHeight: '60vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 1,
            paddingRight: '16px'
          }}
        >
          {filteredIconNames.length > 0 ? (
            filteredIconNames.map((iconName) => {
              const IconComponent = muiIconMap[iconName]
              if (!IconComponent) return null

              return (
                <Grid key={iconName} size={{ xs: 3, sm: 2, md: 1.5, lg: 1 }}>
                  {' '}
                  {/* Adjusted grid item sizing */}
                  <IconButton
                    onClick={() => handleIconSelectionAndClose(iconName)}
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: colors.blueAccent[700]
                      },
                      border:
                        iconName === currentGoalIconName
                          ? `2px solid ${colors.greenAccent[500]}`
                          : '2px solid transparent'
                    }}
                  >
                    <IconComponent sx={{ fontSize: 36, color: colors.grey[100] }} />
                  </IconButton>
                </Grid>
              )
            })
          ) : (
            <Box sx={{ p: 2, width: '100%', textAlign: 'center', gridColumn: '1 / -1' }}>
              {' '}
              {/* Center text in grid */}
              <Typography variant="body1" sx={{ color: colors.grey[400] }}>
                No icons found for "{searchQuery}"
              </Typography>
            </Box>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ borderTop: `1px solid ${colors.grey[700]}`, pr: 3, pb: 2 }}>
        {' '}
        {/* Added padding-right and padding-bottom */}
        <Button onClick={handleCloseIconSelector} sx={{ color: colors.grey[100] }}>
          Close
        </Button>{' '}
        {/* Changed from Cancel to Close as per your previous dialog actions */}
      </DialogActions>
    </Dialog>
  )
}

export default IconPicker
