import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'

// Stub MapView (heavy Leaflet module) before importing Header.
vi.mock('../MapView', () => ({
  MapView: () => null,
  finishDraw: vi.fn(),
  cancelDraw: vi.fn(),
  finishEdit: vi.fn(),
  cancelEdit: vi.fn(),
}))

import { Header } from '../Header'
import { useAppStore } from '../../store/useAppStore'
import { renderWithProviders, resetStore, buildFakeAuth } from '../../test/helpers'
import type { User } from '@supabase/supabase-js'

beforeEach(resetStore)

const fakeUser: User = {
  id: 'u1', email: 'alice@example.com', app_metadata: {}, user_metadata: {},
  aud: 'auth', created_at: '2026-01-01', confirmation_sent_at: undefined,
} as User

describe('Header — logged-in state', () => {
  it('renders brand + app title', () => {
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    expect(screen.getByText('ANRAC')).toBeInTheDocument()
    expect(screen.getByText(/Gestion Exploitation/i)).toBeInTheDocument()
  })

  it('shows Dashboard + Agenda buttons when not drawing', () => {
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Agenda/i })).toBeInTheDocument()
  })

  it('opens Dashboard when Dashboard button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Dashboard/i }))
    expect(useAppStore.getState().dashboardOpen).toBe(true)
  })

  it('opens Agenda when Agenda button clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Agenda/i }))
    expect(useAppStore.getState().calendarOpen).toBe(true)
  })

  it('signs out when power button clicked', async () => {
    const auth = buildFakeAuth({ user: fakeUser })
    const user = userEvent.setup()
    renderWithProviders(<Header />, { auth })
    await user.click(screen.getByTitle('Déconnexion'))
    expect(auth.signOut).toHaveBeenCalled()
  })

  it('toggles help open when ? clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: '?' }))
    expect(useAppStore.getState().helpOpen).toBe(true)
  })

  it('toggles sidebar when hamburger clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: '☰' }))
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })
})

describe('Header — drawing mode', () => {
  it('shows Valider + Annuler when drawTarget is set', () => {
    useAppStore.setState({ drawTarget: 'field' })
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    expect(screen.getByRole('button', { name: /Valider/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Dashboard/i })).toBeNull()
  })
})

describe('Header — editing mode', () => {
  it('shows Valider + Annuler when editTarget is set', () => {
    useAppStore.setState({ editTarget: { type: 'field', fieldId: 1 } })
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: fakeUser }) })
    expect(screen.getByRole('button', { name: /Valider/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument()
  })
})

describe('Header — logged-out state', () => {
  it('hides user email / logout when no user', () => {
    renderWithProviders(<Header />, { auth: buildFakeAuth({ user: null }) })
    expect(screen.queryByTitle('Déconnexion')).toBeNull()
  })
})
