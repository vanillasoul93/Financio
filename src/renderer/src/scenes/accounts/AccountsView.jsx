import React, { useState, useEffect } from 'react'
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
  DialogContent
} from '@mui/material'
import AccountDatagrid from './AccountDatagrid'
import AddCheckingForm from './AddCheckingForm'
import AddCreditCardForm from './AddCreditCardForm'
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
          value.row.credit_limit > 0 ? (value.row.balance / value.row.credit_limit) * 100 : 0
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
              justifyContent: 'center'
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
                height: 20,
                borderRadius: '5px',
                width: '100%',
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

  // 1. State to hold the selection
  const [selectionModel, setSelectionModel] = useState([])

  // Handlers to control the modal's visibility
  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => setIsModalOpen(false)

  // Map tab index to account type string for DB query
  const tabToAccountType = ['checking', 'credit_card', 'investment', 'savings']

  // This function will be passed to the form components
  const handleAddAccount = async (formData) => {
    console.log('Submitting new account:', formData)
    // Assumes you have an `addAccount` function exposed via your preload script
    //const result = await window.api.addAccount(formData)
    if (!result.error) {
      handleCloseModal() // Close the modal on success
      fetchData() // Re-fetch the data to update the grid
    } else {
      // Handle the error (e.g., show an alert)
      console.error('Failed to add account:', result.error)
    }
  }

  // This helper function returns the correct form component based on the tab
  const renderModalForm = () => {
    const accountType = tabToAccountType[selectedTab]

    switch (accountType?.toLowerCase()) {
      case 'checking':
      case 'savings': // Assuming savings form is same as checking
        return <AddCheckingForm onSubmit={handleAddAccount} onCancel={handleCloseModal} />
      case 'credit card':
        return <AddCreditCardForm onSubmit={handleAddAccount} onCancel={handleCloseModal} />
      case 'investment':
        // You would create and return an <AddInvestmentForm /> here
        return <p>Investment form coming soon...</p>
      default:
        return null
    }
  }

  // Effect to fetch data when the selectedTab changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        const accountType = tabToAccountType[selectedTab]
        let data

        if (accountType === 'investment') {
          console.log('Fetching investment overview...')
          data = await window.api.getInvestmentOverview()
        } else if (accountType) {
          console.log(`Fetching accounts for type: ${accountType}`)
          data = await window.api.getAccounts(accountType)
        } else {
          throw new Error('Invalid account type selected.')
        }

        // --- ADD THIS LINE TO LOG THE FETCHED DATA ---
        console.log('Data received in renderer:', data)

        setAccountsData(data || []) // Set the fetched data
      } catch (err) {
        console.error('Failed to fetch data in renderer:', err)
        setError(`Failed to load data: ${err.message}`)
        setAccountsData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedTab])

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
      <Fade in={true} timeout={500}>
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
              //onClick={handleConfirmOpen}
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
      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>Add New {tabToAccountType[selectedTab]} Account</DialogTitle>
        <DialogContent>{renderModalForm()}</DialogContent>
      </Dialog>
    </Box>
  )
}
