import React from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Box, useTheme } from '@mui/material'
import { tokens } from '../../theme'

function AccountDatagrid({ rows, columns, selectionModel, onSelectionModelChange }) {
  const theme = useTheme()
  const colors = tokens(theme.palette.mode)
  return (
    <Box
      height={'100%'}
      sx={{
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
      <DataGrid
        rows={rows}
        columns={columns}
        // This handler is the function passed down from the parent (`setSelectionModel`)
        // When a row is clicked, it calls the parent's state update function.
        onRowSelectionModelChange={onSelectionModelChange}
        // This prop receives the current selection state from the parent.
        // It tells the grid which rows should have their checkboxes ticked.
        rowSelectionModel={selectionModel}
        // If you had `autoWidth`, `autoHeight`, remove them as they conflict with flexbox
        // disableColumnMenu // Optional: Disables the column menu entirely
        // disableColumnSelector // Optional: Disables the column selector
        // disableColumnResize // Optional: Prevents manual resizing of columns

        // The DataGrid itself will manage its internal horizontal scroll if needed
        // due to column content length or many columns, but it won't push the parent.
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
  )
}

export default AccountDatagrid
