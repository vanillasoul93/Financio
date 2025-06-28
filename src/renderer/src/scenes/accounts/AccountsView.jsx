import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import Header from '../../components/Header'
import AccountDatagrid from './AccountDatagrid'
import AddCheckingForm from './AddCheckingAccountForm'
import AddCreditCardForm from './AddCreditCardForm'
import AddInvestmentAccountForm from './AddInvestmentAccountForm'
import AddSavingsAccountForm from './AddSavingsAccountForm'
import { tokens } from '../../theme'

// =================================================================================
//  CONSTANTS & COLUMN DEFINITIONS
//  Moved outside the component to prevent re-declaration on every render.
// =================================================================================

const tabToAccountType = ['checking', 'credit card', 'investment', 'savings']

const getUsageProgressBar = (params, colors) => {
  // Defensively check if the necessary data exists before calculating.
  if (
    !params.row ||
    typeof params.row.balance === 'undefined' ||
    typeof params.row.credit_limit === 'undefined'
  ) {
    return null // Return null or a placeholder if data is missing.
  }

  const balance = Math.abs(params.row.balance)
  const limit = params.row.credit_limit
  const progressValue = limit > 0 ? (balance / limit) * 100 : 0

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
      sx={{ width: '100%', display: 'flex', alignItems: 'space-evenly', justifyContent: 'center' }}
    >
      <Typography variant="h6" marginRight={2}>
        {`${Math.round(progressValue)}%`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progressValue}
        color="inherit"
        sx={{ height: 25, width: 150, borderRadius: '5px', color: color }}
      />
    </Box>
  )
}

// A robust formatter to safely handle the params object provided by MUI DataGrid.
const currencyFormatter = (params) => {
  // Check if params or params.value is null or undefined.

  if (params == null) {
    return ''
  }
  // Correctly format the 'value' property of the params object.
  return `$${parseFloat(params).toLocaleString()}`
}

// A robust formatter for percentages.
const percentFormatter = (params) => {
  if (params == null) {
    return ''
  }
  // Correctly format the 'value' property.
  return `${parseFloat(params).toFixed(2)}%`
}

const checkingColumns = [
  { field: 'id', headerName: 'ID', flex: 1, maxWidth: 70 },
  { field: 'name', headerName: 'Account Name', flex: 1, maxWidth: 250 },
  {
    field: 'balance',
    headerName: 'Current Balance',
    flex: 1,
    maxWidth: 250,
    type: 'number',
    valueFormatter: currencyFormatter
  },
  { field: 'institution', headerName: 'Bank', flex: 1 }
]

// Use a factory function for columns that depend on theme (colors)
const createCreditCardColumns = (colors) => [
  { field: 'id', headerName: 'ID', flex: 1, maxWidth: 70 },
  { field: 'name', headerName: 'Card Name', flex: 1 },
  {
    field: 'balance',
    headerName: 'Current Balance',
    flex: 1,
    type: 'number',
    valueFormatter: currencyFormatter
  },
  {
    field: 'credit_limit',
    headerName: 'Credit Limit',
    flex: 1,
    type: 'number',
    valueFormatter: currencyFormatter
  },
  {
    field: 'previousPayment',
    headerName: 'Last Payment',
    flex: 1,
    type: 'number',
    valueFormatter: currencyFormatter
  },
  {
    field: 'usage',
    headerName: 'Usage',
    flex: 1,
    renderCell: (params) => getUsageProgressBar(params, colors)
  }
]

const investmentColumns = [
  { field: 'id', headerName: 'ID', flex: 0.5 },
  { field: 'account', headerName: 'Account', flex: 1 },
  {
    field: 'current_balance',
    headerName: 'Cash Balance',
    type: 'number',
    flex: 1,
    valueFormatter: currencyFormatter
  },
  {
    field: 'amount_invested',
    headerName: 'Amount Invested',
    type: 'number',
    flex: 1,
    valueFormatter: currencyFormatter
  },
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
    type: 'number',
    valueFormatter: currencyFormatter
  },
  {
    field: 'interest_rate',
    headerName: 'Interest Rate',
    flex: 1,
    type: 'number',
    valueFormatter: percentFormatter
  }
]

