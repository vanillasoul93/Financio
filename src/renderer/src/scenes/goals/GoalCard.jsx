import React, { useState, useEffect, useMemo, useCallback, forwardRef } from 'react'
import {
  Box,
  Card,
  useTheme,
  Typography,
  Button,
  TextField,
  OutlinedInput,
  InputAdornment,
  Slide,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton
} from '@mui/material'
import LinearProgress from '@mui/material/LinearProgress' // No need for linearProgressClasses import if not used
import EditIcon from '@mui/icons-material/Edit' // Use specific icon if Insights is not dynamic

import IconPicker from '../../components/IconPicker'
import muiIconMap from '../../muiIconMap' // Assuming allMuiIconNames is part of this or separate

// --- Helper Components for better readability ---

// Component for the main display of the Goal Card
const GoalDisplayView = ({
  colors,
  percentage,
  CurrentGoalIcon,
  savedValue,
  goalValue,
  monthlyValue,
  name,
  description,
  monthsLeft,
  handleConfirmOpen,
  updateCardOverlay
}) => (
  <>
    <Box
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      justifyContent={'flex-start'}
    >
      {/* Goal Icon */}
      <CurrentGoalIcon sx={{ width: 175, height: 175, fill: colors.blueAccent[600] }} />

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        color="inherit"
        sx={{
          height: 20,
          borderRadius: '5px',
          mt: '8px',
          width: '100%',
          // Conditional color based on percentage
          color: percentage >= 100 ? 'goldenrod' : colors.blueAccent[500]
        }}
        value={percentage}
      />

      {/* Current Saved / Goal Value */}
      <Box display={'flex'} gap={'8px'} mt={'16px'} color={colors.grey[100]}>
        <Typography variant="h4" fontWeight={600}>
          ${savedValue}
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          /
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          ${goalValue}
        </Typography>
      </Box>

      {/* Monthly Investment */}
      <Typography variant="h5" fontWeight={600} mt={'8px'}>
        ${monthlyValue} /mo
      </Typography>

      {/* Goal Name */}
      <Typography
        variant="h2"
        fontWeight={600}
        color={colors.greenAccent[500]}
        mt={'8px'}
        textAlign={'center'}
      >
        {name}
      </Typography>

      {/* Description (Scrollable) */}
      <Box
        sx={{
          margin: '16px 8px 0 8px',
          maxHeight: '130px',
          overflowY: 'auto',
          borderRadius: '4px'
        }}
      >
        <Typography
          textAlign={'center'}
          variant="h5"
          fontWeight={400}
          color={colors.grey[100]}
          flexGrow={1}
          flexShrink={1}
          sx={{ overflowWrap: 'break-word' }} // Use sx prop for overflowWrap
        >
          {description}
        </Typography>
      </Box>
    </Box>

    {/* Bottom Section: Months Remaining & Action Buttons */}
    <Box width={'100%'} mt={'8px'} display={'flex'} flexDirection={'column'}>
      <Typography
        textAlign={'center'}
        m={'5px 5px 5px 5px'}
        variant="h5"
        fontWeight={400}
        color={colors.blueAccent[400]}
        flexGrow={1}
        flexShrink={1}
        sx={{ overflowWrap: 'break-word' }}
      >
        {monthsLeft} months remaining.
      </Typography>
      <Box width={'100%'} mt={'8px'} display={'flex'}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.redAccent[600],
            width: '100%',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderTopRightRadius: 0
          }}
          onClick={handleConfirmOpen}
        >
          Delete
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: colors.greenAccent[600],
            width: '100%',
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
            borderBottomRightRadius: '16px'
          }}
          onClick={updateCardOverlay}
        >
          Update
        </Button>
      </Box>
    </Box>
  </>
)

