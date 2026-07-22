import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { useLocationImage } from './useLocationImage'

afterEach(cleanup)

function Probe({ q }: { q: string }) {
  const { status, url } = useLocationImage(q)
  return <div data-testid="out">{`${status}:${url ?? 'none'}`}</div>
}

describe('useLocationImage under StrictMode', () => {
  it('still resolves an image after the double mount/cleanup', async () => {
    // A real Wikipedia-shaped response with a thumbnail.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          query: { pages: { '42': { title: 'Uniquetown', thumbnail: { source: 'https://img/x.jpg' } } } },
        }),
      })),
    )

    render(
      <StrictMode>
        <Probe q="Uniquetown-strictmode" />
      </StrictMode>,
    )

    // With the old abortable/deduped fetch this stayed at "error:none".
    await waitFor(() =>
      expect(screen.getByTestId('out').textContent).toBe('loaded:https://img/x.jpg'),
    )
  })
})