// =================================================================================
//  MAIN COMPONENT
// =================================================================================
export default function AccountsView() {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  // --- STATE MANAGEMENT ---
  const [selectedTab, setSelectedTab] = useState(0)
  const [accountsData, setAccountsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectionModel, setSelectionModel] = useState([])

  // --- MEMOIZED VALUES ---
  // Memoize columns to prevent them from being recalculated on every render.
  const creditCardColumns = useMemo(() => createCreditCardColumns(colors), [colors])
  const currentColumns = useMemo(() => {
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
  }, [selectedTab, creditCardColumns])

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const accountType = tabToAccountType[selectedTab]
      let data
      if (accountType?.toLowerCase() === 'investment') {
        data = await window.api.getInvestmentOverview()
      } else if (accountType) {
        data = await window.api.getAccounts(accountType)
      } else {
        throw new Error('Invalid account type selected.')
      }
      setAccountsData(data || [])
    } catch (err) {
      console.error('Failed to fetch data in renderer:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedTab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- EVENT HANDLERS ---
  const handleTabChange = (event, newValue) => setSelectedTab(newValue)
  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => setIsModalOpen(false)
  const handleConfirmOpen = () => selectionModel.length > 0 && setIsConfirmOpen(true)
  const handleConfirmClose = () => setIsConfirmOpen(false)

  const handleAddAccount = async (formData) => {
    const result = await window.api.addAccount(formData)
    if (result?.success) {
      handleCloseModal()
      fetchData()
    } else {
      console.error('Failed to add account:', result?.error || 'Unknown error')
    }
  }

  const handleDelete = async () => {
    if (selectionModel.length === 0) return
    const result = await window.api.deleteAccounts(selectionModel)
    if (result?.success) {
      handleConfirmClose()
      setSelectionModel([])
      fetchData()
    } else {
      console.error('Failed to delete accounts:', result?.error || 'Unknown error')
      handleConfirmClose()
    }
  }

  const handleEdit = () => {
    if (selectionModel.length !== 1) return
    const selectedId = selectionModel[0]
    const selectedRowData = accountsData.find((row) => row.id === selectedId)
    if (selectedRowData) {
      console.log('Full data for the selected row:', selectedRowData)
      // TODO: Open an edit modal and pass `selectedRowData` as a prop.
    }
  }

  // --- DYNAMIC RENDERERS ---
  const renderAddAccountModal = () => {
    if (!isModalOpen) return null
    const accountType = tabToAccountType[selectedTab]
    const props = { open: isModalOpen, onClose: handleCloseModal, onSubmit: handleAddAccount }

    switch (accountType?.toLowerCase()) {
      case 'checking':
        return <AddCheckingForm {...props} accountType={accountType} />
      case 'savings':
        return <AddSavingsAccountForm {...props} />
      case 'credit card':
        return <AddCreditCardForm {...props} />
      case 'investment':
        return <AddInvestmentAccountForm {...props} />
      default:
        return null
    }
  }

  // --- JSX RENDER ---
  return (
    <>
      <Box
        sx={{
          padding: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          overflowY: 'hidden'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: '32px' }}>
          <Header title="ACCOUNTS" subtitle="Manage your financial accounts" />
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="account tabs"
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: colors.blueAccent[400] },
              '& .MuiTab-root.Mui-selected': { color: colors.grey[100] }
            }}
          >
            <Tab label="Checking" />
            <Tab label="Credit Cards" />
            <Tab label="Investments" />
            <Tab label="Savings" />
          </Tabs>
        </Box>

        <Fade in={true} timeout={500} key={selectedTab}>
          <Box m="40px 0 0 0" sx={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
            <Box sx={{ position: 'absolute', inset: 0 }}>
              {loading ? (
                <Box
                  width="100%"
                  height="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <CircularProgress size={75} />
                </Box>
              ) : (
                <AccountDatagrid
                  rows={accountsData}
                  columns={currentColumns}
                  onSelectionModelChange={setSelectionModel}
                  rowSelectionModel={selectionModel}
                />
              )}
            </Box>
          </Box>
        </Fade>

        <Slide in={true} direction="up">
          <Box display="flex" m="16px" justifyContent="flex-end" gap="8px">
            <Button
              variant="contained"
              sx={{ backgroundColor: colors.redAccent[500] }}
              size="large"
              onClick={handleConfirmOpen}
              disabled={selectionModel.length === 0}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: colors.blueAccent[600] }}
              size="large"
              onClick={handleEdit}
              disabled={selectionModel.length !== 1}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: colors.greenAccent[600] }}
              size="large"
              onClick={handleOpenModal}
            >
              Add
            </Button>
          </Box>
        </Slide>
      </Box>

      {renderAddAccountModal()}

      <Dialog
        open={isConfirmOpen}
        onClose={handleConfirmClose}
        PaperProps={{
          sx: {
            backgroundColor: colors.primary[400],
            borderRadius: '15px',
            color: colors.grey[100]
          }
        }}
      >
        <DialogTitle sx={{ color: colors.grey[100], fontWeight: 'bold' }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: colors.grey[100] }}>
            Are you sure you want to delete {selectionModel.length} selected account(s)? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: '20px' }}>
          <Button
            onClick={handleConfirmClose}
            variant="contained"
            sx={{ backgroundColor: colors.blueAccent[600] }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            autoFocus
            sx={{ backgroundColor: colors.redAccent[500] }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
