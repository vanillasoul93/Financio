// src/data/dbSimulations.js

// This file simulates asynchronous data fetching from a database
// Replace these with your actual Knex queries

const mockCheckingAccounts = [
  { id: 1, name: 'Main Checking', balance: 5234.56, bank: 'Bank of America' },
  { id: 2, name: 'Joint Checking', balance: 1234.0, bank: 'Chase' },
  { id: 3, name: 'Savings Link', balance: 876.12, bank: 'Wells Fargo' }
]

const mockCreditCardAccounts = [
  { id: 1, name: 'Visa Platinum', balance: 750.25, limit: 5000, previousPayment: 100.0 },
  { id: 2, name: 'Mastercard Gold', balance: 2100.0, limit: 3000, previousPayment: 50.0 },
  { id: 3, name: 'Amex Rewards', balance: 4500.75, limit: 10000, previousPayment: 200.0 },
  { id: 4, name: 'Discover It', balance: 0, limit: 2000, previousPayment: 0 }
]

const mockInvestmentAccounts = [
  { id: 1, name: 'Roth IRA', type: 'Retirement', value: 25000.0, returnRate: 7.5 },
  { id: 2, name: 'Brokerage Account', type: 'Stocks', value: 15000.5, returnRate: 9.2 },
  { id: 3, name: 'Mutual Fund A', type: 'Mutual Fund', value: 8000.2, returnRate: 6.8 }
]

const mockSavingsAccounts = [
  { id: 1, name: 'Emergency Fund', balance: 10000.0, interestRate: 0.5 },
  { id: 2, name: 'Vacation Savings', balance: 2500.0, interestRate: 0.3 },
  { id: 3, name: 'Education Fund', balance: 7500.0, interestRate: 0.6 }
]

// Simulate a database fetch with a delay
const simulateFetch = (data, delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data)
    }, delay)
  })
}

export const fetchCheckingAccounts = async () => {
  console.log('Fetching checking accounts...')
  return simulateFetch(mockCheckingAccounts)
}

export const fetchCreditCardAccounts = async () => {
  console.log('Fetching credit card accounts...')
  return simulateFetch(mockCreditCardAccounts)
}

export const fetchInvestmentAccounts = async () => {
  console.log('Fetching investment accounts...')
  return simulateFetch(mockInvestmentAccounts)
}

export const fetchSavingsAccounts = async () => {
  console.log('Fetching savings accounts...')
  return simulateFetch(mockSavingsAccounts)
}
