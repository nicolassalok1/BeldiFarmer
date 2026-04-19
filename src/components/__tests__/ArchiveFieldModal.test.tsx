import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { ArchiveFieldModal } from '../ArchiveFieldModal'
import { useAppStore } from '../../store/useAppStore'
import { renderWithI18n, resetStore } from '../../test/helpers'
import type { Field } from '../../types'

function makeField(id: number, overrides: Partial<Field> = {}): Field {
  return {
    id, name: `F${id}`, color: '#8fa84f',
    latlngs: [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }],
    area: 1, perimeter: 100, points: [],
    assignedEmployees: [], assignedManager: null, pointMarkers: [],
    ...overrides,
  }
}

beforeEach(resetStore)

describe('ArchiveFieldModal', () => {
  it('returns null when field is missing', () => {
    useAppStore.setState({ fields: [] })
    const onClose = vi.fn()
    const { container } = renderWithI18n(<ArchiveFieldModal fieldId={42} onClose={onClose} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the field name in the title', () => {
    useAppStore.setState({ fields: [makeField(1, { name: 'Nord' })] })
    renderWithI18n(<ArchiveFieldModal fieldId={1} onClose={vi.fn()} />)
    expect(screen.getByText(/Archiver «\s*Nord\s*»/)).toBeInTheDocument()
  })

  it('shows "no activity" when no activities reference this field', () => {
    useAppStore.setState({ fields: [makeField(1), makeField(2)] })
    renderWithI18n(<ArchiveFieldModal fieldId={1} onClose={vi.fn()} />)
    expect(screen.getByText(/Aucune activité à réattribuer/i)).toBeInTheDocument()
  })

  it('shows "no other fields" when only the field being archived exists', () => {
    useAppStore.setState({
      fields: [makeField(1)],
      activities: [{ id: 1, date: '2026-01-01', type: 'other', fieldIds: [1], workerCount: 1, other: { title: 'T' }, createdAt: '2026-01-01' }],
    })
    renderWithI18n(<ArchiveFieldModal fieldId={1} onClose={vi.fn()} />)
    expect(screen.getByText(/Aucune autre zone active/i)).toBeInTheDocument()
  })

  it('lists activities + reassignable targets', () => {
    useAppStore.setState({
      fields: [makeField(1), makeField(2, { name: 'Cible A' }), makeField(3, { name: 'Cible B' })],
      activities: [
        { id: 1, date: '2026-01-01', type: 'other', fieldIds: [1], workerCount: 1, other: { title: 'Taille' }, createdAt: '2026-01-01' },
      ],
    })
    renderWithI18n(<ArchiveFieldModal fieldId={1} onClose={vi.fn()} />)
    expect(screen.getByText(/Activités de la zone \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Taille/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cible A/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cible B/i })).toBeInTheDocument()
  })

  it('archives the field with no reassignments when confirmed', async () => {
    useAppStore.setState({ fields: [makeField(1, { name: 'X' }), makeField(2)] })
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithI18n(<ArchiveFieldModal fieldId={1} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /Archiver/ }))
    expect(useAppStore.getState().fields.find((f) => f.id === 1)?.archived).toBe(true)
    expect(onClose).toHaveBeenCalled()
  })

  it('reassigns an activity when a target is selected', async () => {
    useAppStore.setState({
      fields: [makeField(1), makeField(2, { name: 'Cible A' })],
      activities: [
        { id: 1, date: '2026-01-01', type: 'other', fieldIds: [1], workerCount: 1, other: { title: 'T' }, createdAt: '2026-01-01' },
      ],
    })
    const user = userEvent.setup()
    renderWithI18n(<ArchiveFieldModal fieldId={1} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Cible A/i }))
    await user.click(screen.getByRole('button', { name: /Archiver/ }))
    // Activity should now include target 2
    expect(useAppStore.getState().activities[0].fieldIds).toEqual([1, 2])
  })

  it('Annuler closes without archiving', async () => {
    useAppStore.setState({ fields: [makeField(1), makeField(2)] })
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithI18n(<ArchiveFieldModal fieldId={1} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(useAppStore.getState().fields.find((f) => f.id === 1)?.archived).toBeFalsy()
    expect(onClose).toHaveBeenCalled()
  })
})
