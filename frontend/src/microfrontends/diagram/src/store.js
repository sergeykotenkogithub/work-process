import { configureStore } from '@reduxjs/toolkit'

const initialState = {
  steps: [],
  selectedStepIndex: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 }
}

function workflowReducer(state = initialState, action) {
  switch (action.type) {
    case 'setSteps':
      return { ...state, steps: action.payload }
    case 'selectStep':
      return { ...state, selectedStepIndex: action.payload }
    case 'setZoom':
      return { ...state, zoom: action.payload }
    case 'setPanOffset':
      return { ...state, panOffset: action.payload }
    case 'resetView':
      return { ...state, zoom: 1, panOffset: { x: 0, y: 0 } }
    default:
      return state
  }
}

export const store = configureStore({
  reducer: {
    workflow: workflowReducer
  }
})

// Action creators
export const setSteps = (steps) => ({ type: 'setSteps', payload: steps })
export const selectStep = (index) => ({ type: 'selectStep', payload: index })
export const setZoom = (zoom) => ({ type: 'setZoom', payload: zoom })
export const setPanOffset = (panOffset) => ({ type: 'setPanOffset', payload: panOffset })
export const resetView = () => ({ type: 'resetView' })