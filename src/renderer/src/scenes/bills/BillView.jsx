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
  Slide
} from '@mui/material'
import { tokens } from '../../theme'
import { DataGrid } from '@mui/x-data-grid'
import { useState, useEffect } from 'react'
import AddBillModal from './AddBillModal'
import EditBillModal from './EditBillModal'

export default function BillView() {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  const [bills, setBills] = useState([])
  const [selection, setSelection] = useState([])

  //handle open dialog confirm for deleting a bill
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirmOpen = () => {
    console.log(selection.id)
    if (selection.id !== undefined) {
      setConfirmOpen(true)
    } else {
      console.log('NO SELECTION MADE')
    }
  }

  const handleConfirmClose = () => {
    setConfirmOpen(false)
  }

  const handleConfirmDelete = async () => {
    console.log('DELETING BILL: ' + selection.name)
    const response = await window.api.deleteBillOrSubscription(selection.id)

    if (response.success) {
      console.log(`Bill with ID ${selection.id} and name: ${selection.name} deleted successfully.`)
      //Update state after succesfully deleting subscription to re-render datagrid
      setBills((prevBills) => prevBills.filter((bill) => bill.id !== selection.id))
    } else {
      console.error('Failed to delete goal:', response.error)
      // Optionally, display an error message to the user
    }
    setConfirmOpen(false)
  }
  //On initial load, fetch bills from DB
  useEffect(() => {
    const fetchBills = async () => {
      const data = await window.api.getBills()
      setBills(data)
    }
    fetchBills()
  }, [])
  //Call to pull all bills from DB
  const updateBillList = async () => {
    try {
      const billsFromDB = await window.api.getBills()
      console.log('Data received from ipcMain:', billsFromDB)
      setBills(billsFromDB)
    } catch (error) {
      console.error('Error fetching bills:', error)
    }
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
      minWidth: 270,
      cellClassName: 'name-column--cell'
    },
    {
      field: 'automatic',
      headerName: 'Auto-Pay',
      type: 'boolean',
      maxWidth: 100,
      flex: 1
    },
    {
      field: 'amount_due',
      headerName: 'Amount',
      type: 'number',
      flex: 1,
      valueFormatter: (value) => {
        if (value == null) {
          return ''
        }
        return `$ ${parseFloat(value).toFixed(2)}`
      }
    },
    {
      field: 'previous_payment',
      headerName: 'Previous',
      type: 'number',
      flex: 1,
      valueFormatter: (value) => {
        if (value == null) {
          return ''
        }
        return `$ ${parseFloat(value).toFixed(2)}`
      }
    },
    {
      field: 'highest_payment',
      headerName: 'Highest',
      type: 'number',
      flex: 1,
      valueFormatter: (value) => {
        if (value == null) {
          return ''
        }
        return `$ ${parseFloat(value).toFixed(2)}`
      }
    }
  ]

  //state hook for add bill modal to set the state to open or closed
  const [isAddBillModalOpen, setIsAddBillModelOpen] = useState(false)
  //handler sent up from add bill modal when opened
  const handleAddBillModal = () => {
    setIsAddBillModelOpen(true)
  }
  //handler sent up from add bill modal when closed
  const handleCloseAddBillModal = () => {
    setIsAddBillModelOpen(false)
  }
  //handler sent up from add bill modal when submitted
  const handleAddBillSubmit = async (formData) => {
    formData.type = 'Bill'
    console.log('FORM DATA IN RENDERER WHEN handleAddBillSubmit: ' + formData)
    setBills((prevBills) => [...prevBills, { ...formData, id: Date.now() }]) // Assign a temporary ID
    //Call IPCMain and send the data to the DB
    const response = await window.api.addBillOrSubscription(formData)
    //if the data returns succesfully, fetch Bills again
    if (response.success) {
      updateBillList()
      console.log('THE DB ID OF THE NEWLY ADDED BILL IS: ' + response.billId)

      // Optionally, update your React component's state to re-render the table
    } else {
      console.error('Failed to add bill:', response.error)
      // Optionally, display an error message to the user
    }
    handleCloseAddBillModal()

    //console.log('Bill added from modal:', formData);
  }

  //Handlers for Editing Bills
  const [isEditBillModalOpen, setIsEditBillModelOpen] = useState(false)
  const [editModalData, setEditModalData] = useState(null)

  const handleEditBillModal = (selection) => {
    if (selection.id !== undefined) {
      setEditModalData(selection)
      setIsEditBillModelOpen(true)
    } else {
      console.log('No selection made!')
    }
  }

  const handleCloseEditBillModal = () => {
    setIsEditBillModelOpen(false)
  }

  const handleEditBillSubmit = async (updatedData) => {
    console.log('Bill from edit modal:', updatedData)
    // Implement your logic to update the 'rows' state or send data to your backend
    const response = await window.api.updateBillOrSubscription(updatedData)
    if (response.success) {
      console.log(`Bill with ID ${updatedData.id} updated successfully.`)
      setBills((prevRows) => prevRows.map((row) => (row.id === updatedData.id ? updatedData : row)))
      // Optionally, update your React component's state to re-render the table
    } else {
      console.error('Failed to update bill:', response.error)
      // Optionally, display an error message to the user
    }
    // Example: Update the 'rows' state
    handleCloseEditBillModal() // Close the modal after submission
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
        <Header title="BILLS" subtitle="Why so many?" />
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
              fontSize: '15px'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none'
            },
            '& .name-column--cell': {
              color: colors.greenAccent[300]
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: colors.blueAccent[700] + '!important'
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: colors.primary[400]
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: 'none',
              backgroundColor: colors.blueAccent[700]
            },
            '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
              outline: 'none !important'
            },
            '& .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-scrollbarFiller--header': {
              backgroundColor: colors.blueAccent[700] + '!important'
            },
            '& .Mui-selected': {
              backgroundColor: colors.blueAccent[800] + '!important'
            }
          }}
        >
          <Box sx={{ position: 'absolute', inset: 0 }}>
            {console.log(bills)}
            <DataGrid
              rows={bills}
              columns={columns}
              style={{ fontSize: '18px' }}
              onRowClick={onRowSelect}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10
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
            >
              Delete
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: colors.blueAccent[600], width: '125px' }}
              size="large"
              onClick={() => handleEditBillModal(selection)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: colors.greenAccent[600], width: '125px' }}
              size="large"
              onClick={handleAddBillModal}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Slide>

      <AddBillModal
        open={isAddBillModalOpen}
        onClose={handleCloseAddBillModal}
        onSubmit={handleAddBillSubmit}
      />
      {selection && (
        <EditBillModal
          open={isEditBillModalOpen}
          onClose={handleCloseEditBillModal}
          onSubmit={handleEditBillSubmit}
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
          <DialogTitle variant="h4" id="alert-dialog-title" sx={{ mt: '8px', mb: '8px' }}>
            {'Confirm Delete'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="h5" id="alert-dialog-description" sx={{ mb: '4px' }}>
              Are you sure you want to delete
            </DialogContentText>
            <DialogContentText id="alert-dialog-description" sx={{ mb: '4px' }}>
              <Box display={'flex'}>
                <Typography color={colors.greenAccent[400]} variant="h4">
                  {selection.name}
                </Typography>
                <Typography marginLeft={'4px'} variant="h4">
                  ?
                </Typography>
              </Box>
            </DialogContentText>
            <DialogContentText variant="h5" id="alert-dialog-description">
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
