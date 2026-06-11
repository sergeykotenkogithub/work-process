<template>
  <div class="app">
    <div class="left-strip">
      <div class="strip-icons">
      </div>
      <div class="strip-bottom">
        <div class="person-btn" title="Пользователь">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="8" r="4.5"/>
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="main-content">
      <header class="header">
        <span class="header-title"></span>
      </header>
      <main class="main">
        <aside class="sidebar">
          <StepTable />
        </aside>
        <section class="diagram-area">
          <DiagramView />
        </section>
      </main>
      <footer class="footer"></footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import StepTable from './components/StepTable.vue'
import DiagramView from './components/DiagramView.vue'
import { useWorkflowStore } from './stores/workflow'

const store = useWorkflowStore()
onMounted(() => {
  store.loadSortSettings()
  store.fetchWorkflow()
})
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  font-family: 'Open Sans', 'Segoe UI', Arial, sans-serif;
  background: #f5f5f5;
}

.left-strip {
  width: 48px;
  min-width: 48px;
  background: #aa8800;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  position: relative;
}

.strip-icons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.strip-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.strip-icon:hover {
  background: rgba(255,255,255,0.08);
}

.strip-icon.active {
  background: rgba(255,255,255,0.12);
}

.strip-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 10px;
}

.yellow-line {
  width: 100%;
  height: 3px;
  background: #aa8800;
  margin-bottom: 10px;
}

.person-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(184, 134, 11, 0.15);
  cursor: pointer;
  transition: background 0.2s;
}

.person-btn:hover {
  background: rgba(184, 134, 11, 0.3);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 44px;
  background: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 25px;
  box-sizing: border-box;
  background: white;
}

.footer {
  height: 44px;
  background: #ffffff;
  border-top: none;
}

.sidebar {
  width: 625px;
  min-width: 625px;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}

.diagram-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}
</style>