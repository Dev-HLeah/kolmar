import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiDelete, apiGet, apiPost, setApiRole } from './client'

const fetchMock = vi.fn()
const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = fetchMock
})

afterEach(() => {
  fetchMock.mockReset()
  setApiRole('researcher')
})

afterAll(() => {
  globalThis.fetch = originalFetch
})

describe('api client', () => {
  it('sends the active user role on GET requests', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    })

    setApiRole('viewer')

    await apiGet('/health')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-user-role': 'viewer',
        }),
      }),
    )
  })

  it('sends JSON mutation requests with the active user role', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'product-1' }),
    })

    setApiRole('admin')

    await apiPost('/products', { name: '위 건강 정제' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/products',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: '위 건강 정제' }),
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-user-role': 'admin',
        }),
      }),
    )
  })

  it('sends DELETE requests with the active user role', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'try-1' }),
    })

    setApiRole('researcher')

    await apiDelete('/projects/tries/try-1')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/projects/tries/try-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'x-user-role': 'researcher',
        }),
      }),
    )
  })
})
