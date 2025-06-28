import React, { useContext } from 'react'
import { Select, MenuItem, FormControl, InputLabel, useTheme } from '@mui/material'
import { ColorModeContext } from '../theme' // Adjust path if necessary

/**
 * A dropdown component that allows users to switch between available themes.
 */
const ThemeSwitcher = () => {
  const theme = useTheme()
  // Use the custom 'colors' object attached to the theme
  const colors = theme.colors

  // Use the context to get the current theme name and the function to set a new theme
  const { themeName, setTheme } = useContext(ColorModeContext)

  const handleChange = (event) => {
    // Call the setTheme function from the context with the new theme's name
    setTheme(event.target.value)
  }

  return (
    <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
      <InputLabel
        id="theme-select-label"
        sx={{
          color: colors.grey[100],
          '&.Mui-focused': {
            color:
              colors.greenAccent?.[400] ||
              colors.purpleAccent?.[500] ||
              colors.blurpleAccent?.[500] ||
              colors.grey[100]
          }
        }}
      >
        Theme
      </InputLabel>
      <Select
        labelId="theme-select-label"
        id="theme-select"
        value={themeName || 'default'} // Use current theme name, fallback to default
        label="Theme"
        onChange={handleChange}
        sx={{
          color: colors.grey[100],
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: colors.grey[400]
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.grey[100]
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor:
              colors.greenAccent?.[400] ||
              colors.purpleAccent?.[500] ||
              colors.blurpleAccent?.[500] ||
              colors.grey[100]
          },
          '.MuiSvgIcon-root': {
            color: colors.grey[100]
          }
        }}
      >
        <MenuItem value="default">Default</MenuItem>
        <MenuItem value="simple">Simple Dark</MenuItem>
        <MenuItem value="twitch">Twitch</MenuItem>
        <MenuItem value="discord">Discord</MenuItem>
      </Select>
    </FormControl>
  )
}

export default ThemeSwitcher
