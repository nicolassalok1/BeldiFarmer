import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'
import { useAppStore } from '../../store/useAppStore'
import { renderWithProviders, resetStore, buildFakeAuth } from '../../test/helpers'
import type { User } from '@supabase/supabase-js'

const fakeUser: User = {
  id: 'u1', email: 'alice@example.com', app_metadata: {}, user_metadata: {},
  aud: 'auth', created_at: '2026-01-01',
} as User

beforeEach(resetStore)

describe('Sidebar — rendering', () => {
  it('shows section headings', () => {
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    expect(screen.getByText(/Zone exploitation/i)).toBeInTheDocument()
    // "Sauvegarde" appears both as section title and button; at least one exists
    expect(screen.getAllByText(/Sauvegarde/i).length).toBeGreaterThan(0)
  })

  it('shows "Dessiner l\'exploitation" when no exploitation set', () => {
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    expect(screen.getByRole('button', { name: /Dessiner l'exploitation/i })).toBeInTheDocument()
  })

  it('displays exploit area when exploitation is set', () => {
    useAppStore.setState({
      exploitPolygon: [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }],
      exploitArea: 3.7,
    })
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    expect(screen.getByText(/3\.70 ha/)).toBeInTheDocument()
  })
})

describe('Sidebar — draw exploit toggle', () => {
  it('sets drawTarget to "exploit" on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Dessiner l'exploitation/i }))
    expect(useAppStore.getState().drawTarget).toBe('exploit')
  })

  it('cancels drawing when clicking again while drawing', async () => {
    useAppStore.setState({ drawTarget: 'exploit', statusText: 'DESSIN EXPLOITATION' })
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Annuler/ }))
    expect(useAppStore.getState().drawTarget).toBeNull()
  })
})

describe('Sidebar — clear all', () => {
  it('does nothing when user cancels the confirm dialog', async () => {
    useAppStore.setState({
      exploitPolygon: [{ lat: 0, lng: 0 }],
      exploitArea: 1,
    })
    vi.stubGlobal('confirm', vi.fn(() => false))

    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Tout effacer/i }))
    expect(useAppStore.getState().exploitPolygon).not.toBeNull()
    vi.unstubAllGlobals()
  })

  it('clears state when user confirms', async () => {
    useAppStore.setState({
      exploitPolygon: [{ lat: 0, lng: 0 }],
      exploitArea: 1,
    })
    vi.stubGlobal('confirm', vi.fn(() => true))

    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Tout effacer/i }))
    expect(useAppStore.getState().exploitPolygon).toBeNull()
    vi.unstubAllGlobals()
  })
})

describe('Sidebar — save button', () => {
  it('shows warning toast when nothing to save', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Sauvegarder/i }))
    expect(useAppStore.getState().toastMessage).toMatch(/Rien à sauvegarder/i)
    expect(useAppStore.getState().toastError).toBe(true)
  })
})

describe('Sidebar — delete account', () => {
  it('reveals the confirm UI on first click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Supprimer mon compte/i }))
    expect(screen.getByPlaceholderText('SUPPRIMER')).toBeInTheDocument()
  })

  it('keeps the destroy button disabled until "SUPPRIMER" is typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth: buildFakeAuth({ user: fakeUser }) })
    await user.click(screen.getByRole('button', { name: /Supprimer mon compte/i }))
    const confirmBtn = screen.getByRole('button', { name: /Supprimer définitivement/i }) as HTMLButtonElement
    expect(confirmBtn.disabled).toBe(true)

    await user.type(screen.getByPlaceholderText('SUPPRIMER'), 'SUPPRIMER')
    expect(confirmBtn.disabled).toBe(false)
  })

  it('cancels without calling signOut', async () => {
    const auth = buildFakeAuth({ user: fakeUser })
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth })
    await user.click(screen.getByRole('button', { name: /Supprimer mon compte/i }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(auth.signOut).not.toHaveBeenCalled()
  })

  it('clears store + signs out when confirmed (no supabase env → local-only path)', async () => {
    useAppStore.setState({ fields: [{ id: 1, name: 'X', color: '#0f0', latlngs: [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }], area: 1, perimeter: 1, points: [], assignedEmployees: [], assignedManager: null, pointMarkers: [] }] })
    const auth = buildFakeAuth({ user: fakeUser })
    const user = userEvent.setup()
    renderWithProviders(<Sidebar />, { auth })

    await user.click(screen.getByRole('button', { name: /Supprimer mon compte/i }))
    await user.type(screen.getByPlaceholderText('SUPPRIMER'), 'SUPPRIMER')
    await user.click(screen.getByRole('button', { name: /Supprimer définitivement/i }))

    // signOut should be called
    expect(auth.signOut).toHaveBeenCalled()
    // clearAll runs — fields wiped
    expect(useAppStore.getState().fields).toEqual([])
  })
})
