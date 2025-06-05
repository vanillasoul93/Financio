import React from 'react';
import Header from '../../components/Header';
import {Box} from '@mui/material';
import Button from '@mui/material/Button';

export default function SettingsView() {
  const handleDbCall = () => {
    window.electron.ipcRenderer.send('db-call');
  };

  return (
    <Box sx={{
      padding: 3,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh', // Crucial: Takes full viewport height
      maxHeight: '100vh', // Explicitly limit max height too
      overflow: 'hidden' // Prevent outer box itself from scrolling
    }}>
      <Box 
        display="flex"
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Header title="SETTINGS" subtitle="Change Settings"/>
      </Box>
      <Box>
        <Button variant='contained' onClick={() => handleDbCall()}>Call DB</Button>
      </Box>
      
        
        
    </Box>
  )
}