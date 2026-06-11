import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WorkflowStep {
  initialIndex: number
  name: string
  x: number
  y: number
  nextSteps: number[]
  color: string
}

export const useWorkflowStore = defineStore('workflow', () => {
  const steps = ref<WorkflowStep[]>([])
  const selectedStepIndex = ref<number | null>(null)
  const searchQuery = ref('')
  const sortBy = ref<'name' | 'index'>('index')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const zoom = ref(1)
  const panOffset = ref({ x: 0, y: 0 })

  const filteredSteps = computed(() => {
    let result = [...steps.value]
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(step => step.name.toLowerCase().includes(query))
    }
    result.sort((a, b) => {
      let comparison = 0
      if (sortBy.value === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else {
        comparison = a.initialIndex - b.initialIndex
      }
      return sortOrder.value === 'asc' ? comparison : -comparison
    })
    return result
  })

  async function fetchWorkflow() {
    try {
      const response = await fetch('/api/workflow/get')
      const data = await response.json()
      if (Array.isArray(data)) {
        steps.value = data
      } else if (data && Array.isArray(data.steps)) {
        steps.value = data.steps
      } else {
        steps.value = []
      }
    } catch (error) {
      console.error('[store] Failed to fetch workflow:', error)
    }
  }

  async function addStep() {
    const newIndex = steps.value.length > 0
      ? Math.max(...steps.value.map(s => s.initialIndex)) + 1
      : 0
    const stepNumber = steps.value.length + 1
    let newName = `Шаг ${stepNumber}`
    let counter = 1
    while (steps.value.some(s => s.name === newName)) {
      newName = `Шаг ${stepNumber} (${counter})`
      counter++
    }
    const newStep: WorkflowStep = {
      initialIndex: newIndex,
      name: newName,
      x: 0,
      y: 0,
      nextSteps: [],
      color: '#F5F5F5'
    }
    try {
      const response = await fetch('/api/workflow/createStep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wfName: 'wf1',
          stepName: newStep.name,
          x: newStep.x,
          y: newStep.y,
          color: newStep.color
        })
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.initialIndex !== undefined) {
          newStep.initialIndex = data.initialIndex
        }
        steps.value.push(newStep)
      }
    } catch (error) {
      console.error('Failed to add step:', error)
    }
  }

  async function deleteStep(index: number) {
    try {
      const response = await fetch('/api/workflow/deleteStep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wfName: 'wf1', stepInitialIndex: index })
      })
      if (response.ok) {
        steps.value = steps.value.filter(s => s.initialIndex !== index)
        steps.value.forEach(step => {
          step.nextSteps = step.nextSteps.filter(s => s !== index)
        })
      }
    } catch (error) {
      console.error('Failed to delete step:', error)
    }
  }

  async function updateStepName(index: number, newName: string) {
    try {
      const response = await fetch('/api/workflow/changeStepName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wfName: 'wf1', stepInitialIndex: index, stepName: newName })
      })
      if (response.ok) {
        const step = steps.value.find(s => s.initialIndex === index)
        if (step) step.name = newName
      }
    } catch (error) {
      console.error('Failed to update step name:', error)
    }
  }

  async function updateStepCoordinates(index: number, x: number, y: number) {
    try {
      const response = await fetch('/api/workflow/changeStepXY', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wfName: 'wf1', stepInitialIndex: index, x, y })
      })
      if (response.ok) {
        const step = steps.value.find(s => s.initialIndex === index)
        if (step) {
          step.x = x
          step.y = y
        }
      }
    } catch (error) {
      console.error('Failed to update coordinates:', error)
    }
  }

  function selectStep(index: number | null) {
    selectedStepIndex.value = selectedStepIndex.value === index ? null : index
  }

  function setZoom(newZoom: number) {
    zoom.value = Math.max(0.25, Math.min(2, newZoom))
  }

  function resetZoom() {
    zoom.value = 1
    panOffset.value = { x: 0, y: 0 }
  }

  function saveSortSettings() {
    localStorage.setItem('workflowSortBy', sortBy.value)
    localStorage.setItem('workflowSortOrder', sortOrder.value)
  }

  function loadSortSettings() {
    const savedSortBy = localStorage.getItem('workflowSortBy')
    const savedSortOrder = localStorage.getItem('workflowSortOrder')
    if (savedSortBy) sortBy.value = savedSortBy as 'name' | 'index'
    if (savedSortOrder) sortOrder.value = savedSortOrder as 'asc' | 'desc'
  }

  return {
    steps, selectedStepIndex, searchQuery, sortBy, sortOrder, zoom, panOffset, filteredSteps,
    fetchWorkflow, addStep, deleteStep, updateStepName, updateStepCoordinates,
    selectStep, setZoom, resetZoom, saveSortSettings, loadSortSettings
  }
})