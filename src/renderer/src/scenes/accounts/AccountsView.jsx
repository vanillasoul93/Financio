import React, { useState, useEffect, useCallback } from 'react'
import Header from '../../components/Header'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Fade,
  useTheme,
  Slide,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material'
import AccountDatagrid from './AccountDatagrid'
import AddCheckingForm from './AddCheckingAccountForm'
import AddCreditCardForm from './AddCreditCardForm'
import AddInvestmentAccountForm from './AddInvestmentAccountForm'
import AddSavingsAccountForm from './AddSavingsAccountForm'
import UsageProgressBar from './UsageProgressBar' // Make sure this is imported

// Assume this simulates your Knex data fetching functions
// In a real app, these would be actual async functions calling Knex
import {
  fetchCheckingAccounts,
  fetchCreditCardAccounts,
  fetchInvestmentAccounts,
  fetchSavingsAccounts
} from './dbSimulation' // New file for simulated DB calls

import { tokens } from '../../theme'
const tabToAccountType = ['checking', 'credit card', 'investment', 'savings']

export default function AccountsView() {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  // Define column definitions for each account type (unchanged from previous example)

  const openWebsite = () => {
    window.api.seedInvestments().then((result) => {
      console.log(result)
    })
  }

  const checkingColumns = [
    { field: 'id', headerName: 'ID', flex: 1, maxWidth: 70 },
    { field: 'name', headerName: 'Account Name', flex: 1, maxWidth: 250 },
    {
      field: 'balance',
      headerName: 'Current Balance',
      flex: 1,
      maxWidth: 250,
      type: 'tel',
      valueFormatter: (params) => `$${parseFloat(params)}`
    },
    { field: 'institution', headerName: 'Bank', flex: 1 }
  ]

  const creditCardColumns = [
    { field: 'id', headerName: 'ID', flex: 1, maxWidth: 70 },
    { field: 'name', headerName: 'Card Name', flex: 1 },
    {
      field: 'balance',
      headerName: 'Current Balance',
      flex: 1,
      type: 'tel',
      valueFormatter: (params) => `$${parseFloat(params).toLocaleString()}`
    },
    {
      field: 'credit_limit',
      headerName: 'Credit Limit',
      flex: 1,
      type: 'tel',
      valueFormatter: (params) => `$${parseFloat(params).toLocaleString()}`
    },
    {
      field: 'previousPayment',
      headerName: 'Last Payment',
      flex: 1,
      type: 'tel',
      valueFormatter: (params) => `$${parseFloat(params).toLocaleString()}`
    },
    {
      field: 'usage',
      headerName: 'Usage',
      flex: 1,
      renderCell: (value) => {
        const progressValue =
          value.row.credit_limit > 0
            ? (Math.abs(value.row.balance) / value.row.credit_limit) * 100
            : 0
        console.log('Current Progress Value: ' + progressValue)
        let color = colors.blueAccent[400]
        if (progressValue < 15) {
          color = colors.greenAccent[400]
        } else if (progressValue < 70) {
          color = colors.blueAccent[400]
        } else {
          color = colors.redAccent[500]
        }
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-evenly'
            }}
          >
            <Typography variant="h6" marginRight={2}>
              {`${Math.round(progressValue)}%`}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={progressValue}
              color="inherit"
              sx={{
                height: 25,
                width: 150,
                borderRadius: '5px',
                color: color
              }}
            />
          </Box>
        )
      }
    }
  ]

  const investmentColumns = [
    { field: 'account', headerName: 'Account', flex: 1 },
    { field: 'current_balance', headerName: 'Cash Balance', type: 'number', flex: 1 },
    { field: 'amount_invested', headerName: 'Amount Invested', type: 'number', flex: 1 },
    { field: 'assets_held', headerName: 'Assets Held', type: 'number', flex: 1 },
    { field: 'investments_made', headerName: 'Investments Made', type: 'number', flex: 1 }
  ]

  const savingsColumns = [
    { field: 'id', headerName: 'ID', flex: 1, maxWidth: 70 },
    { field: 'name', headerName: 'Account Name', flex: 1 },
    {
      field: 'balance',
      headerName: 'Current Balance',
      flex: 1,
      type: 'tel',
      valueFormatter: (params) => `$${parseFloat(params).toLocaleString()}`
    },
    {
      field: 'interest_rate',
      headerName: 'Interest Rate',
      flex: 1,
      type: 'tel',
      valueFormatter: (params) => `${parseFloat(params).toFixed(2)}%`
    }
  ]

  const [selectedTab, setSelectedTab] = useState(0)
  const [accountsData, setAccountsData] = useState([])
  const [loading, setLoading] = useState(true) // Initialize loading to true
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // 1. State to hold the selection
  const [selectionModel, setSelectionModel] = useState([])
  // Add this log to see the state on every render
  console.log('2. AccountsView is rendering. The current value of isModalOpen is:', isModalOpen)
  // Handlers to control the modal's visibility
  const handleOpenModal = () => {
    console.log('1. "Add Account" button clicked. Setting isModalOpen to true.')
    setIsModalOpen(true)
  }
  const handleCloseModal = () => setIsModalOpen(false)

  const handleConfirmOpen = () => {
    // Only open the confirmation if there is something selected
    if (selectionModel.length > 0) {
      setIsConfirmOpen(true)
    }
  }

  const handleConfirmClose = () => {
    setIsConfirmOpen(false)
  }

  const handleDelete = async () => {
    if (selectionModel.length === 0) return

    console.log('Deleting accounts with IDs:', selectionModel)
    const result = await window.api.deleteAccounts(selectionModel)

    if (result && result.success) {
      console.log('Accounts deleted successfully!')
      handleConfirmClose() // Close the confirmation dialog
      setSelectionModel([]) // Clear the selection
      fetchData() // Refresh the data grid
    } else {
      console.error('Failed to delete accounts:', result ? result.error : 'Unknown error')
      // You could show an error alert here
      handleConfirmClose()
    }
  }

  // Map tab index to account type string for DB query

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const accountType = tabToAccountType[selectedTab]
      let data

      if (accountType?.toLowerCase() === 'investment') {
        console.log('Fetching investment overview...')
        data = await window.api.getInvestmentOverview()
      } else if (accountType) {
        console.log(`Fetching accounts for type: ${accountType}`)
        data = await window.api.getAccounts(accountType)
      } else {
        throw new Error('Invalid account type selected.')
      }

      console.log('Data received in renderer:', data)
      setAccountsData(data || [])
    } catch (err) {
      console.error('Failed to fetch data in renderer:', err)
      // Assuming you have an setError state setter
      // setError(`Failed to load data: ${err.message}`);
      setAccountsData([])
    } finally {
      setLoading(false)
    }
  }, [selectedTab]) // Dependencies for useCallback

  // This function will be passed to the form components
  const handleAddAccount = async (formData) => {
    console.log('Submitting new account:', formData)
    const result = await window.api.addAccount(formData)

    if (result && result.success) {
      handleCloseModal() // Close the modal on success
      fetchData() // <-- This will now correctly re-fetch and update the grid
    } else {
      console.error('Failed to add account:', result ? result.error : 'Unknown error')
    }
  }

  const renderAddAccountModal = () => {
    const accountType = tabToAccountType[selectedTab]

    // Add this log to see what the function is working with
    console.log(
      '3. renderAddAccountModal is running. isModalOpen =',
      isModalOpen,
      '| accountType =',
      accountType
    )

    // Ensure the modal only renders when it's supposed to be open
    if (!isModalOpen) {
      console.log('4. Condition met: isModalOpen is false. Returning null.')
      return null
    }

    switch (accountType?.toLowerCase()) {
      case 'checking':
        console.log('5. Condition met: Rendering AddCheckingForm.')
        return (
          <AddCheckingForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleAddAccount}
          />
        )
      case 'savings':
        console.log('5. Condition met: Rendering AddSavingsAccountForm.')
        return (
          <AddSavingsAccountForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleAddAccount}
          />
        )

      case 'credit card':
        console.log('5. Condition met: Rendering AddCreditCardForm.')
        return (
          <AddCreditCardForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleAddAccount}
          />
        )

      case 'investment':
        console.log('5. Condition met: Rendering AddInvestmentAccountForm.')
        return (
          <AddInvestmentAccountForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleAddAccount}
          />
        )

      default:
        console.log('5. No matching case found in switch. Returning null.')
        return null
    }
  }

  // Effect to fetch data when the selectedTab changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const getCurrentColumns = () => {
    switch (selectedTab) {
      case 0:
        return checkingColumns
      case 1:
        return creditCardColumns
      case 2:
        return investmentColumns
      case 3:
        return savingsColumns
      default:
        return []
    }
  }

  const handleEdit = () => {
    // 1. Guard clause: Make sure exactly one row is selected.
    if (selectionModel.length !== 1) return

    // 2. Get the single ID from your selection model state.
    const selectedId = selectionModel[0]

    // 3. Use the JavaScript .find() method on your main data array
    //    to find the object where the 'id' matches your selectedId.
    const selectedRowData = accountsData.find((row) => row.id === selectedId)

    // 4. Now you have the complete data for the selected row!
    if (selectedRowData) {
      console.log('Full data for the selected row:', selectedRowData)

      // You can now access all of its properties:
      console.log('Card Name:', selectedRowData.name)
      console.log('Current Balance:', selectedRowData.balance)
      console.log('Credit Limit:', selectedRowData.credit_limit)

      // TODO: Open an edit modal and pass `selectedRowData` to it as a prop.
    }
  }

  return (
    <>
      <Box
        sx={{
          padding: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh', // Crucial: Takes full viewport height
          maxHeight: '100vh', // Explicitly limit max height too
          overflowY: 'hidden !important' // Prevent outer box itself from scrolling
        }}
      >
        <Box
          display="flex"
          justifyContent={'space-between'}
          alignItems={'center'}
          sx={{ mb: '32px' }}
        >
          <Header title="CREDIT CARDS" subtitle="Danger Zone!" />
        </Box>

        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiButtonBase-root, & .MuiTab-root, & .MuiTab-textColorPrimary': {
              fontSize: '15px'
            },
            '& .MuiButtonBase-root, & .MuiTab-root, & .MuiTab-textColorPrimary, & .Mui-Selected': {
              fontSize: '15px'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colors.blueAccent[400], // Your custom color
              color: 'red'
            },
            '& .MuiTab-root.Mui-selected': {
              // Target the selected tab root

              color: colors.grey[100] // Your custom color for the selected tab text
            }
          }}
        >
          <Tabs value={selectedTab} onChange={handleChange} aria-label="account tabs">
            <Tab label="Checking" />
            <Tab label="Credit Cards" />
            <Tab label="Investments" />
            <Tab label="Savings" />
          </Tabs>
        </Box>
        <Fade in={true} timeout={500} key={selectedTab}>
          <Box
            m="40px 0 0 0 "
            sx={{
              flex: 1,
              position: 'relative',
              overflowY: 'auto' // Enable vertical scrolling for this specific Box
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0 }}>
              {loading ? (
                <Box
                  width="100%"
                  height="100%"
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                >
                  <CircularProgress color="white" size={75} />
                </Box>
              ) : (
                <AccountDatagrid
                  rows={accountsData}
                  columns={getCurrentColumns()}
                  // This handler works for both checkbox and row clicks.
                  onSelectionModelChange={(newSelectionModel) => {
                    // Log the new array of IDs that the DataGrid provides.
                    console.log('Selection changed! New model:', newSelectionModel)

                    // Then, update the state as before.
                    setSelectionModel(newSelectionModel)
                  }}
                  // This prop correctly shows the selected row(s) by highlighting them.
                  rowSelectionModel={selectionModel}
                />
              )}
            </Box>
          </Box>
        </Fade>

        {/* Button Box */}
        <Slide in={true} direction="up">
          <Box display={'flex'} m="16px" justifyContent={'space-between'}>
            <Box>
              <Button
                variant="contained"
                style={{ backgroundColor: colors.blueAccent[600], width: '125px' }}
                onClick={openWebsite}
                size="large"
              >
                Website
              </Button>
            </Box>

            <Box display="flex" justifyContent={'flex-end'} gap={'8px'}>
              <Button
                variant="contained"
                style={{ backgroundColor: colors.redAccent[500], width: '125px' }}
                size="large"
                onClick={handleConfirmOpen}
                disabled={selectionModel.length === 0} // Disable if nothing is selected
              >
                Delete
              </Button>
              <Button
                variant="contained"
                style={{ backgroundColor: colors.blueAccent[600], width: '125px' }}
                size="large"
                onClick={() => handleEdit()}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                style={{ backgroundColor: colors.greenAccent[600], width: '125px' }}
                size="large"
                onClick={handleOpenModal}
              >
                Add
              </Button>
            </Box>
          </Box>
        </Slide>
        {/* 3. Render the correct modal using the helper function */}
        {renderAddAccountModal()}
      </Box>
      <Dialog
        open={isConfirmOpen}
        onClose={handleConfirmClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            backgroundColor: colors.primary[400],
            borderRadius: '15px',
            color: colors.grey[100]
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
          {'Confirm Deletion'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: colors.grey[100] }}>
            Are you sure you want to delete {selectionModel.length} selected account(s)? This action
            cannot be undone and will also delete all associated transactions.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: '20px' }}>
          <Button
            onClick={handleConfirmClose}
            variant="contained"
            sx={{
              backgroundColor: colors.blueAccent[600],
              '&:hover': { backgroundColor: colors.blueAccent[700] }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            autoFocus
            sx={{
              backgroundColor: colors.redAccent[500],
              '&:hover': { backgroundColor: colors.redAccent[600] }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
