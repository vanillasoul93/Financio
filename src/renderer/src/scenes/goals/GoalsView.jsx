import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Grid, // This assumes you are importing the modern Grid component (MUI v5/v6+ Grid2 behavior)
  Typography,
  LinearProgress,
  useTheme,
  Fade
} from '@mui/material'

import Header from '../../components/Header'
import GoalCard from './GoalCard'
import AddGoalModal from './AddGoalModal'

// --- Constants & Helper Functions (if any grow complex enough to warrant extraction) ---

const MonthlyInvestmentSummary = ({ totalMonthlyInvestments, colors }) => {
  // Hardcoded values for "November" and "$50" are present in the original component.
  // In a real application, you'd likely derive these dynamically (e.g., current month, actual saved amount).
  return (
    <Box
      width={'300px'}
      height={'180px'}
      backgroundColor={colors.primary[600]}
      borderRadius={'8px'}
      marginTop={'16px'}
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'flex-end'}
      alignItems={'center'}
      gap={'8px'}
      padding={'16px'}
    >
      <Box flexGrow={1}>
        <Typography variant="h2" fontWeight={'500'} color={colors.brand[400]}>
          November {/* Consider making this dynamic */}
        </Typography>
      </Box>
      <Box display={'flex'} gap={'8px'}>
        <Typography variant="h3" color={colors.grey[100]}>
          Goal:
        </Typography>
        <Typography variant="h3" color={colors.grey[100]}>
          ${totalMonthlyInvestments} /mo
        </Typography>
      </Box>
      <Box display={'flex'} gap={'8px'}>
        <Typography variant="h3" color={colors.grey[100]}>
          Saved:
        </Typography>
        <Typography variant="h3" color={colors.grey[100]}>
          $50 {/* Consider making this dynamic */}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        color="inherit" // Keep inherit for custom color via sx
        sx={{
          height: 20,
          borderRadius: '5px',
          mt: '8px',
          width: '100%',
          color: colors.brand[500] // Apply custom color here
        }}
        value={50} // Consider making this dynamic (e.g., (saved / goal) * 100)
      />
    </Box>
  )
}

// --- Main Component ---