// Component for the Update Goal Overlay
// Add forwardRef here
const GoalUpdateOverlay = forwardRef(
  (
    {
      colors,
      percentage,
      CurrentGoalIcon,
      handleEditClick,
      handleNameChange,
      name,
      handleDescriptionChange,
      description,
      handleGoalChange,
      goalValue,
      handleCurrentSavedChange,
      savedValue,
      handleMonthlyChange,
      monthlyValue,
      cancelUpdate,
      handleSave
    },
    ref
  ) => {
    // <-- Add 'ref' as the second argument
    return (
      <Box
        ref={ref} // <-- Attach the forwarded ref to the outermost DOM element or MUI component
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '100%',
          height: '100%',
          backgroundColor: colors.primary[600],
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        {/* ... rest of GoalUpdateOverlay's JSX ... */}
        <Box
          backgroundColor={colors.primary[600]}
          display={'flex'}
          flexGrow={1}
          flexDirection={'column'}
          borderRadius={'8px'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          {/* Icon with Edit Button */}
          <Box
            sx={{
              display: 'flex',
              flexGrow: '1',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <CurrentGoalIcon sx={{ width: 100, height: 100, fill: colors.blueAccent[600] }} />
            <IconButton
              aria-label="edit goal icon"
              onClick={handleEditClick}
              sx={{
                position: 'absolute',
                width: 36,
                height: 36,
                bottom: -8,
                right: -8,
                backgroundColor: colors.blueAccent[500],
                borderRadius: '50%',
                boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.3)',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'background-color 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: colors.blueAccent[400],
                  transform: 'scale(1.05)',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.4)'
                }
              }}
            >
              <EditIcon sx={{ width: 20, height: 20, color: colors.grey[100] }} />
            </IconButton>
          </Box>

          <Box margin={'8px'}>
            {/* Progress Bar (repeated, could be a component if logic differs) */}
            <LinearProgress
              variant="determinate"
              color="inherit"
              sx={{
                height: 20,
                borderRadius: '5px',
                mt: '8px',
                width: '100%',
                color: percentage >= 100 ? 'goldenrod' : colors.blueAccent[500]
              }}
              value={percentage}
            />

            {/* Input Fields */}
            <TextField
              margin="normal"
              label={'Name'}
              variant="outlined"
              fullWidth
              multiline
              rows={1}
              value={name} // Use value for controlled component
              onChange={handleNameChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.grey[300] },
                  '&:hover fieldset': { borderColor: colors.greenAccent[400] },
                  '&.Mui-focused fieldset': { borderColor: colors.blueAccent[500] }
                },
                '& .MuiInputLabel-root': { color: colors.grey[100] },
                '& .MuiInputBase-input': { color: colors.grey[100] },
                overflowWrap: 'break-word'
              }}
            />
            <TextField
              margin="normal"
              label={'Description'}
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={description} // Use value for controlled component
              onChange={handleDescriptionChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.grey[300] },
                  '&:hover fieldset': { borderColor: colors.greenAccent[400] },
                  '&.Mui-focused fieldset': { borderColor: colors.blueAccent[500] }
                },
                '& .MuiInputLabel-root': { color: colors.grey[100] },
                '& .MuiInputBase-input': { color: colors.grey[100] },
                overflowWrap: 'break-word'
              }}
            />

            {/* Goal Input */}
            <Divider textAlign="left" sx={{ color: colors.grey[200], my: '8px' }}>
              Goal
            </Divider>
            <Box display={'flex'} justifyContent={'center'} gap={'8px'}>
              <OutlinedInput
                id="goal-amount-input"
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                type="number" // Use number type for numerical inputs
                onChange={handleGoalChange}
                value={goalValue}
                sx={{ width: '160px', height: '35px' }}
              />
            </Box>

            {/* Saved Input */}
            <Divider textAlign="left" sx={{ mt: '8px', color: colors.grey[200] }}>
              Saved
            </Divider>
            <Box display={'flex'} justifyContent={'center'} gap={'8px'}>
              <OutlinedInput
                id="saved-amount-input"
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                type="number" // Use number type for numerical inputs
                onChange={handleCurrentSavedChange}
                value={savedValue}
                sx={{ width: '160px', height: '35px' }}
              />
            </Box>

            {/* Monthly Input */}
            <Divider textAlign="left" sx={{ mt: '8px', color: colors.grey[200] }}>
              Monthly
            </Divider>
            <Box display={'flex'} justifyContent={'center'} gap={'8px'}>
              <OutlinedInput
                id="monthly-amount-input"
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                type="number" // Use number type for numerical inputs
                onChange={handleMonthlyChange}
                value={monthlyValue}
                sx={{ width: '160px', height: '35px' }}
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box display={'flex'} justifyContent={'center'} width={'100%'}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.redAccent[600],
                width: '100%',
                borderBottomLeftRadius: '16px',
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0
              }}
              onClick={cancelUpdate}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: colors.greenAccent[600],
                width: '100%',
                borderBottomRightRadius: '16px',
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0
              }}
              onClick={handleSave}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }
)

