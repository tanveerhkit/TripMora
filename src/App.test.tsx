import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('App', () => {
  it('offers both planning modes on the home screen', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /dreaming a trip/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /describe your trip/i })).toBeTruthy()
  })

  it('shows the brand and a theme toggle', () => {
    render(<App />)
    expect(screen.getByText('TripMora')).toBeTruthy()
    expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeTruthy()
  })

  it('opens the describe form when that mode is chosen', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /describe your trip/i }))
    expect(screen.getByLabelText(/describe your trip/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /plan my trip/i })).toBeTruthy()
  })

  it('opens the dreaming questionnaire when that mode is chosen', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /dreaming a trip/i }))
    expect(screen.getByRole('heading', { name: /when do you want to travel/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeTruthy()
  })
})
