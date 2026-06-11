import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkflowStore } from '../workflow'

// Mock fetch
global.fetch = vi.fn()

describe('Workflow Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should initialize with empty steps', () => {
    const store = useWorkflowStore()
    expect(store.steps).toEqual([])
    expect(store.selectedStepIndex).toBeNull()
    expect(store.searchQuery).toBe('')
  })

  it('should fetch workflow data', async () => {
    const mockData = [
      { initialIndex: 0, name: 'Test Step', x: 100, y: 100, nextSteps: [], color: '#000' }
    ]
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    })

    const store = useWorkflowStore()
    await store.fetchWorkflow()

    expect(store.steps).toEqual(mockData)
    expect(fetch).toHaveBeenCalledWith('/api/workflow/get')
  })

  it('should add new step', async () => {
    ;(fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    const store = useWorkflowStore()
    await store.addStep()

    expect(store.steps.length).toBe(1)
    expect(store.steps[0].name).toBe('Шаг 1')
    expect(store.steps[0].x).toBe(0)
    expect(store.steps[0].y).toBe(0)
    expect(store.steps[0].color).toBe('#F5F5F5')
  })

  it('should generate unique step names', async () => {
    ;(fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) })

    const store = useWorkflowStore()
    await store.addStep()
    await store.addStep()

    expect(store.steps[0].name).toBe('Шаг 1')
    expect(store.steps[1].name).toBe('Шаг 2')
  })

  it('should delete step', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { initialIndex: 0, name: 'Step 1', x: 0, y: 0, nextSteps: [1], color: '#000' },
        { initialIndex: 1, name: 'Step 2', x: 100, y: 100, nextSteps: [], color: '#fff' }
      ]
    })
    ;(fetch as any).mockResolvedValueOnce({ ok: true })

    const store = useWorkflowStore()
    await store.fetchWorkflow()
    await store.deleteStep(0)

    expect(store.steps.length).toBe(1)
    expect(store.steps[0].initialIndex).toBe(1)
  })

  it('should update step name', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { initialIndex: 0, name: 'Old Name', x: 0, y: 0, nextSteps: [], color: '#000' }
      ]
    })
    ;(fetch as any).mockResolvedValueOnce({ ok: true })

    const store = useWorkflowStore()
    await store.fetchWorkflow()
    await store.updateStepName(0, 'New Name')

    expect(store.steps[0].name).toBe('New Name')
  })

  it('should update step coordinates', async () => {
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { initialIndex: 0, name: 'Step', x: 0, y: 0, nextSteps: [], color: '#000' }
      ]
    })
    ;(fetch as any).mockResolvedValueOnce({ ok: true })

    const store = useWorkflowStore()
    await store.fetchWorkflow()
    await store.updateStepCoordinates(0, 100, 200)

    expect(store.steps[0].x).toBe(100)
    expect(store.steps[0].y).toBe(200)
  })

  it('should select and deselect step', () => {
    const store = useWorkflowStore()
    store.selectStep(5)
    expect(store.selectedStepIndex).toBe(5)
    
    store.selectStep(5)
    expect(store.selectedStepIndex).toBeNull()
  })

  it('should filter steps by search query', () => {
    const store = useWorkflowStore()
    store.steps = [
      { initialIndex: 0, name: 'Закупка', x: 0, y: 0, nextSteps: [], color: '#000' },
      { initialIndex: 1, name: 'Доставка', x: 100, y: 100, nextSteps: [], color: '#fff' }
    ]
    store.searchQuery = 'Закупка'

    expect(store.filteredSteps.length).toBe(1)
    expect(store.filteredSteps[0].name).toBe('Закупка')
  })

  it('should sort steps by name', () => {
    const store = useWorkflowStore()
    store.steps = [
      { initialIndex: 0, name: 'Бета', x: 0, y: 0, nextSteps: [], color: '#000' },
      { initialIndex: 1, name: 'Альфа', x: 100, y: 100, nextSteps: [], color: '#fff' }
    ]
    store.sortBy = 'name'
    store.sortOrder = 'asc'

    expect(store.filteredSteps[0].name).toBe('Альфа')
    expect(store.filteredSteps[1].name).toBe('Бета')
  })

  it('should set zoom within bounds', () => {
    const store = useWorkflowStore()
    
    store.setZoom(3)
    expect(store.zoom).toBe(2)
    
    store.setZoom(0.1)
    expect(store.zoom).toBe(0.25)
    
    store.setZoom(1.5)
    expect(store.zoom).toBe(1.5)
  })

  it('should reset zoom', () => {
    const store = useWorkflowStore()
    store.zoom = 1.5
    store.panOffset = { x: 100, y: 100 }
    
    store.resetZoom()
    
    expect(store.zoom).toBe(1)
    expect(store.panOffset).toEqual({ x: 0, y: 0 })
  })

  it('should save and load sort settings from localStorage', () => {
    const store = useWorkflowStore()
    store.sortBy = 'name'
    store.sortOrder = 'desc'
    store.saveSortSettings()

    expect(localStorage.getItem('workflowSortBy')).toBe('name')
    expect(localStorage.getItem('workflowSortOrder')).toBe('desc')

    store.sortBy = 'index'
    store.sortOrder = 'asc'
    store.loadSortSettings()

    expect(store.sortBy).toBe('name')
    expect(store.sortOrder).toBe('desc')
  })
})