<template>
  <div class="diagram-container" ref="containerRef">
    <div class="toolbar">
      <button @click="store.setZoom(store.zoom + 0.1)" class="tool-btn" title="Приблизить">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M7 4.5v5M4.5 7h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
      <button @click="store.setZoom(store.zoom - 0.1)" class="tool-btn" title="Отдалить">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M4.5 7h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
      <button @click="store.resetZoom" class="tool-btn" title="Сбросить">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      </button>
      <span class="zoom-label">{{ Math.round(store.zoom * 100) }}%</span>
    </div>

    <div
      class="canvas"
      ref="canvasRef"
      :style="{
        transform: `scale(${store.zoom}) translate(${store.panOffset.x / store.zoom}px, ${store.panOffset.y / store.zoom}px)`,
        transformOrigin: '0 0'
      }"
      @mousedown="startPan"
      @mousemove="onPan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @wheel.prevent="onWheel"
    >
      <svg class="connections">
        <defs>
          <marker id="arrowBlack" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="#333"/>
          </marker>
        </defs>
        <line
          v-for="edge in allLinks"
          :key="edge.key"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
          stroke="#333"
          stroke-width="1.5"
          marker-end="url(#arrowBlack)"
        />
      </svg>

      <div
        v-for="step in store.steps"
        :key="step.initialIndex"
        :data-index="step.initialIndex"
        class="node"
        :class="{ selected: store.selectedStepIndex === step.initialIndex, 'node-return': step.name === 'Возврат' }"
        :style="{
          left: step.x + 'px',
          top: step.y + 'px',
          borderColor: getBlockColor(step.color),
          background: step.name === 'Возврат' ? getBlockColor(step.color) : 'transparent'
        }"
        @click="selectStep(step.initialIndex)"
      >
        <div class="node-body">
          <span class="node-name" :style="{ color: step.name === 'Возврат' ? 'white' : getBlockColor(step.color) }">{{ step.name }}</span>
        </div>
        <template v-if="step.name === 'Возврат'">
          <div class="sq-tl"></div>
          <div class="sq-tr"></div>
          <div class="sq-bl"></div>
          <div class="sq-br"></div>
          <div class="sq-top"></div>
          <div class="sq-bottom"></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useWorkflowStore } from '../stores/workflow'

const store = useWorkflowStore()
const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const nodeRects = ref<Map<number, DOMRect>>(new Map())

interface LinkEdge {
  x1: number
  y1: number
  x2: number
  y2: number
  key: string
}

function getConnectionPoints(fromRect: DOMRect, toRect: DOMRect) {
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

const allLinks = computed<LinkEdge[]>(() => {
  const result: LinkEdge[] = []
  store.steps.forEach((step: any) => {
    step.nextSteps.forEach((toIdx: number) => {
      const to = store.steps.find((s: any) => s.initialIndex === toIdx)
      if (to) {
        const fromRect = nodeRects.value.get(step.initialIndex)
        const toRect = nodeRects.value.get(toIdx)
        if (fromRect && toRect) {
          const { x1, y1, x2, y2 } = getConnectionPoints(fromRect, toRect)
          result.push({ x1, y1, x2, y2, key: step.initialIndex + '-' + toIdx })
        }
      }
    })
  })
  return result
})

function getBlockColor(color: string): string {
  if (!color || color === '#ffffff' || color === '#fff' || color === '#F5F5F5' || color === '#f5f5f5') {
    return '#8eaad4'
  }
  return color
}

function selectStep(index: number) {
  store.selectStep(store.selectedStepIndex === index ? null : index)
}

function startPan(event: MouseEvent) {
  isPanning.value = true
  panStart.value = { x: event.clientX - store.panOffset.x, y: event.clientY - store.panOffset.y }
}

function onPan(event: MouseEvent) {
  if (!isPanning.value) return
  store.panOffset = { x: event.clientX - panStart.value.x, y: event.clientY - panStart.value.y }
}

function endPan() {
  isPanning.value = false
}

function onWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  store.setZoom(store.zoom + delta)
}

function measureNodes() {
  nextTick(() => {
    if (!canvasRef.value) return
    const nodes = canvasRef.value.querySelectorAll('.node')
    nodes.forEach((node) => {
      const el = node as HTMLElement
      const index = parseInt(el.getAttribute('data-index') || '0')
      const rect = el.getBoundingClientRect()
      const canvasRect = canvasRef.value!.getBoundingClientRect()
      nodeRects.value.set(index, {
        left: rect.left - canvasRect.left,
        top: rect.top - canvasRect.top,
        right: rect.right - canvasRect.left,
        bottom: rect.bottom - canvasRect.top,
        width: rect.width,
        height: rect.height
      } as DOMRect)
    })
  })
}

watch(() => store.steps, measureNodes, { deep: true, immediate: true })
</script>

<style scoped>
.diagram-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f2f2f2;
}

.toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: white;
  padding: 3px 6px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  z-index: 10;
}

.tool-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.tool-btn:hover {
  background: #f0f0f0;
}

.zoom-label {
  font-size: 10px;
  color: #999;
  min-width: 32px;
  text-align: center;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%;
  min-height: 100%;
  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}

.connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 100;
}

.node {
  position: absolute;
  background: transparent;
  border-radius: 4px;
  user-select: none;
  overflow: visible;
  transition: box-shadow 0.2s;
  border: 2px solid #e0e0e0;
  white-space: nowrap;
  width: fit-content;
}

.node:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.16), 0 2px 4px rgba(0,0,0,0.1);
}

.node.selected {
  box-shadow: 0 0 0 2px #1976d2, 0 2px 6px rgba(0,0,0,0.16);
}

.node-body {
  padding: 10px 12px;
}

.node-name {
  font-size: 14px;
  font-weight: 600;
}

.node-return {
  position: relative;
  border: none !important;
  border-radius: 4px;
  overflow: visible !important;
}

.node-return::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border: 3px dashed #999;
  border-radius: 6px;
  pointer-events: none;
}

.node-return .sq-tl,
.node-return .sq-tr,
.node-return .sq-bl,
.node-return .sq-br,
.node-return .sq-top,
.node-return .sq-bottom {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #606060;
  z-index: 10;
}

.node-return .sq-tl {
  top: -8px;
  left: -8px;
}

.node-return .sq-tr {
  top: -8px;
  right: -8px;
}

.node-return .sq-bl {
  bottom: -8px;
  left: -8px;
}

.node-return .sq-br {
  bottom: -8px;
  right: -8px;
}

.node-return .sq-top {
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
}

.node-return .sq-bottom {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
}
</style>