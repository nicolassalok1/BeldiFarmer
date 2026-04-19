import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { CalendarPanel } from '../CalendarPanel'
import { useAppStore } from '../../store/useAppStore'
import { renderWithI18n, resetStore } from '../../test/helpers'
import type { Field, Activity } from '../../types'

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

describe('CalendarPanel — rendering', () => {
  it('does not render when closed', () => {
    const { container } = renderWithI18n(<CalendarPanel />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the calendar with current month label', () => {
    useAppStore.setState({ calendarOpen: true })
    renderWithI18n(<CalendarPanel />)
    expect(screen.getByText(/Agenda/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Aujourd'hui/i })).toBeInTheDocument()
  })

  it('renders the seven weekday headers', () => {
    useAppStore.setState({ calendarOpen: true })
    renderWithI18n(<CalendarPanel />)
    // L M M J V S D
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
  })
})

describe('CalendarPanel — navigation', () => {
  it('navigates to the previous month', async () => {
    useAppStore.setState({ calendarOpen: true })
    const user = userEvent.setup()
    renderWithI18n(<CalendarPanel />)
    const initialLabel = screen.getByText(/^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4}$/i).textContent
    await user.click(screen.getByRole('button', { name: '‹' }))
    const newLabel = screen.getByText(/^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4}$/i).textContent
    expect(newLabel).not.toBe(initialLabel)
  })

  it('returns to current month when "Aujourd\'hui" clicked', async () => {
    useAppStore.setState({ calendarOpen: true })
    const user = userEvent.setup()
    renderWithI18n(<CalendarPanel />)

    const expected = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    // Move two months back, then click "Aujourd'hui"
    await user.click(screen.getByRole('button', { name: '‹' }))
    await user.click(screen.getByRole('button', { name: '‹' }))
    await user.click(screen.getByRole('button', { name: /Aujourd'hui/i }))
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})

describe('CalendarPanel — quick-add buttons', () => {
  it('header watering button opens activity form with preset', async () => {
    useAppStore.setState({ calendarOpen: true })
    const user = userEvent.setup()
    renderWithI18n(<CalendarPanel />)
    await user.click(screen.getByTitle('Arrosage'))
    const s = useAppStore.getState()
    expect(s.activityFormOpen).toBe(true)
    expect(s.activityFormPresetType).toBe('watering')
  })

  it('header expense button opens activity form with expense preset', async () => {
    useAppStore.setState({ calendarOpen: true })
    const user = userEvent.setup()
    renderWithI18n(<CalendarPanel />)
    await user.click(screen.getByTitle('Dépense'))
    expect(useAppStore.getState().activityFormPresetType).toBe('expense')
  })
})

describe('CalendarPanel — close', () => {
  it('closes on ✕ click', async () => {
    useAppStore.setState({ calendarOpen: true })
    const user = userEvent.setup()
    renderWithI18n(<CalendarPanel />)
    await user.click(screen.getByText('✕'))
    expect(useAppStore.getState().calendarOpen).toBe(false)
  })
})

describe('CalendarPanel — day interaction', () => {
  it('lists activities of the selected day', async () => {
    // Seed today with an activity
    const today = new Date().toISOString().slice(0, 10)
    const activity: Activity = {
      id: 1, date: today, type: 'other', fieldIds: [1], workerCount: 1,
      other: { title: 'Taille des vignes' }, createdAt: today,
    }
    useAppStore.setState({
      calendarOpen: true,
      fields: [makeField(1)],
      activities: [activity],
    })
    const user = userEvent.setup()
    renderWithI18n(<CalendarPanel />)

    // Click today's cell — it's the button labelled with today's day number
    const todayDay = String(new Date().getDate())
    // Multiple matching day numbers possible; pick the one inside the current month grid
    const dayButtons = screen.getAllByRole('button').filter((b) => b.textContent?.startsWith(todayDay))
    // Click the first one that's a day cell (contains 'Autre' chip or just digit)
    await user.click(dayButtons[0])

    expect(screen.getByText(/Taille des vignes/i)).toBeInTheDocument()
  })

  it('removes an activity after confirm', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const activity: Activity = {
      id: 99, date: today, type: 'other', fieldIds: [1], workerCount: 1,
      other: { title: 'Supprimez-moi' }, createdAt: today,
    }
    useAppStore.setState({
      calendarOpen: true,
      fields: [makeField(1)],
      activities: [activity],
    })
    vi.stubGlobal('confirm', vi.fn(() => true))

    const user = userEvent.setup()
    renderWithI18n(<CalendarPanel />)

    // Select today's cell
    const todayDay = String(new Date().getDate())
    const dayButtons = screen.getAllByRole('button').filter((b) => b.textContent?.startsWith(todayDay))
    await user.click(dayButtons[0])

    // Click the delete (✕) button inside the activity row
    await user.click(screen.getByTitle('Supprimer'))
    expect(useAppStore.getState().activities).toEqual([])
    vi.unstubAllGlobals()
  })
})
