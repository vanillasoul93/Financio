import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Box, useTheme, Typography, Chip, Button, Grid, Stack, Zoom } from '@mui/material'
import { BarChart, Bar, XAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { LineChart, PieChart } from '@mui/x-charts'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { debounce } from 'lodash'
import AgricultureIcon from '@mui/icons-material/AgricultureOutlined'

// Local Imports
import Header from '../../components/Header'
import CompactGoalCard from '../../components/GoalCompact'
import CustomCircleProgress from '../../components/CustomCircleProgress' // Assuming this is used for credit usage

// =====================================================================
// 1. Reusable Custom Hooks
// =====================================================================

/**
 * Custom hook to observe the dimensions of a DOM element using ResizeObserver.
 * It debounces the resize events to prevent excessive re-renders.
 * @param {number} debounceTime - The debounce time in milliseconds.
 * @returns {[React.RefObject<HTMLElement>, {width: number, height: number}]} A ref to attach to the element and its current dimensions.
 */
const useResizeObserver = (debounceTime = 100) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const ref = useRef(null)

  useEffect(() => {
    const observeTarget = ref.current
    if (!observeTarget) return

    const handleResize = debounce((entries) => {
      const entry = entries[0]
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    }, debounceTime)

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(observeTarget)

    return () => {
      handleResize.cancel() // Cancel any pending debounced calls
      resizeObserver.unobserve(observeTarget) // Stop observing
      resizeObserver.disconnect() // Additional safety measure
    }
  }, [debounceTime])

  return [ref, dimensions]
}

// =====================================================================
// 2. Helper Components (Extracted for readability)
// =====================================================================

/**
 * A generic card component for displaying dashboard statistics.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.title - The title of the card.
 * @param {React.ReactNode} props.children - The content to display inside the card.
 * @param {string} props.delay - Transition delay for Zoom animation.
 * @param {string} props.backgroundColor - Background color for the card.
 * * @param {string} [props.linkTo] - Optional. The path to navigate to when "See All {title}" is clicked.
 */
const DashboardStatCard = forwardRef(
  ({ title, children, delay, backgroundColor, linkTo, linkColor }, ref) => {
    return (
      <Zoom in={true} style={{ transitionDelay: delay }}>
        <Box
          display="flex"
          flexDirection="column"
          borderRadius="8px"
          height="100%"
          sx={{ backgroundColor }}
          overflow="hidden" // Important for charts
          ref={ref}
        >
          <Box
            width="100%"
            display="flex"
            flexDirection="row"
            justifyContent={'space-between'}
            p="16px"
          >
            <Typography variant="h5" fontWeight="300" mb="20px">
              {title}
            </Typography>
            {/* Conditional Link rendering */}
            {/* Conditional Link rendering: Only render if linkTo is provided */}
            {linkTo ? (
              <Link to={linkTo} style={{ textDecoration: 'underline', color: linkColor }}>
                <Typography variant="h5" fontWeight="300" mb="20px">
                  See All {title}
                </Typography>
              </Link>
            ) : // Render null or an empty fragment if no linkTo, so nothing appears on the right
            null}
          </Box>
          <Box flexGrow={1} display="flex" flexDirection="column" p="16px">
            {children}
          </Box>
        </Box>
      </Zoom>
    )
  }
)

// =====================================================================
// 3. Main DashboardView Component
// =====================================================================

