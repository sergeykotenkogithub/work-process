import './style.scss'

console.log('Main.ts loaded')

import { registerApplication, start } from 'single-spa'

// Register table app using dynamic import
registerApplication(
  'table-app',
  () => import('./microfrontends/table/src/main-table'),
  () => true // always active
)

// Register diagram app using dynamic import
registerApplication(
  'diagram-app',
  () => import('./microfrontends/diagram/src/main-diagram'),
  () => true // always active
)

console.log('Applications registered')

// Listen to single-spa events for debugging
window.addEventListener('single-spa:before-mount', (e) => {
  console.log('single-spa:before-mount', e)
})
window.addEventListener('single-spa:mount', (e) => {
  console.log('single-spa:mount', e)
})
window.addEventListener('single-spa:unmount', (e) => {
  console.log('single-spa:unmount', e)
})
window.addEventListener('single-spa:error', (e) => {
  console.error('single-spa:error', e)
})

start()