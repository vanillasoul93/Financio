import * as React from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import { TbLayoutDashboard } from 'react-icons/tb'
import GoalsOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined'
import PayOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import BillsOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import SubscriptionOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange'
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined'
import dashyboardico from '../../images/logo.png'

import 'react-pro-sidebar/dist/css/styles.css'
import { useState, useEffect } from 'react'
import { ProSidebar, Menu, MenuItem } from 'react-pro-sidebar'
import { Box, IconButton, Typography, useTheme } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import ThemeSwitcher from '../../components/ThemeSwitcher'
import { useContext } from 'react'
import { ColorModeContext } from '../../theme'

export default function NavBar() {
  const [value, setValue] = React.useState(0)
  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const theme = useTheme()
  const colors = theme.colors
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const [selected, setSelected] = useState('Dashboard')

  // Use useEffect to update 'selected' when the location changes
  useEffect(() => {
    // A simple mapping from path to title
    const pathMap = {
      '/': 'Dashboard',
      '/payBills': 'PayBills',
      '/goals': 'Goals',
      '/expenses': 'Expenses',
      '/accounts': 'Accounts',
      '/bills': 'Bills',
      '/subscriptions': 'Subscriptions',
      '/creditcards': 'CreditCards',
      '/history': 'History',
      '/settings': 'Settings',
      '/exit': 'Exit'
    }
    // Get the title from the current pathname, default to 'Dashboard' if not found
    const currentTitle = pathMap[location.pathname] || 'Dashboard'
    setSelected(currentTitle)
  }, [location.pathname]) // Re-run this effect whenever the pathname changes

  const Item = ({ title, to, icon, selected, setSelected }) => {
    const theme = useTheme()
    const colors = theme.colors
    return (
      <MenuItem active={selected === title} style={{ color: colors.grey[100] }} icon={icon}>
        <Typography variant="h4">{title}</Typography>
        <Link to={to} />
      </MenuItem>
    )
  }

  const { toggleColorMode } = useContext(ColorModeContext)

  return (
    <Box
      sx={{
        '& .pro-sidebar-inner': {
          background: `${colors.primary[400]} !important`
        },
        '& .pro-icon-wrapper': {
          backgroundColor: 'transparent !important'
        },
        '& .pro-inner-item': {
          padding: '5px 35px 5px 20px !important`'
        },
        '& .pro-inner-item-hover': {
          color: '#868dfb !important'
        },
        '& .pro-menu-item.active': {
          color: '#6870fa !important'
        }
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: '0 0 20px 0,',
              color: colors.grey[100]
            }}
          >
            {!isCollapsed && (
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  ml={'8px'}
                  flexDirection={'column'}
                >
                  <img alt="profile-user" width="200px" height="125px" src={dashyboardico} />
                  <Box textAlign="center">
                    <Typography variant="h5" color={colors.greenAccent[500]} mt={'10px'}>
                      Pay Track Save
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </MenuItem>
          {!isCollapsed && <Box mb="25px" mt="25px"></Box>}
          {/* MENU ITEMS */}
          <Box>
            <Item
              title="Dashboard"
              to="/"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Typography variant="h6" color={colors.grey[300]} sx={{ m: '15px 0 5px 20px' }}>
              Actions
            </Typography>
            <Item
              title="PayBills"
              to="/payBills"
              icon={<PayOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Goals"
              to="/goals"
              icon={<GoalsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Expenses"
              to="/expenses"
              icon={<CurrencyExchangeIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Typography variant="h6" color={colors.grey[300]} sx={{ m: '15px 0 5px 20px' }}>
              Data
            </Typography>
            <Item
              title="Accounts"
              to="/accounts"
              icon={<AccountBoxOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Bills"
              to="/bills"
              icon={<BillsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Subscriptions"
              to="/subscriptions"
              icon={<SubscriptionOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="CreditCards"
              to="/creditcards"
              icon={<CreditCardOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Typography variant="h6" color={colors.grey[300]} sx={{ m: '15px 0 5px 20px' }}>
              Other
            </Typography>
            <Item
              title="History"
              to="/history"
              icon={<HistoryOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Settings"
              to="/settings"
              icon={<SettingsOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Exit"
              to="/exit"
              icon={<ExitToAppOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Box display="flex" justifyContent="space-between">
              {/* ... other navbar content ... */}
              <Box display="flex">
                <IconButton onClick={toggleColorMode}>
                  {/* ... dark/light mode icon ... */}
                </IconButton>
                <ThemeSwitcher /> {/* <-- Add the component here */}
              </Box>
            </Box>
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  )
}
