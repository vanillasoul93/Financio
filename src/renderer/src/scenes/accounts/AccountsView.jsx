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
  LinearProgress
} from '@mui/material'
import AccountDatagrid from './AccountDatagrid'
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

  // 1. State to hold the selection
  const [selectionModel, setSelectionModel] = useState([])

  // Map tab index to account type string for DB query
  const tabToAccountType = ['checking', 'credit_card', 'investment', 'savings']

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
              <AccountDatagrid rows={accountsData} columns={getCurrentColumns()} />
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
              //onClick={() => handleEditCreditCardModal(selection)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: colors.greenAccent[600], width: '125px' }}
              size="large"
              //onClick={handleAddCreditCardModal}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Slide>
    </Box>
  )
}
