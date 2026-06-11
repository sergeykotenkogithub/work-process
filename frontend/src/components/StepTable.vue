<template>
  <div class="table-wrapper">
    <div class="table-header">
      <h2>Структура рабочего процесса</h2>
      <button @click="store.addStep" class="btn-add">
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Создать состояние
      </button>
    </div>

    <div class="search-box">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="search-icon">
        <circle cx="6" cy="6" r="4.5" stroke="#999" stroke-width="1.2"/>
        <path d="M9.5 9.5l4 4" stroke="#999" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      <input
        v-model="store.searchQuery"
        type="text"
        placeholder="Поиск шагов..."
      />
    </div>

    <div class="table-scroll">
      <table class="data-table">
        <colgroup>
          <col style="width: 170px" />
          <col style="width: 50px" />
          <col style="width: 50px" />
          <col style="width: 250px" />
          <col style="width: 32px" />
        </colgroup>
        <thead>
          <tr>
            <th style="text-align:left">Состояние</th>
            <th style="text-align:center; font-size: 8px">x</th>
            <th style="text-align:center; font-size: 8px">y</th>
            <th style="text-align:left">Переходы</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
                    v-for="step in store.filteredSteps"
                    :key="step.initialIndex"
                    @click="selectStep(step.initialIndex)"
                    :class="{ selected: store.selectedStepIndex === step.initialIndex }"
                  >
                      <td>
                        <div class="td-box">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" :stroke="getBlockColor(step.color)" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                            <path d="M14 2v6h6"/>
                          </svg>
                          <input
                            v-if="editingIndex === step.initialIndex"
                            v-model="editingName"
                            maxlength="50"
                            @blur="saveStepName(step.initialIndex)"
                            @keyup.enter="saveStepName(step.initialIndex)"
                            @keyup.escape="cancelEditing"
                            class="name-input"
                            @click.stop
                            autofocus
                          />
                          <span v-else @dblclick="startEditing(step)" class="step-name" :title="step.name">
                            {{ truncate(step.name, 50) }}
                          </span>
                        </div>
                      </td>
            <td>
              <div class="td-box center">{{ Math.round(step.x) }}</div>
            </td>
            <td>
              <div class="td-box center">{{ Math.round(step.y) }}</div>
            </td>
            <td>
              <div class="td-box transitions-cell">
                <template v-if="step.nextSteps && step.nextSteps.length">
                  <span v-for="(nextIdx, i) in step.nextSteps" :key="nextIdx" class="transition-group">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" :stroke="getStepColor(nextIdx)" stroke-width="1.5" class="doc-icon">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                    <span class="transition-name">{{ getStepName(nextIdx) }}</span>
                    <span v-if="i < step.nextSteps.length - 1" class="transition-comma">,</span>
                  </span>
                </template>
              </div>
            </td>
            <td>
              <div class="td-box center">
                <button
                  @click.stop="store.deleteStep(step.initialIndex)"
                  class="btn-delete"
                  title="Удалить"
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4h10M5 4V2h4v2M3 4v8a1 1 0 001 1h6a1 1 0 001-1V4" stroke="#555" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWorkflowStore } from '../stores/workflow'

const store = useWorkflowStore()
const editingIndex = ref<number | null>(null)
const editingName = ref('')

function truncate(text: string, maxLen: number): string {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function getBlockColor(color: string): string {
  if (!color) {
    return '#8eaad4'
  }
  return color
}

function getStepName(index: number): string {
  const allSteps = store.steps.length > 0 ? store.steps : store.filteredSteps
  const step = allSteps.find((s: any) => s.initialIndex === index)
  return step ? step.name : String(index)
}

function getStepColor(index: number): string {
  const step = store.steps.find((s: any) => s.initialIndex === index)
  return step ? getBlockColor(step.color) : '#8eaad4'
}



function selectStep(index: number) {
  store.selectStep(store.selectedStepIndex === index ? null : index)
}

function startEditing(step: { initialIndex: number; name: string }) {
  editingIndex.value = step.initialIndex
  editingName.value = step.name
}

function saveStepName(index: number) {
  if (editingName.value.trim()) {
    store.updateStepName(index, editingName.value.trim())
  }
  cancelEditing()
}

function cancelEditing() {
  editingIndex.value = null
  editingName.value = ''
}
</script>

<style scoped>
.table-wrapper {
  padding: 8px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.table-header h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  padding: 4px 8px;
  border-radius: 3px;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #e8e8e8;
  color: #555;
  border: none;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #d0d0d0;
}

.search-box {
  position: relative;
  margin-bottom: 8px;
}

.search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.search-box input {
  width: 100%;
  padding: 6px 8px 6px 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #1976d2;
}

.search-box input::placeholder {
  color: #999;
}

.table-scroll {
  flex: 1;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.data-table thead th {
  background: #f8f8f8;
  font-weight: 400;
  font-size: 9px;
  color: #555;
  border-bottom: none;
  white-space: nowrap;
  height: 25px;
  padding: 0 3px;
  box-sizing: border-box;
  position: sticky;
  top: 0;
}

.data-table tbody td {
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  border-bottom: 1px solid #ccc !important;
  height: 25px !important;
  max-height: 25px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  vertical-align: top !important;
  line-height: 25px !important;
  font-size: 10px !important;
}

.td-box {
  height: 25px;
  line-height: 25px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0 3px;
  box-sizing: border-box;
  font-size: 10px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.td-box:not(.center) {
  color: #111;
}

.td-box.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-name {
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.step-name:hover {
  text-decoration: underline;
}

.name-input {
  width: 100%;
  height: 25px;
  line-height: 25px;
  padding: 0 2px;
  border: 2px solid #1976d2;
  border-radius: 3px;
  font-size: 10px;
  outline: none;
  box-sizing: border-box;
}

.transitions-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 250px;
}

.doc-icon {
  flex-shrink: 0;
  margin-right: 2px;
}

.transition-name {
  color: #222;
  font-size: 10px;
}



.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
  border: none;
  cursor: pointer;
  padding: 0 3px;
  border-radius: 3px;
  height: 20px;
  opacity: 0.7;
  transition: opacity 0.2s, background 0.2s;
}

.btn-delete:hover {
  opacity: 1;
  background: #d0d0d0;
}

.data-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.data-table tbody tr:hover {
  background: #f8f8f8;
}

.data-table tbody tr.selected {
  background: #e3f2fd;
}

.table-footer {
  padding: 6px 0;
  border-top: 1px solid #f0f0f0;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #999;
}
</style>