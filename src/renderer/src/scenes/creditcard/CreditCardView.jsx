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
  LinearProgress,
  Fade,
  Slide
} from '@mui/material'
import { tokens } from '../../theme'
import { DataGrid } from '@mui/x-data-grid'
import { useState, useEffect } from 'react'
import AddCreditCardModal from './AddCreditCardModal'
import EditCreditCardModal from './EditCreditCardModal'

export default function CreditCardView() {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)

  const [cards, setCards] = useState([])
  const [selection, setSelection] = useState([])

  //On initial load, fetch bills from DB
  useEffect(() => {
    const fetchCards = async () => {
      const data = await window.api.getCreditCards()
      data.forEach((card) => {
        let usage = (card.credit_balance / card.credit_limit) * 100
        console.log(usage)
        card.usage = usage
      })

      setCards(data)
    }
    fetchCards()
  }, [])
  //Call to pull all creditcards from DB
  const updateCardList = async () => {
    try {
      const cardsFromDB = await window.api.getCreditCards()
      console.log('Data received from ipcMain:', cardsFromDB)
      cardsFromDB.forEach((card) => {
        let usage = (card.credit_balance / card.credit_limit) * 100
        console.log(usage)
        card.usage = usage
      })
      setCards(cardsFromDB)
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
    console.log('DELETING CreditCard: ' + selection.name)
    const response = await window.api.deleteCreditCard(selection.id)
    if (response.success) {
      console.log(
        `CreditCard with ID ${selection.id} and name: ${selection.name} deleted successfully.`
      )
      //Update state after succesfully deleting subscription to re-render datagrid
      setCards((prevCards) => prevCards.filter((card) => card.id !== selection.id))
      //Display a success snackbar here
    } else {
      console.error('Failed to delete credit card:', response.error)
      // Optionally, display an error message to the user
    }
    setConfirmOpen(false)
  }

  //state hook for add bill modal to set the state to open or closed
  const [isAddCreditCardModalOpen, setIsAddCreditCardModalOpen] = useState(false)
  //handler sent up from add bill modal when opened
  const handleAddCreditCardModal = () => {
    setIsAddCreditCardModalOpen(true)
  }
  //handler sent up from add bill modal when closed
  const handleCloseCreditCardModal = () => {
    setIsAddCreditCardModalOpen(false)
  }
  //handler sent up from add bill modal when submitted
  const handleAddCreditCardSubmit = async (formData) => {
    console.log('FORM DATA IN RENDERER WHEN handleAddCreditCardSubmit: ' + formData)
    formData.usage = (formData.credit_balance / formData.credit_limit) * 100
    setCards((prevCards) => [...prevCards, { ...formData, id: Date.now() }]) // Assign a temporary ID
    //Call IPCMain and send the data to the DB
    const response = await window.api.addCreditCard(formData)
    //if the data returns succesfully, fetch Bills again
    if (response.success) {
      updateCardList()
      console.log('THE ID IN THE DB OF THE ADDED CARD IS: ' + response.cardId)

      // Optionally, update your React component's state to re-render the table
    } else {
      console.error('Failed to add bill:', response.error)
      // Optionally, display an error message to the user
    }
    handleCloseCreditCardModal()

    //console.log('Bill added from modal:', formData);
  }

  //Handlers for Editing Bills
  const [isEditCreditCardModalOpen, setIsEditCreditCardModalOpen] = useState(false)
  const [editModalData, setEditModalData] = useState(null)

  const handleEditCreditCardModal = (selection) => {
    if (selection.id !== undefined) {
      setEditModalData(selection)
      setIsEditCreditCardModalOpen(true)
    } else {
      console.log('No selection made!')
    }
  }

  const handleCloseEditCreditCardModal = () => {
    setIsEditCreditCardModalOpen(false)
  }

  const handleEditCreditCardSubmit = async (updatedData) => {
    console.log('credit card from edit modal:', updatedData)
    updatedData.usage = (updatedData.credit_balance / updatedData.credit_limit) * 100
    // Implement your logic to update the 'rows' state or send data to your backend
    const response = await window.api.updateCreditCard(updatedData)
    if (response.success) {
      console.log(`Credit Card with ID ${updatedData.id} updated successfully.`)
      setCards((prevRows) => prevRows.map((row) => (row.id === updatedData.id ? updatedData : row)))
      // Optionally, update your React component's state to re-render the table
    } else {
      console.error('Failed to update credit card:', response.error)
      // Optionally, display an error message to the user
    }
    // Example: Update the 'rows' state
    handleCloseEditCreditCardModal() // Close the modal after submission
  }

  //DataGrid Column Definitions
  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 250,
      cellClassName: 'name-column--cell'
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
      field: 'credit_balance',
      headerName: 'Balance',
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
      field: 'credit_limit',
      headerName: 'Limit',
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
      field: 'usage',
      headerName: 'Usage',
      type: 'number',
      flex: 1,
      width: 125,
      maxWidth: 125,
      renderCell: (value) => {
        const progressValue = value.row.usage
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
            <LinearProgress
              variant="determinate"
              value={value.row.usage}
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
            {console.log(cards)}
            <DataGrid
              rows={cards}
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
              onClick={() => handleEditCreditCardModal(selection)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: colors.greenAccent[600], width: '125px' }}
              size="large"
              onClick={handleAddCreditCardModal}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Slide>

      <AddCreditCardModal
        open={isAddCreditCardModalOpen}
        onClose={handleCloseCreditCardModal}
        onSubmit={handleAddCreditCardSubmit}
      />

      {selection && (
        <EditCreditCardModal
          open={isEditCreditCardModalOpen}
          onClose={handleCloseEditCreditCardModal}
          onSubmit={handleEditCreditCardSubmit}
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
          <DialogTitle variant="h4" id="alert-dialog-title">
            {'Confirm Delete'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="h5" id="alert-dialog-description">
              Are you sure you want to delete
            </DialogContentText>
            <DialogContentText id="alert-dialog-description">
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
