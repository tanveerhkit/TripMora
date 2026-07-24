import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DreamForm } from '../DreamForm'

afterEach(() => {
  cleanup()
})

describe('DestinationQuestionnaire', () => {
  it('blocks moving forward on required steps until the user answers', () => {
    render(<DreamForm onSubmit={vi.fn()} onBack={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    expect(screen.getByText(/please select one option to continue/i)).toBeTruthy()
    expect(screen.getByRole('heading', { name: /when do you want to travel/i })).toBeTruthy()
  })

  it('keeps answers when navigating back and forth', () => {
    render(<DreamForm onSubmit={vi.fn()} onBack={vi.fn()} />)

    fireEvent.click(screen.getByRole('radio', { name: /flexible/i }))
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    expect(screen.getByRole('heading', { name: /what budget feels right/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /previous/i }))

    expect(screen.getByRole('heading', { name: /when do you want to travel/i })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /flexible/i }).getAttribute('aria-checked')).toBe('true')
  })
})