export default function DashboardView() {
  const theme = useTheme()
  const colors = theme.colors

  // State
  const [bills, setBills] = useState([])
  const [cards, setCards] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [goals, setGoals] = useState([])
  const [cardsBalance, setCardsBalance] = useState(0)
  const [cardsLimit, setCardsLimit] = useState(0)
  const [totalBills, setTotalBills] = useState(0)
  const [totalSubscriptions, setTotalSubscriptions] = useState(0)
  const [creditUsage, setCreditUsage] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null) // Renamed `date` to `selectedDate` for clarity
  const [formattedDate, setFormattedDate] = useState('')

  // Chart Resize Hooks
  const [savingsChartRef, savingsChartSize] = useResizeObserver(150)
  const [checkingChartRef, checkingChartSize] = useResizeObserver(150)

  // Get the full month name
  const fullMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(selectedDate)

  const topGoals = goals
    .sort((a, b) => b.current_value - a.current_value) // Sort by progress (highest first)
    .slice(0, 4) // Take the first 4 goals

  // Static Data (Consider moving to a separate file if truly global)
  const checkingsData = useMemo(
    () => [3300, 3000, 2000, 2780, 1890, 2390, 3490, 3000, 2000, 2780, 1890, 2200],
    []
  )
  const savingsData = useMemo(
    () => [2200, 2300, 2800, 3400, 3900, 3900, 3900, 4500, 4800, 5600, 6000, 6578],
    []
  )
  const expenseData = useMemo(
    () => [
      { label: 'Transport', value: 250 },
      { label: 'Fast Food', value: 300 },
      { label: 'Groceries', value: 100 },
      { label: 'Entertainment', value: 120 },
      { label: 'Home', value: 154 },
      { label: 'Healthcare', value: 0 },
      { label: 'Other', value: 110 }
    ],
    []
  )
  const cashFlowChartData = useMemo(
    () => [
      { name: 'Jan', income: 5470, expense: -4000 },
      { name: 'Feb', income: 6743, expense: -5000 },
      { name: 'Mar', income: 5467, expense: -5600 },
      { name: 'Apr', income: 4800, expense: -5200 },
      { name: 'May', income: 6234, expense: -6300 },
      { name: 'Jun', income: 9654, expense: -4789 },
      { name: 'Jul', income: 4300, expense: -3490 },
      { name: 'Aug', income: 5467, expense: -3857 },
      { name: 'Sep', income: 4800, expense: -6235 },
      { name: 'Oct', income: 6234, expense: -3526 },
      { name: 'Nov', income: 9654, expense: -4876 },
      { name: 'Dec', income: 4300, expense: -5723 }
    ],
    []
  )
  const xLabels = useMemo(
    () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    []
  )

  const bluePalette = useMemo(
    () => [
      colors.blueAccent[500],
      colors.blueAccent[300],
      colors.blueAccent[600],
      colors.blueAccent[800],
      colors.blueAccent[500],
      colors.blueAccent[300],
      colors.blueAccent[600],
      colors.blueAccent[800],
      colors.blueAccent[500],
      colors.blueAccent[300],
      colors.blueAccent[600]
    ],
    [colors]
  )

  //Custom Component for ToolTip
  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          // These styles are from your desired contentStyle (now applied directly here)
          style={{
            backgroundColor: '#222', // Dark background for the tooltip content
            borderColor: '#222', // Border color matching background
            color: 'white', // Text color inside tooltip
            fontSize: '18px', // Font size for tooltip content
            padding: '10px', // Some padding
            borderRadius: '8px' // Rounded corners (from wrapperStyle but applied here too for consistency)
          }}
        >
          {/* Label style (e.g., month) - now explicitly white */}
          <Typography variant="h4" fontWeight="300" style={{ color: 'white', margin: '0 0 5px 0' }}>
            {label}
          </Typography>

          {payload.map((entry, index) => {
            const { name, value } = entry
            let itemColor = colors.greenAccent[500] // Default color for income or other items (white-ish)

            if (name === 'expense') {
              itemColor = colors.redAccent[500] // Red for expense (Tomato color)
            }

            return (
              <p key={`item-${index}`} style={{ color: itemColor, margin: '0' }}>
                {`${name} : ${value}`}
              </p>
            )
          })}
        </div>
      )
    }

    return null
  }

  // Data Grid Columns (No changes needed, but placed for organization)
  const columns = useMemo(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        flex: 1,
        minWidth: 100,
        cellClassName: 'name-column--cell'
      },
      {
        field: 'category',
        headerName: 'Category',
        flex: 1
        // Removed type: 'number' and valueFormatter as category is usually a string
      },
      {
        field: 'amount',
        headerName: 'Amount',
        type: 'number',
        flex: 1,
        valueFormatter: (value) => {
          if (value == null) return ''
          return `$ ${parseFloat(value).toFixed(2)}`
        }
      },
      {
        field: 'payment_type', // Assuming this is 'account' from context
        headerName: 'Account',
        flex: 1 // Changed type from number, as it's likely a string
        // Removed valueFormatter as payment_type is likely a string
      }
    ],
    []
  )

  // Handlers
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate)
    if (newDate) {
      const formatted = dayjs(newDate).format('MMMM, YYYY')
      setFormattedDate(formatted)
      console.log('Formatted Date:', formatted)
    } else {
      setFormattedDate('')
    }
  }, [])

  // Data Fetching and Calculations
  useEffect(() => {
    // Set initial date
    const currentDate = dayjs()
    setSelectedDate(currentDate)
    setFormattedDate(currentDate.format('MMMM, YYYY'))

    const fetchData = async () => {
      try {
        const [billsData, subscriptionsData, cardsData, goalsData] = await Promise.all([
          window.api.getBills(),
          window.api.getSubscriptions(),
          window.api.getCreditCards(),
          window.api.getGoals()
        ])

        setGoals(goalsData)
        setBills(billsData)
        setSubscriptions(subscriptionsData)

        const updatedCards = cardsData.map((card) => {
          const usage = (card.credit_balance / card.credit_limit) * 100
          return { ...card, usage }
        })
        setCards(updatedCards)

        console.log('goals retrieved: ' + JSON.stringify(goals, null, 2))

        const totalBalance = updatedCards.reduce((sum, card) => sum + card.credit_balance, 0)
        setCardsBalance(totalBalance)

        const totalLimit = updatedCards.reduce((sum, card) => sum + card.credit_limit, 0)
        setCardsLimit(totalLimit)

        const totalUsage = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0
        setCreditUsage(totalUsage)

        const calculatedTotalBills = billsData.reduce(
          (sum, bill) => sum + parseFloat(bill.amount_due),
          0
        )
        setTotalBills(calculatedTotalBills)

        const calculatedTotalSubscriptions = subscriptionsData.reduce(
          (sum, sub) => sum + parseFloat(sub.amount_due),
          0
        )
        setTotalSubscriptions(calculatedTotalSubscriptions)
      } catch (error) {
        console.error('Error fetching data:', error)
        // Implement user-friendly error handling here (e.g., show a toast message)
      }
    }

    fetchData()
  }, []) // Empty dependency array means this runs once on mount

  // Main Render
  return (
    <Box
      sx={{
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        minWidth: 0,
        minHeight: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER AND DATE PICKER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: '32px' }}>
        <Header title="DASHBOARD" subtitle="Welcome to the dashboard." />
        <Box
          backgroundColor={colors.primary[700]}
          borderRadius="8px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="16px"
          sx={{ height: '50%', width: 'auto' }} // Adjusted width to auto
        >
          <Typography variant="h2" mr={2}>
            {formattedDate}
          </Typography>
          <DatePicker
            views={['month', 'year']}
            value={selectedDate}
            sx={{
              // These styles are very specific; consider if they can be moved
              // to a global theme override if applied consistently.
              '& .MuiInputBase-root': {
                minHeight: '100px',
                minWidth: '56px',
                maxWidth: '56px',
                outline: 'none',
                border: 'none'
              },
              '& .MuiIconButton-root, & .MuiButtonBase-root': {
                padding: '6px',
                width: '36px',
                height: '36px'
              },
              '& .MuiInputBase-input': {
                fontSize: '40px',
                color: colors.greenAccent[400]
              },
              '& .MuiSvgIcon-root': {
                padding: '6px',
                width: '36px',
                height: '36px'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              }
            }}
            onChange={handleDateChange}
          />
        </Box>
      </Box>

      {/* MAIN CONTENT GRID - Scrollable area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          paddingRight: '16px',
          marginRight: '-16px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%'
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            width: '100%',
            flex: '1 1 auto',
            height: 'auto',
            paddingBottom: '16px',
            minWidth: 0,
            minHeight: 0,
            boxSizing: 'border-box'
          }}
        >
          {/* CASH FLOW BAR CHART */}
          <Grid size={{ xs: 12, s: 12, md: 8, lg: 8 }}>
            <DashboardStatCard
              title="Cash Flow ( Yearly )"
              delay="50ms"
              backgroundColor={colors.primary[700]}
            >
              <ResponsiveContainer width="100%" height={300}>
                {' '}
                {/* Explicit height for chart */}
                <BarChart
                  data={cashFlowChartData}
                  stackOffset="sign"
                  margin={{
                    top: 0,
                    right: 16,
                    left: 16,
                    bottom: 16
                  }}
                >
                  <XAxis dataKey="name" />
                  <Tooltip
                    cursor={{ fill: colors.blueAccent[700], borderRadius: '8px' }}
                    contentStyle={{
                      backgroundColor: '#222',
                      borderColor: '#222',

                      color: 'white',
                      fontSize: '16px'
                    }}
                    wrapperStyle={{
                      backgroundColor: '#222',
                      border: '4px solid #222',
                      borderRadius: '8px',
                      boxShadow: '4px 4px 8px 4px rgba(0, 0, 0, 0.5)'
                    }}
                    labelStyle={{ color: 'white' }}
                    content={<CustomTooltip />}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    fill={colors.blueAccent[500]}
                    stackId="stack"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    fill={colors.blueAccent[800]}
                    stackId="stack"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </DashboardStatCard>
          </Grid>

          {/* CASH FLOW NUMBERS */}
          <Grid size={{ xs: 12, s: 4, md: 4, lg: 4 }}>
            <DashboardStatCard
              title={`Cash Flow ( ${formattedDate} )`} // More descriptive title
              delay="100ms"
              backgroundColor={colors.primary[700]}
            >
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                flexGrow={1}
                gap="16px"
              >
                {/* Total Income Info */}
                <Box>
                  <Typography variant="h5" color={colors.grey[300]}>
                    Total Income
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h3">$6,325.34</Typography>
                    <Chip
                      label="+7.3%"
                      sx={{ fontSize: '16px', backgroundColor: colors.greenAccent[700] }}
                    />
                  </Box>
                </Box>
                {/* Total Expense Info */}
                <Box>
                  <Typography variant="h5" color={colors.grey[300]}>
                    Total Expenses
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h3">$3,153.56</Typography>
                    <Chip
                      label="-5.2%"
                      sx={{ fontSize: '16px', backgroundColor: colors.greenAccent[700] }}
                    />
                  </Box>
                </Box>
                {/* Total Net Income Info */}
                <Box>
                  <Typography variant="h5" color={colors.grey[300]}>
                    Total Net Income
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h3">$3,171.78</Typography>
                    <Chip
                      label="-3.2%"
                      sx={{ fontSize: '16px', backgroundColor: colors.redAccent[700] }}
                    />
                  </Box>
                </Box>
                {/* Add Income and Expense buttons */}
                <Box mt="16px" gap="16px" display="flex" width="100%">
                  <Button
                    variant="contained"
                    sx={{ flexGrow: 1, backgroundColor: colors.blueAccent[800] }}
                  >
                    Add Income
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ flexGrow: 1, backgroundColor: colors.blueAccent[800] }}
                  >
                    Add Expense
                  </Button>
                </Box>
              </Box>
            </DashboardStatCard>
          </Grid>
          {/* CREDIT USAGE CARD */}
          <Grid size={{ xs: 12, s: 12, md: 12, lg: 4 }}>
            <DashboardStatCard
              title="Credit Usage"
              delay="200ms"
              backgroundColor={colors.primary[700]}
              maxHeight="500px"
              linkTo="/creditcards"
              linkColor={colors.greenAccent[500]}
            >
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                py={4}
                width={'100%'}
                height={'75%'}
              >
                <CustomCircleProgress value={creditUsage} />
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap={1}
              >
                <Typography variant="h3" color={colors.grey[200]}>
                  Total Balance:{' '}
                  {cardsBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </Typography>
                <Typography variant="h3" color={colors.grey[200]}>
                  Total Limit:{' '}
                  {cardsLimit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </Typography>
                <Typography variant="h5" color={colors.grey[300]} mt={1} textAlign={'center'}>
                  Keep credit usage below 30% for optimal credit score.
                </Typography>
              </Box>
            </DashboardStatCard>
          </Grid>
          {/* SPENDINGS/EXPENSES PIE CHART AND STATS */}
          <Grid size={{ xs: 12, s: 12, md: 12, lg: 4 }}>
            {' '}
            {/* Adjusted grid size */}
            <DashboardStatCard
              title="Spendings & Expenses"
              delay="250ms"
              backgroundColor={colors.primary[700]}
            >
              <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1 }}>
                  {' '}
                  {/* Ensures PieChart takes available space */}
                  <PieChart
                    colors={bluePalette}
                    series={[
                      {
                        innerRadius: 90,
                        outerRadius: 120,
                        paddingAngle: 1,
                        cornerRadius: 5,
                        highlightScope: { fade: 'global', highlight: 'item' },
                        faded: { innerRadius: 90, additionalRadius: 5 },
                        highlighted: { innerRadius: 80, additionalRadius: 20 },
                        data: expenseData
                      }
                    ]}
                    height={300}
                    slotProps={{
                      legend: {
                        sx: { fontSize: 14, display: 'flex', justifyContent: 'center' },
                        direction: 'horizontal',
                        position: { vertical: 'bottom', horizontal: 'center' }
                      }
                    }}
                  />
                </Box>
                <Box
                  paddingTop="16px" // Added padding top for separation
                  width="100%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  flexGrow={1}
                  gap="16px"
                >
                  {/* Bills Info */}
                  <Box>
                    <Typography variant="h5" color={colors.grey[300]}>
                      Bills
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h3">
                        {totalBills.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        })}
                      </Typography>
                      <Chip
                        label="+0.0%"
                        sx={{ fontSize: '16px', backgroundColor: colors.greenAccent[700] }}
                      />
                    </Box>
                  </Box>
                  {/* Subscriptions Info */}
                  <Box>
                    <Typography variant="h5" color={colors.grey[300]}>
                      Subscriptions
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h3">
                        {totalSubscriptions.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        })}
                      </Typography>
                      <Chip
                        label="+7.3%"
                        sx={{ fontSize: '16px', backgroundColor: colors.redAccent[700] }}
                      />
                    </Box>
                  </Box>
                  {/* General Expenses Info (Hardcoded, consider making dynamic) */}
                  <Box>
                    <Typography variant="h5" color={colors.grey[300]}>
                      Expenses
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h3">
                        {'$754.25'.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        })}
                      </Typography>
                      <Chip
                        label="-12.7%"
                        sx={{ fontSize: '16px', backgroundColor: colors.greenAccent[700] }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DashboardStatCard>
          </Grid>

          {/* SAVINGS & CHECKINGS LINE GRAPHS */}
          <Grid size={{ xs: 12, s: 12, md: 12, lg: 4 }}>
            <Stack spacing={2} height="100%">
              {/* Savings Box */}
              <DashboardStatCard
                title="Savings"
                delay="300ms"
                backgroundColor={colors.primary[700]}
              >
                <Typography mb="4px" variant="h3">
                  $ 3,954.39
                </Typography>
                <Box display="flex" gap="4px" mb="16px">
                  <Typography variant="h6" color={colors.greenAccent[500]}>
                    +3.7%
                  </Typography>
                  <Typography variant="h6" color={colors.grey[300]}>
                    vs last month
                  </Typography>
                </Box>
                <Box ref={savingsChartRef} sx={{ flex: 1, width: '100%', height: '100%' }}>
                  <LineChart
                    width={savingsChartSize.width}
                    height={savingsChartSize.height || 100}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    series={[
                      {
                        id: 'savingsData',
                        data: savingsData,
                        area: true,
                        showMark: false,
                        color: colors.greenAccent[400]
                      }
                    ]}
                    xAxis={[{ scaleType: 'point', data: xLabels, position: 'none' }]}
                    yAxis={[{ position: 'none' }]}
                    sx={{
                      width: '100% !important',
                      height: '100% !important',
                      minHeight: 80,
                      '& .MuiCharts-root': {
                        width: '100% !important',
                        height: '100% !important',
                        minHeight: 'inherit !important'
                      },
                      '& .MuiLineElement-root': {
                        strokeWidth: 3
                      },
                      '& .MuiAreaElement-series-savingsData': {
                        fill: "url('#greenGradient')"
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="greenGradient" gradientTransform="rotate(90)">
                        <stop offset="5%" stopColor={colors.greenAccent[400]} stopOpacity=".1" />
                        <stop offset="95%" stopColor={colors.greenAccent[400]} stopOpacity=".0" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </Box>
              </DashboardStatCard>

              {/* Checking Box */}
              <DashboardStatCard
                title="Checking"
                delay="350ms"
                backgroundColor={colors.primary[700]}
              >
                <Typography mb="4px" variant="h3">
                  $ 3,954.39
                </Typography>
                <Box display="flex" gap="4px" mb="16px">
                  <Typography variant="h6" color={colors.redAccent[500]}>
                    -5%
                  </Typography>
                  <Typography variant="h6" color={colors.grey[300]}>
                    vs last month
                  </Typography>
                </Box>
                <Box ref={checkingChartRef} sx={{ flex: 1, width: '100%', height: '100%' }}>
                  <LineChart
                    width={checkingChartSize.width}
                    height={checkingChartSize.height || 100}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    series={[
                      {
                        id: 'checkingData',
                        data: checkingsData,
                        area: true,
                        showMark: false,
                        color: colors.redAccent[400]
                      }
                    ]}
                    xAxis={[{ scaleType: 'point', data: xLabels, position: 'none' }]}
                    yAxis={[{ position: 'none' }]}
                    sx={{
                      width: '100% !important',
                      height: '100% !important',
                      minHeight: 80,
                      '& .MuiCharts-root': {
                        width: '100% !important',
                        height: '100% !important',
                        minHeight: 'inherit !important'
                      },
                      '& .MuiLineElement-root': {
                        strokeWidth: 3
                      },
                      '& .MuiAreaElement-series-checkingData': {
                        fill: "url('#redGradient')"
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="redGradient" gradientTransform="rotate(90)">
                        <stop offset="5%" stopColor={colors.redAccent[400]} stopOpacity=".1" />
                        <stop offset="95%" stopColor={colors.redAccent[400]} stopOpacity=".0" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </Box>
              </DashboardStatCard>
            </Stack>
          </Grid>

          {/* RECENT TRANSACTIONS TABLE (Needs actual data/rows) */}
          <Grid size={{ xs: 12, s: 12, md: 12, lg: 6 }}>
            <Zoom in={true} style={{ transitionDelay: '400ms' }}>
              <Box
                backgroundColor={colors.primary[700]}
                height="100%"
                borderRadius="8px"
                display="flex"
                flexDirection="column"
                overflow="hidden"
              >
                <Box p="16px">
                  <Typography variant="h4" fontWeight="300">
                    Recent Transactions
                  </Typography>
                </Box>
                <Box
                  flexGrow={1}
                  sx={{
                    '& .MuiDataGrid-root': {
                      border: 'none'
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: 'none'
                    },
                    '& .name-column--cell': {
                      color: colors.greenAccent[300]
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: colors.blueAccent[700],
                      borderBottom: 'none'
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      backgroundColor: colors.primary[700]
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: 'none',
                      backgroundColor: colors.blueAccent[700]
                    },
                    '& .MuiCheckbox-root': {
                      color: `${colors.greenAccent[200]} !important`
                    }
                  }}
                >
                  {/* DataGrid requires `rows` prop, which is missing from your state.
                      It will likely throw an error or warning without it.
                      Assuming you'll fetch and set `transactions` state for this.
                  */}
                  {/* <DataGrid
                    rows={[]} // Placeholder - replace with actual transactions state
                    columns={columns}
                    pageSizeOptions={[5, 10, 20]} // Added options for pagination
                    disableRowSelectionOnClick
                    // Add other DataGrid props as needed
                  /> */}
                  <Typography variant="h5" sx={{ p: 2 }}>
                    No recent transactions to display.
                  </Typography>
                </Box>
              </Box>
            </Zoom>
          </Grid>

          {/* GOALS / AgricultureIcon (Placeholder or actual component?) */}
          <Grid size={{ xs: 12, s: 12, md: 12, lg: 6 }}>
            <Zoom in={true} style={{ transitionDelay: '450ms' }}>
              <DashboardStatCard
                title="Goals"
                delay="350ms"
                backgroundColor={colors.primary[700]}
                linkTo="/goals"
                linkColor={colors.greenAccent[500]}
              >
                <Box
                  backgroundColor={colors.primary[700]}
                  height="100%"
                  borderRadius="8px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Grid container spacing={2} flexGrow={1}>
                    {goals.length > 0 ? (
                      topGoals.map((goal) => (
                        <Grid size={{ sm: 6, lg: 6, xs: 6 }} key={goal.id}>
                          <CompactGoalCard goal={goal} />
                        </Grid>
                      ))
                    ) : (
                      // Fallback for no goals
                      <Box>
                        <AgricultureIcon
                          sx={{ fontSize: '150px', color: colors.greenAccent[500] }}
                        />
                        <Typography variant="h3" mt={2} color={colors.grey[200]}>
                          Goals Section Placeholder
                        </Typography>
                        <Typography variant="body1" mt={1} color={colors.grey[400]}>
                          Add your financial goals here!
                        </Typography>
                        <Button
                          variant="contained"
                          sx={{ mt: 3, backgroundColor: colors.blueAccent[800] }}
                        >
                          Set a New Goal
                        </Button>
                      </Box>
                    )}
                  </Grid>
                </Box>
              </DashboardStatCard>
            </Zoom>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
