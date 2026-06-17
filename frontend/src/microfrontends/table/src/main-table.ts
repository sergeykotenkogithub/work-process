import { createApp } from 'vue'
import { createPinia } from 'pinia'
import StepTable from './components/StepTable.vue'
import { useWorkflowStore } from './store'

let diagramStepHandler: ((event: Event) => void) | null = null

export async function bootstrap() {
  console.log('Vue table app bootstrap')
}

export async function mount(props: any) {
  try {
    console.log('Vue table app mount', props)
    const container = document.getElementById('table-container')
    if (!container) {
      throw new Error('Table container not found')
    }
    const app = createApp(StepTable)
    const pinia = createPinia()
    app.use(pinia)
    const store = useWorkflowStore()
    await store.fetchWorkflow()

    // Communicate with diagram microfrontend via window events
    diagramStepHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ index: number | null }>
      const { index } = customEvent.detail
      if (index !== null) {
        store.selectStep(index)
      }
    }
    window.addEventListener('diagram-step-selected', diagramStepHandler)

    // When a step is selected in table, notify diagram
    const originalSelectStep = store.selectStep
    store.selectStep = (index: number | null) => {
      originalSelectStep.call(store, index)
      // Dispatch event
      window.dispatchEvent(new CustomEvent('step-selected', { detail: { index } }))
    }

    app.mount(container)
  } catch (e) {
    console.error('Error mounting table microfrontend:', e)
  }
}

export async function unmount() {
  console.log('Vue table app unmount')
  // Cleanup listeners
  if (diagramStepHandler) {
    window.removeEventListener('diagram-step-selected', diagramStepHandler)
    diagramStepHandler = null
  }
  // Note: We do not unmount the Vue app here; in a production scenario we would keep track of the app instance and unmount it.
}