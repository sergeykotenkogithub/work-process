import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import Diagram from './components/Diagram.tsx'

let root: ReturnType<typeof createRoot> | null = null

export async function bootstrap() {
  console.log('React diagram app bootstrap')
}

export async function mount(props: any) {
  try {
    console.log('React diagram app mount', props)
    const container = document.getElementById('diagram-container')
    if (!container) {
      throw new Error('Diagram container not found')
    }
    // Create React root and render the Diagram component wrapped with Provider
    root = createRoot(container)
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <Diagram />
        </Provider>
      </React.StrictMode>
    )
  } catch (e) {
    console.error('Error mounting diagram microfrontend:', e)
  }
}

export async function unmount() {
  console.log('React diagram app unmount')
  if (root) {
    root.unmount()
    root = null
  }
}