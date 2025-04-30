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
  padding: 1rem;
  box-sizing: border-box;
}

.calendar-wrapper {
  width: 67%;
  min-height: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1200px) {
  .calendar-wrapper {
    width: 85%;
  }
}

@media (max-width: 768px) {
  .calendar-wrapper {
    width: 95%;
  }
  .app-container {
    padding: 0.5rem;
  }
}
</style>
