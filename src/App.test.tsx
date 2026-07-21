import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from './App'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('App', () => {
  it('renders the trip form on first load', () => {
    render(<App />)
    expect(screen.getByLabelText(/describe your trip/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /plan my trip/i })).toBeTruthy()
  })

  it('shows the brand and a theme toggle', () => {
    render(<App />)
    expect(screen.getByText('TripMora')).toBeTruthy()
    expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeTruthy()
  })
})
