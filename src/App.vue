<script setup>
import { ref } from 'vue'
import CalendarView from './components/CalendarView.vue'

const view = ref('dayGridMonth')
</script>

<template>
  <div class="app-container">
    <main class="calendar-wrapper">
      <CalendarView v-model:view="view" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #F0F0F7;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.calendar-wrapper {
  width: 100%;
  max-width: 1170px;
  height: 859px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

@media (max-width: 1200px) {
  .calendar-wrapper {
    max-width: 95vw;
    height: 80vh;
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }
  
  .calendar-wrapper {
    height: 90vh;
  }
}
</style>
