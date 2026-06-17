import React, { useEffect, useRef, useLayoutEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setSteps, selectStep, setZoom, setPanOffset, resetView } from '../store'
import styles from './Diagram.module.scss'

function Diagram() {
  const steps = useSelector(state => state.workflow.steps)
  const selectedStepIndex = useSelector(state => state.workflow.selectedStepIndex)
  const zoom = useSelector(state => state.workflow.zoom)
  const panOffset = useSelector(state => state.workflow.panOffset)
  const dispatch = useDispatch()

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const nodeRefs = useRef(new Map()) // maps index -> DOMRect

  // Log mount for debugging
  useEffect(() => {
    console.log('Diagram component mounted, steps:', steps.length)
  }, [steps])

  // Fetch workflow data from API
  useEffect(() => {
    async function load() {
      const resp = await fetch('/api/workflow/get')
      const data = await resp.json()
      if (Array.isArray(data)) {
        dispatch(setSteps(data))
      } else if (data && Array.isArray(data.steps)) {
        dispatch(setSteps(data.steps))
      }
    }
    load()
  }, [dispatch])

  // Listen for step selection from table microfrontend
  useEffect(() => {
    const handler = (event) => {
      const { index } = event.detail
      dispatch(selectStep(index))
    }
    window.addEventListener('step-selected', handler)
    return () => {
      window.removeEventListener('step-selected', handler)
    }
  }, [dispatch])

  // Measure node positions and compute links whenever steps or zoom change
  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const nodeClass = styles.node
    const nodes = canvasRef.current.querySelectorAll(`.${nodeClass}`)
    if (nodes.length === 0) {
      // No nodes yet, skip
      return
    }
    const map = nodeRefs.current
    map.clear()
    nodes.forEach((node) => {
      const el = node as HTMLElement
      const index = Number(el.getAttribute('data-index'))
      const rect = el.getBoundingClientRect()
      const canvasRect = canvasRef.current!.getBoundingClientRect()
      const left = rect.left - canvasRect.left
      const top = rect.top - canvasRect.top
      const width = rect.width
      const height = rect.height
      map.set(index, { left, top, width, height })
    })
    // Compute links using original (pre-transform) coordinates
    const result: {x1:number; y1:number; x2:number; y2:number; key:string}[] = []
    steps.forEach((step, idx) => {
      step.nextSteps.forEach((toIdx) => {
        const to = steps.find((s) => s.initialIndex === toIdx)
        if (to) {
          const fromScaled = map.get(step.initialIndex)
          const toScaled = map.get(to.initialIndex)
          if (fromScaled && toScaled) {
            // Convert scaled rects to unscaled (style) coordinates
            const fromRect = {
              left: step.x,
              top: step.y,
              width: fromScaled.width / zoom,
              height: fromScaled.height / zoom
            }
            fromRect.right = fromRect.left + fromRect.width
            fromRect.bottom = fromRect.top + fromRect.height
            const toRect = {
              left: to.x,
              top: to.y,
              width: toScaled.width / zoom,
              height: toScaled.height / zoom
            }
            toRect.right = toRect.left + toRect.width
            toRect.bottom = toRect.top + toRect.height
            const connection = getConnectionPoints(fromRect, toRect)
            result.push({ ...connection, key: `${step.initialIndex}-${toIdx}` })
          }
        }
      })
    })
    setLinks(result)
    console.log('Diagram: links computed:', result.length)
    if (steps.length > 0) {
      console.log('Diagram: first step:', steps[0])
      if (result.length > 0) {
        console.log('Diagram: first link:', result[0])
      }
    }
  }, [steps, zoom])

  // Helper to compute connection points between two rects
  const getConnectionPoints = (fromRect: DOMRect, toRect: DOMRect) => {
    const fromCX = fromRect.left + fromRect.width / 2
    const fromCY = fromRect.top + fromRect.height / 2
    const toCX = toRect.left + toRect.width / 2
    const toCY = toRect.top + toRect.height / 2

    const toLeft = toRect.right < fromRect.left
    const toRight = toRect.left > fromRect.right
    const toTop = toRect.bottom < fromRect.top
    const toBottom = toRect.top > fromRect.bottom

    let x1 = fromCX, y1 = fromCY, x2 = toCX, y2 = toCY

    if (toRight) {
      x1 = fromRect.right
      y1 = fromCY
      x2 = toRect.left
      y2 = toCY
    } else if (toLeft) {
      x1 = fromRect.left
      y1 = fromCY
      x2 = toRect.right
      y2 = toCY
    } else if (toBottom) {
      x1 = fromCX
      y1 = fromRect.bottom
      x2 = toCX
      y2 = toRect.top
    } else if (toTop) {
      x1 = fromCX
      y1 = fromRect.top
      x2 = toCX
      y2 = toRect.bottom
    }

    return { x1, y1, x2, y2 }
  }

  // Compute links (memoized)
  const [links, setLinks] = React.useState<{x1:number; y1:number; x2:number; y2:number; key:string}[]>([])


  const handleZoomIn = () => {
    const newZoom = Math.min(2, zoom + 0.1)
    dispatch(setZoom(newZoom))
  }
  const handleZoomOut = () => {
    const newZoom = Math.max(0.25, zoom - 0.1)
    dispatch(setZoom(newZoom))
  }
  const handleReset = () => {
    dispatch(resetView())
  }

  // Panning logic similar to Vue version
  const [isPanning, setIsPanning] = React.useState(false)
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 })

  const startPan = (e) => {
    setIsPanning(true)
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }
  const onPan = (e) => {
    if (!isPanning) return
    dispatch(setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }))
  }
  const endPan = () => setIsPanning(false)

  const onWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.25, Math.min(2, zoom + delta))
    dispatch(setZoom(newZoom))
  }

  // When a node is clicked, we already dispatch selectStep via Redux; also notify table
  const notifyDiagramSelection = (index) => {
    window.dispatchEvent(new CustomEvent('diagram-step-selected', { detail: { index } }))
  }

  return (
    <div className={styles.diagramContainer} ref={containerRef}>
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={handleZoomIn} title="Приблизить">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
        <button className={styles.toolBtn} onClick={handleZoomOut} title="Отдалить">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4.5 7h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
        <button className={styles.toolBtn} onClick={handleReset} title="Сбросить">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </button>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
      </div>
      <div className={styles.canvasWrapper} ref={canvasRef}>
        <div className={styles.canvasInner}
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            transformOrigin: '0 0'
          }}
        >
          <svg className={styles.connections}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0,6 2.5,0 5" fill="#333" />
              </marker>
            </defs>
            {links.map((link) => (
              <line
                key={link.key}
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke="#333"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
            ))}
          </svg>
          {steps.map((step) => (
            <div
              key={step.initialIndex}
              data-index={step.initialIndex}
              className={`${styles.node} ${selectedStepIndex === step.initialIndex ? styles.selected : ''} ${step.name === 'Возврат' ? styles.nodeReturn : ''}`}
              style={{
                left: `${step.x}px`,
                top: `${step.y}px`,
                borderColor: step.color || '#8eaad4',
                background: step.name === 'Возврат' ? (step.color || '#8eaad4') : 'transparent'
              }}
              onClick={() => {
                dispatch(selectStep(step.initialIndex))
                notifyDiagramSelection(step.initialIndex)
              }}
            >
              <span className={styles.nodeName} style={{ color: step.name === 'Возврат' ? 'white' : step.color || '#8eaad4' }}>
                {step.name}
              </span>
              {step.name === 'Возврат' && (
                <>
                  <div className={styles.sqTl}></div>
                  <div className={styles.sqTr}></div>
                  <div className={styles.sqBl}></div>
                  <div className={styles.sqBr}></div>
                  <div className={styles.sqTop}></div>
                  <div className={styles.sqBottom}></div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Diagram