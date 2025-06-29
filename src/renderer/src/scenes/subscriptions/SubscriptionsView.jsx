import React from 'react'
import Header from '../../components/Header'
import {
  Box,
  useTheme,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  Fade,
  Zoom,
  Slide
} from '@mui/material'

import { DataGrid } from '@mui/x-data-grid'
import { useState, useEffect } from 'react'
import AddSubscriptionModal from './AddSubscriptionModal'
import EditSubscriptionModal from './EditSubscriptionModal'

export default function SubscriptionsView() {
  //import theme
  const theme = useTheme()
  const colors = theme.colors
  //state hooks
  const [subscriptions, setSubscriptions] = useState([])
  const [selection, setSelection] = useState([])

  //Dialog open hook for delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false)
  //handler for opening confirm delete dialog
  const handleConfirmOpen = () => {
    console.log(selection.id)
    if (selection.id !== undefined) {
      setConfirmOpen(true)
    } else {
      console.log('NO SELECTION MADE')
    }
  }
  //handler for closing confirm delete dialog
  const handleConfirmClose = () => {
    setConfirmOpen(false)
  }
  //handler for confirming to delte the selected subscription
  const handleConfirmDelete = async () => {
    console.log('DELETING SUBSCRIPTION: ' + selection.name)
    const response = await window.api.deleteBillOrSubscription(selection.id)
    if (response.success) {
      console.log(
        `Subscription with ID ${selection.id} and name: ${selection.name} deleted successfully.`
      )
      //Update state after succesfully deleting subscription to re-render datagrid
      setSubscriptions((prevSubscriptions) =>
        prevSubscriptions.filter((subscription) => subscription.id !== selection.id)
      )
      //Display a success snackbar here
    } else {
      console.error('Failed to delete Subscription:', response.error)
      // Optionally, display an error message to the user
    }
    setConfirmOpen(false)
  }
  //DataGrid Row select handler
  const onRowSelect = (event) => {
    console.log('on row click', event.row)
    setSelection(event.row)
  }
  //Onclick button {website}
  const openWebsite = () => {
    if (selection.id !== undefined) {
      window.api.openWebsite(selection.website)
    } else {
      console.log('no selection made')
    }
  }

  //DataGrid Column Definitions
  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      cellClassName: 'name-column--cell'
    },
    {
      field: 'automatic',
      headerName: 'Auto-Pay',
      type: 'boolean',
      flex: 1
    },
    {
      field: 'date_due',
      headerName: 'Renewal',
      type: 'date',
      valueGetter: (value) => value && new Date(value),
      flex: 1
    },
    {
      field: 'amount_due',
      headerName: 'Amount',
      flex: 1,
      valueFormatter: (value) => {
        if (value == null) {
          return ''
        }
        return `$${parseFloat(value).toFixed(2)}`
      }
    },
    {
      field: 'frequency_in_months',
      headerName: 'Frequency',
      flex: 1,
      valueFormatter: (value) => {
        if (value == null) {
          return ''
        } else {
          let format
          if (value === 1) format = 'Monthly'
          else if (value === 12) format = 'Yearly'
          else if (value > 1 && value < 12) format = 'Every ' + value + ' Months'
          else format = 'Unknown'

          return `${format}`
        }
      }
    }
  ]

  //On initial load, fetch subscriptions from DB
  useEffect(() => {
    const fetchSubscriptions = async () => {
      const data = await window.api.getSubscriptions()
      setSubscriptions(data)
    }
    fetchSubscriptions()
  }, [])

  //Call to pull all subscriptions from DB
  const updateSubscriptionList = async () => {
    try {
      const subscriptionsFromDB = await window.api.getSubscriptions()
      console.log('Data received from ipcMain:', subscriptionsFromDB)
      setSubscriptions(subscriptionsFromDB)
    } catch (error) {
      console.error('Error fetching subscriptions :', error)
    }
  }

  //state hook for add subscription modal to set the state to open or closed
  const [isAddSubscriptionModal, setIsAddSubscriptionModal] = useState(false)
  //handler sent up from add subscription modal when opened
  const handleOpenAddSubscriptionModal = () => {
    setIsAddSubscriptionModal(true)
  }
  //handler sent up from add subscription modal when closed
  const handleCloseAddSubscriptionModal = () => {
    setIsAddSubscriptionModal(false)
  }
  //handler sent up from add subscription modal when submitted
  const handleAddSubscriptionModalSubmit = async (formData) => {
    console.log('Add Subscription Modal Submitted:', formData)

    const response = await window.api.addBillOrSubscription(formData)
    //if the data returns succesfully, fetch Bills again
    if (response.success) {
      updateSubscriptionList()

      // Optionally, update your React component's state to re-render the table
    } else {
      console.error('Failed to add subscription:', response.error)
      // Optionally, display an error message to the user
    }
    //window.api.addBill();
    // In your Electron app, send this data via IPC
    // window.require('electron').ipcRenderer.send('submit-payment', formData);
    handleCloseAddSubscriptionModal() // Close the modal after submission
  }

  //Handlers for Editing Subscriptions
  const [isEditSubscriptionModalOpen, setIsEditSubscriptionModalOpen] = useState(false)
  const [editModalData, setEditModalData] = useState(null)

  const handleEditSubscriptionModal = (selection) => {
    if (selection.id !== undefined) {
      setEditModalData(selection)
      setIsEditSubscriptionModalOpen(true)
    } else {
      console.log('no selection made')
    }
  }

  const handleCloseEditSubscriptionModal = () => {
    setIsEditSubscriptionModalOpen(false)
  }

  const handleEditSubscriptionSubmit = async (updatedData) => {
    console.log('Subscription from edit modal:', updatedData)
    // Implement your logic to update the 'rows' state or send data to your backend
    const response = await window.api.updateBillOrSubscription(updatedData)
    if (response.success) {
      console.log(`Subscription with ID ${updatedData.id} updated successfully.`)
      setSubscriptions((prevRows) =>
        prevRows.map((row) => (row.id === updatedData.id ? updatedData : row))
      )
      // Optionally, update your React component's state to re-render the table
    } else {
      console.error('Failed to update subscription:', response.error)
      // Optionally, display an error message to the user
    }

    handleCloseEditSubscriptionModal() // Close the modal after submission
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
        <Header title="SUBSCRIPTIONS" subtitle="Trickle Cash Suckers." />
      </Box>
      <Fade in={true} timeout={500}>
        <Box
          m="40px 0 0 0 "
          sx={{
            flex: 1,
            position: 'relative',
            overflowY: 'auto', // Enable vertical scrolling for this specific Box

            '& .MuiDataGrid-root': {
              border: 'none',
              fontSize: '15px',
              height: '100% !important', // Make DataGrid fill the height of this Box
              width: '100% !important' // Crucial: Make DataGrid fill the width of this Box
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none'
            },
            '& .name-column--cell': {
              color: colors.brand[500]
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: colors.primary[500] + '!important'
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: colors.primary[600]
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              backgroundColor: colors.primary[500]
            },
            '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
              outline: 'none !important'
            },
            '& .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-scrollbarFiller--header': {
              backgroundColor: colors.primary[700] + '!important'
            },
            '& .Mui-selected': {
              backgroundColor: colors.primary[500] + '!important'
            }
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <DataGrid
              rows={subscriptions}
              columns={columns}
              style={{ fontSize: '18px' }}
              onRowClick={onRowSelect}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 20
                  }
                }
              }}
              pageSizeOptions={[10, 20, 50]}
            />
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
              size="large"
              onClick={openWebsite}
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
            >
              Delete
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: colors.blueAccent[600], width: '125px' }}
              size="large"
              onClick={() => handleEditSubscriptionModal(selection)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: colors.greenAccent[600], width: '125px' }}
              size="large"
              onClick={handleOpenAddSubscriptionModal}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Slide>

      <AddSubscriptionModal
        open={isAddSubscriptionModal}
        onClose={handleCloseAddSubscriptionModal}
        onSubmit={handleAddSubscriptionModalSubmit}
      />

      {selection && (
        <EditSubscriptionModal
          open={isEditSubscriptionModalOpen}
          onClose={handleCloseEditSubscriptionModal}
          onSubmit={handleEditSubscriptionSubmit}
          data={selection}
        />
      )}
      {selection && (
        <Dialog
          open={confirmOpen}
          onClose={handleConfirmClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title" sx={{ mt: '8px', mb: '8px' }}>
            {'Confirm Delete'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description-prefix" sx={{ mb: '4px' }}>
              {' '}
              {/* Changed id to avoid duplicate */}
              Are you sure you want to delete
            </DialogContentText>
            {/* MODIFIED PART: Use component="div" or another appropriate tag for DialogContentText */}
            <DialogContentText
              component="div"
              id="alert-dialog-description-name"
              sx={{ mb: '4px' }}
            >
              {' '}
              {/* Changed id */}
              <Box display={'flex'}>
                <Typography color={colors.greenAccent[400]} variant="h4">
                  {selection.name}
                </Typography>
                <Typography marginLeft={'4px'} variant="h4">
                  ?
                </Typography>
              </Box>
            </DialogContentText>
            <DialogContentText id="alert-dialog-description-suffix">
              {' '}
              {/* Changed id */}
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              style={{
                backgroundColor: colors.blueAccent[400],
                width: '100%',
                borderRadius: '4px'
              }}
              onClick={handleConfirmClose}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: colors.redAccent[600], width: '100%', borderRadius: '4px' }}
              onClick={handleConfirmDelete}
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