// Component for the Delete Confirmation Dialog
const DeleteConfirmationDialog = ({ open, onClose, onConfirmDelete, name, colors }) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle variant="h3" id="alert-dialog-title">
      {'Confirm Delete'}
    </DialogTitle>
    <DialogContent>
      <DialogContentText variant="h5" id="alert-dialog-description">
        Are you sure you want to delete
      </DialogContentText>
      <DialogContentText color={colors.greenAccent[400]} variant="h4" id="alert-dialog-description">
        {name}?
      </DialogContentText>
      <DialogContentText variant="h5" id="alert-dialog-description">
        This action cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button
        variant="contained"
        sx={{ backgroundColor: colors.blueAccent[400], width: '100%', borderRadius: '4px' }}
        onClick={onClose}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        sx={{ backgroundColor: colors.redAccent[600], width: '100%', borderRadius: '4px' }}
        onClick={onConfirmDelete}
        autoFocus
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
)

// --- Main GoalCard Component ---

export default function GoalCard({ card, onUpdate, onDelete }) {
  const theme = useTheme()
  const colors = theme.colors

  // --- State Management ---
  const [percentage, setPercentage] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [savedValue, setSavedValue] = useState(card.current_value)
  const [goalValue, setGoalValue] = useState(card.goal_value)
  const [description, setDescription] = useState(card.description)
  const [monthlyValue, setMonthlyValue] = useState(card.monthly_investment)
  const [monthsLeft, setMonthsLeft] = useState(null)
  const [name, setName] = useState(card.name)
  const [currentGoalIconName, setCurrentGoalIconName] = useState(card.icon)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Get the actual React component for the current icon
  // Fallback to EditIcon if not found (though Insights was default in original)
  const CurrentGoalIcon = useMemo(
    () => muiIconMap[currentGoalIconName] || EditIcon,
    [currentGoalIconName]
  )

  // --- Helper Functions for Calculations ---
  const calculatePercentage = useCallback((current, goal) => {
    if (!goal || goal === 0) return 0 // Avoid division by zero
    const calc = (current / goal) * 100
    return calc > 100 ? 100 : calc
  }, [])

  const calculateMonthsLeft = useCallback((goal, saved, monthly) => {
    if (!monthly || monthly <= 0) return Infinity // Prevent division by zero or negative monthly investment
    const remaining = goal - saved
    return Math.round(Math.max(0, remaining / monthly)) // Ensure monthsLeft is not negative
  }, [])

  // --- Event Handlers ---

  const updateCardOverlay = useCallback(() => {
    setUpdating(true)
    console.log('ID of card being updated: ' + card.id)
  }, [card.id])

  const cancelUpdate = useCallback(() => {
    setUpdating(false)
    // Reset states to original card values
    setSavedValue(card.current_value)
    setGoalValue(card.goal_value)
    setMonthlyValue(card.monthly_investment)
    setName(card.name)
    setDescription(card.description)
    setCurrentGoalIconName(card.icon)
    // Recalculate percentage and months left based on original values
    setPercentage(calculatePercentage(card.current_value, card.goal_value))
    setMonthsLeft(calculateMonthsLeft(card.goal_value, card.current_value, card.monthly_investment))
  }, [
    card.current_value,
    card.goal_value,
    card.monthly_investment,
    card.name,
    card.description,
    card.icon,
    calculatePercentage,
    calculateMonthsLeft
  ])

  const handleCurrentSavedChange = useCallback(
    (event) => {
      const newValue = parseFloat(event.target.value)
      if (!isNaN(newValue)) {
        setSavedValue(newValue)
        setPercentage(calculatePercentage(newValue, goalValue))
      }
    },
    [goalValue, calculatePercentage]
  )

  const handleGoalChange = useCallback(
    (event) => {
      const newValue = parseFloat(event.target.value)
      if (!isNaN(newValue)) {
        setGoalValue(newValue)
        setPercentage(calculatePercentage(savedValue, newValue))
        setMonthsLeft(calculateMonthsLeft(newValue, savedValue, monthlyValue))
      }
    },
    [savedValue, monthlyValue, calculatePercentage, calculateMonthsLeft]
  )

  const handleMonthlyChange = useCallback(
    (event) => {
      const newValue = parseFloat(event.target.value)
      if (!isNaN(newValue)) {
        setMonthlyValue(newValue)
        setMonthsLeft(calculateMonthsLeft(goalValue, savedValue, newValue))
      }
    },
    [goalValue, savedValue, calculateMonthsLeft]
  )

  const handleNameChange = useCallback((event) => {
    setName(event.target.value)
  }, [])

  const handleDescriptionChange = useCallback((event) => {
    setDescription(event.target.value)
  }, [])

  const handleSave = useCallback(() => {
    const updatedFields = {
      name: name,
      description: description,
      current_value: savedValue,
      goal_value: goalValue,
      monthly_investment: monthlyValue,
      icon: currentGoalIconName
    }
    onUpdate(card.id, updatedFields)
    // No need to call getExpectedCompletion() here as it's handled by state updates
    setUpdating(false)
  }, [
    card.id,
    name,
    description,
    savedValue,
    goalValue,
    monthlyValue,
    currentGoalIconName,
    onUpdate
  ])

  // Note: updateSavedInput and updateGoalInput are not used in the current JSX.
  // They seemed to be for "add amount" buttons which aren't present.
  // Keeping them here for completeness if you intend to re-add buttons.
  const updateSavedInput = useCallback(
    (event) => {
      const valueToAdd = parseFloat(event.target.value)
      if (!isNaN(valueToAdd)) {
        const newValue = savedValue + valueToAdd
        setSavedValue(newValue)
        setPercentage(calculatePercentage(newValue, goalValue))
      }
    },
    [savedValue, goalValue, calculatePercentage]
  )

  const updateGoalInput = useCallback(
    (event) => {
      const valueToAdd = parseFloat(event.target.value)
      if (!isNaN(valueToAdd)) {
        const newValue = goalValue + valueToAdd
        setGoalValue(newValue)
        setPercentage(calculatePercentage(savedValue, newValue))
      }
    },
    [savedValue, goalValue, calculatePercentage]
  )

  const handleConfirmOpen = useCallback(() => {
    setConfirmOpen(true)
  }, [])

  const handleConfirmClose = useCallback(() => {
    setConfirmOpen(false)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    onDelete(card.id)
    setConfirmOpen(false)
  }, [card.id, onDelete])

  const handleEditClick = useCallback(() => {
    setIsIconPickerOpen(true)
  }, [])

  const handleIconSelect = useCallback((iconName) => {
    setCurrentGoalIconName(iconName)
    setIsIconPickerOpen(false)
  }, [])

  // No need for a separate handleCloseIconSelector if onClose does the job.
  // const handleCloseIconSelector = useCallback(() => {
  //   setIsIconPickerOpen(false);
  // }, []);

  // --- Effects ---
  useEffect(() => {
    // Initial calculation when component mounts or card prop changes
    setPercentage(calculatePercentage(card.current_value, card.goal_value))
    setMonthsLeft(calculateMonthsLeft(card.goal_value, card.current_value, card.monthly_investment))
    // Also reset state if the 'card' prop itself changes (e.g., from parent re-fetching)
    setSavedValue(card.current_value)
    setGoalValue(card.goal_value)
    setMonthlyValue(card.monthly_investment)
    setName(card.name)
    setDescription(card.description)
    setCurrentGoalIconName(card.icon)
  }, [
    card, // Depend on the entire card object
    calculatePercentage,
    calculateMonthsLeft
  ])

  // --- Render Logic ---
  return (
    <div>
      <Card
        sx={{
          minWidth: 300,
          height: 550,
          maxHeight: 550,
          borderRadius: '16px',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative' // Needed for the Slide overlay
        }}
      >
        {/* Main Goal Card Display */}
        <Box
          display={'flex'}
          flexGrow={1}
          flexDirection={'column'}
          justifyContent={'space-between'}
          sx={{ backgroundColor: colors.primary[600] }}
        >
          <GoalDisplayView
            colors={colors}
            percentage={percentage}
            CurrentGoalIcon={CurrentGoalIcon}
            savedValue={savedValue}
            goalValue={goalValue}
            monthlyValue={monthlyValue}
            name={name}
            description={description}
            monthsLeft={monthsLeft}
            handleConfirmOpen={handleConfirmOpen}
            updateCardOverlay={updateCardOverlay}
          />
        </Box>

        {/* Overlay for updating the Goal Card */}
        <Slide direction="up" in={updating} mountOnEnter unmountOnExit>
          <GoalUpdateOverlay
            colors={colors}
            percentage={percentage}
            CurrentGoalIcon={CurrentGoalIcon}
            handleEditClick={handleEditClick}
            handleNameChange={handleNameChange}
            name={name}
            handleDescriptionChange={handleDescriptionChange}
            description={description}
            handleGoalChange={handleGoalChange}
            goalValue={goalValue}
            handleCurrentSavedChange={handleCurrentSavedChange}
            savedValue={savedValue}
            handleMonthlyChange={handleMonthlyChange}
            monthlyValue={monthlyValue}
            cancelUpdate={cancelUpdate}
            handleSave={handleSave}
          />
        </Slide>
      </Card>

      {/* Icon Selector Overlay (Dialog) */}
      <IconPicker
        open={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)} // Pass an inline function or memoized handler
        onSelectIcon={handleIconSelect}
        currentGoalIconName={currentGoalIconName}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        onConfirmDelete={handleConfirmDelete}
        name={name}
        colors={colors}
      />
    </div>
  )
}
