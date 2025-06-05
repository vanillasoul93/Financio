import React from 'react';
import Header from '../../components/Header';
import {Box} from '@mui/material';
import Button from '@mui/material/Button';

export default function ExitView() {
  const handleExit = () => {
    window.electron.ipcRenderer.send('exit-app');
  };

  return (
    <Box m="20px">
      <Box 
        display="flex"
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Header title="SETTINGS" subtitle="Change Settings"/>
      </Box>
      <Box>
        <Button variant='contained' onClick={handleExit()}>Log Out</Button>
      </Box>
      
        
        
    </Box>
  )
}