export default function GoalsView() {
  const theme = useTheme()
  const colors = theme.colors

  // --- State Management ---
  const [goals, setGoals] = useState([])
  const [totalMonthlyInvestments, setTotalMonthlyInvestments] = useState(0)
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false)

  // --- Data Fetching and Persistence Logic ---

  const fetchGoals = useCallback(async () => {
    try {
      const data = await window.api.getGoals()
      let totalInvestment = 0
      data.forEach((goal) => {
        totalInvestment += Number(goal.monthly_investment) || 0
        // console.log('GOAL ICON FOR GOAL ' + goal.name + ': ' + goal.icon); // Can remove this if no longer needed for debugging
      })
      setTotalMonthlyInvestments(totalInvestment)
      // console.log('Total Monthly Investment: ' + totalInvestment); // Can remove this if no longer needed for debugging
      setGoals(data)
    } catch (error) {
      console.error('Error fetching goals:', error)
      // TODO: Implement user-facing error notification (e.g., Snackbar)
    }
  }, [])

  const handleDeleteGoal = useCallback(async (idToDelete) => {
    try {
      const response = await window.api.deleteGoal(idToDelete)
      if (response.success) {
        console.log(`Goal with ID ${idToDelete} deleted successfully.`)
        // Optimistic UI update: remove from state immediately
        setGoals((prevGoals) => {
          const updatedGoals = prevGoals.filter((goal) => goal.id !== idToDelete)
          // Recalculate total investments after deletion
          const deletedGoal = prevGoals.find((goal) => goal.id === idToDelete)
          setTotalMonthlyInvestments(
            (prevTotal) => prevTotal - (Number(deletedGoal?.monthly_investment) || 0)
          )
          return updatedGoals
        })
      } else {
        console.error('Failed to delete goal:', response.error)
        // TODO: Implement user-facing error notification
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      // TODO: Implement user-facing error notification
    }
  }, []) // Removed 'goals' from dependency, relying on prevGoals in setState callback

  const handleCardUpdate = useCallback(async (id, updatedFields) => {
    console.log('CARD IS BEING UPDATED!')
    setGoals((prevData) => {
      const updatedData = prevData.map((card) =>
        card.id === id ? { ...card, ...updatedFields } : card
      )

      const updatedCard = updatedData.find((card) => card.id === id)
      if (updatedCard) {
        // Find the old goal for correct total investment recalculation
        const oldGoal = prevData.find((goal) => goal.id === id)
        const oldInvestment = Number(oldGoal?.monthly_investment) || 0
        const newInvestment =
          Number(updatedFields.monthly_investment) || Number(updatedCard.monthly_investment) || 0

        // Update total monthly investments if 'monthly_investment' changed
        if ('monthly_investment' in updatedFields) {
          setTotalMonthlyInvestments((prevTotal) => prevTotal - oldInvestment + newInvestment)
        }
        window.api.updateGoal(updatedCard) // Asynchronous call without await here for non-blocking UI
      }
      return updatedData
    })
  }, []) // No 'goals' dependency needed if using prevState correctly

  const handleAddGoalSubmit = useCallback(
    async (formData) => {
      console.log('Goal form submitted from modal:', formData)

      try {
        // Optimistic UI update: Add a temporary ID and the new goal
        const tempId = Date.now()
        const newGoalWithTempId = { ...formData, id: tempId }

        setGoals((prevGoals) => [...prevGoals, newGoalWithTempId])
        setTotalMonthlyInvestments(
          (prevTotal) => prevTotal + (Number(formData.monthly_investment) || 0)
        )

        const response = await window.api.addGoal(formData) // Await the API call

        if (!response.success) {
          throw new Error(response.error || 'Failed to add goal')
        }

        // If your API returns the full goal object with the correct ID, you can use it
        // to replace the temporary goal in state for accurate server-assigned IDs.
        // E.g., if (response.newGoal) {
        //   setGoals(prevGoals => prevGoals.map(g => g.id === tempId ? response.newGoal : g));
        // }

        // After successful addition, refetch to ensure consistency, especially if IDs are server-generated
        fetchGoals() // Refetch all goals to get server-generated IDs and exact state
      } catch (error) {
        console.error('Error adding goal:', error)
        // Revert optimistic update if there was an error
        setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== Date.now())) // Uses the temp ID
        setTotalMonthlyInvestments(
          (prevTotal) => prevTotal - (Number(formData.monthly_investment) || 0)
        ) // Revert total
        // TODO: Implement user-facing error notification
      } finally {
        handleCloseAddGoalModal() // Ensure modal closes regardless of success/failure
      }
    },
    [fetchGoals]
  )

  // --- Effects ---

  // Get goals from DB on initial load
  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  // --- Modal Handlers ---

  const handleAddGoalModal = () => {
    setIsAddGoalModalOpen(true)
  }

  const handleCloseAddGoalModal = () => {
    setIsAddGoalModalOpen(false)
  }

  // --- Render Logic ---
  return (
    <Box
      sx={{
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent={'space-between'}
        alignItems={'center'}
        sx={{ mb: '32px' }}
      >
        <Header title="GOALS" subtitle="Dream => Work => Achieve." />
      </Box>
      <Fade in={true} timeout={500}>
        {/* Add Goal Button */}
        <Box height={'40px'}>
          <Button
            size="large"
            variant="contained"
            sx={{ backgroundColor: colors.brand[700], width: '100px' }}
            onClick={handleAddGoalModal}
          >
            Add
          </Button>
        </Box>
      </Fade>
      <Fade in={true} timeout={500}>
        {/* Monthly Investment Status Card */}
        <Box>
          <MonthlyInvestmentSummary
            totalMonthlyInvestments={totalMonthlyInvestments}
            colors={colors}
          />
        </Box>
      </Fade>
      <Fade in={true} timeout={500}>
        {/* Goal Cards Grid */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            paddingRight: '16px',
            marginRight: '-16px', // Compensate for padding to avoid scrollbar eating content
            marginTop: '16px'
          }}
        >
          {/*
          Using the modern Grid component (MUI v5+ Grid2 behavior).
          No 'item' prop needed on children, and responsive sizing uses 'size' prop directly on Grid (the item).
        */}
          <Grid container spacing={2} justifyContent={'center'}>
            {goals.map((goal) => (
              // The Grid component itself acts as the item and takes the responsive 'size' props
              <Grid key={goal.id} size={{ xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }}>
                <GoalCard card={goal} onUpdate={handleCardUpdate} onDelete={handleDeleteGoal} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Fade>

      {/* Add Goal Modal */}
      <AddGoalModal
        open={isAddGoalModalOpen}
        onClose={handleCloseAddGoalModal}
        onSubmit={handleAddGoalSubmit}
      />
    </Box>
  )
}
