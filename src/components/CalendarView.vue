<script setup>
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useEventsStore } from '../stores/events'
import EventDialog from './EventDialog.vue'

const props = defineProps({
  view: {
    type: String,
    default: 'dayGridMonth',
    validator: value => ['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek'].includes(value)
  }
})

const emit = defineEmits(['update:view'])

const eventsStore = useEventsStore()
const calendarRef = ref(null)
const dialogOpen = ref(false)
const selectedEvent = ref(null)
const selectedDate = ref(null)
const clickedElement = ref(null)

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: props.view,
  headerToolbar: {
    left: 'today,prev,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  buttonText: {
    prev: 'Back',
    next: 'Next'
  },
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  height: '100%',
  contentHeight: 'auto',
  aspectRatio: 1.35,
  events: eventsStore.getEventsForCalendar(),
  eventClick: handleEventClick,
  select: handleDateSelect,
  eventDrop: handleEventDrop,
  eventResize: handleEventResize
}

function handleEventClick(info) {
  selectedEvent.value = {
    id: info.event.id,
    text: info.event.extendedProps.text,
    time: info.event.extendedProps.time,
    color: info.event.backgroundColor,
    date: info.event.start
  }
  clickedElement.value = info.jsEvent.target
  dialogOpen.value = true
}

function handleDateSelect(selectInfo) {
  selectedDate.value = selectInfo.start
  selectedEvent.value = null
  clickedElement.value = selectInfo.jsEvent.target
  dialogOpen.value = true
}

function handleEventDrop(dropInfo) {
  const event = eventsStore.events.value.find(e => e.id === dropInfo.event.id)
  if (event) {
    eventsStore.updateEvent(event.id, {
      start: dropInfo.event.start,
      end: dropInfo.event.end
    })
  }
}

function handleEventResize(resizeInfo) {
  const event = eventsStore.events.value.find(e => e.id === resizeInfo.event.id)
  if (event) {
    eventsStore.updateEvent(event.id, {
      start: resizeInfo.event.start,
      end: resizeInfo.event.end
    })
  }
}

function handleNewEvent(eventData) {
  const newEvent = eventsStore.addEvent(eventData)
  if (calendarRef.value) {
    calendarRef.value.getApi().addEvent(newEvent)
  }
  dialogOpen.value = false
}

function handleEditEvent(eventData) {
  const updatedEvent = eventsStore.updateEvent(eventData.id, eventData)
  if (calendarRef.value && updatedEvent) {
    const calendarApi = calendarRef.value.getApi()
    const event = calendarApi.getEventById(eventData.id)
    if (event) {
      event.setProp('title', updatedEvent.title)
      event.setProp('backgroundColor', updatedEvent.backgroundColor)
      event.setProp('borderColor', updatedEvent.borderColor)
      event.setStart(updatedEvent.start)
    }
  }
  dialogOpen.value = false
}

function handleDeleteEvent(id) {
  eventsStore.deleteEvent(id)
  if (calendarRef.value) {
    const event = calendarRef.value.getApi().getEventById(id)
    if (event) {
      event.remove()
    }
  }
  dialogOpen.value = false
}

onMounted(() => {
  if (calendarRef.value) {
    calendarRef.value.getApi().setOption('events', eventsStore.getEventsForCalendar())
  }
})
</script>

<template>
  <div class="calendar-container">
    <FullCalendar
      ref="calendarRef"
      :options="calendarOptions"
    />
    
    <EventDialog
      v-model="dialogOpen"
      :event="selectedEvent"
      :date="selectedDate"
      :clicked-element="clickedElement"
      @save="selectedEvent ? handleEditEvent : handleNewEvent"
      @delete="handleDeleteEvent"
    />
  </div>
</template>

<style scoped>
.calendar-container {
  width: 100%;
  height: 100%;
  padding: 1.5rem;
}

:deep(.fc) {
  height: 100%;
}

:deep(.fc-toolbar) {
  margin-bottom: 1.5rem !important;
}

:deep(.fc-toolbar-chunk) {
  display: flex;
  align-items: center;
}

:deep(.fc-toolbar-chunk:first-child) {
  display: flex;
  align-items: center;
  border: 1px solid #D7DAE2;
  border-radius: 4px;
  overflow: hidden;
  height: 32px;
}

:deep(.fc-toolbar-chunk:first-child .fc-button-group) {
  display: flex;
  border: none !important;
  margin: 0 !important;
}

:deep(.fc-toolbar-chunk:first-child .fc-button:not(:last-child)) {
  border-right: 1px solid #D7DAE2 !important;
}

:deep(.fc-today-button),
:deep(.fc-prev-button),
:deep(.fc-next-button) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  font: normal normal normal 13px/20px Source Sans Pro !important;
  color: #4D4F5C !important;
  box-shadow: none !important;
  height: 32px !important;
  width: 66px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative;
  margin: 0 !important;
}

:deep(.fc-today-button.fc-button-active),
:deep(.fc-today-button:not(.fc-button-active)[disabled]) {
  font-weight: 600 !important;
  color: #3B86FF !important;
}

:deep(.fc-today-button:hover),
:deep(.fc-prev-button:hover),
:deep(.fc-next-button:hover) {
  color: #3B86FF !important;
}

:deep(.fc-today-button:focus),
:deep(.fc-prev-button:focus),
:deep(.fc-next-button:focus) {
  box-shadow: none !important;
}

:deep(.fc-toolbar-title) {
  font: normal normal normal 18px/24px Source Sans Pro;
  color: #4D4F5C;
}

:deep(.fc-button-group) {
  display: flex;
  border: 1px solid #D7DAE2 !important;
  border-radius: 4px;
  box-shadow: none !important;
  overflow: hidden;
}

:deep(.fc-button) {
  background: transparent !important;
  border: none;
  border-right: 1px solid #D7DAE2 !important;
  padding: 0.5rem 1rem;
  font: normal normal normal 13px/20px Source Sans Pro;
  color: #4D4F5C;
  text-transform: capitalize;
  height: auto;
  margin: 0;
  border-radius: 0;
  box-shadow: none !important;
}

:deep(.fc-button:hover) {
  color: #3B86FF !important;
}

:deep(.fc-button:last-child) {
  border-right: none !important;
}

:deep(.fc-button-active) {
  background: transparent !important;
  color: #3B86FF !important;
  font-weight: 600;
  border-color: #D7DAE2 !important;
  box-shadow: none !important;
}

:deep(.fc-button:focus) {
  box-shadow: none !important;
  border-color: #D7DAE2 !important;
  background: transparent !important;
  color: #3B86FF !important;
}

:deep(.fc-event) {
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  border: none;
}

:deep(.fc-event-title) {
  font-weight: 500;
  padding: 0.25rem;
}

:deep(.fc-daygrid-day) {
  min-height: 100px;
}

:deep(.fc-day-today) {
  background-color: rgba(var(--primary-color-rgb), 0.05) !important;
}

:deep(.fc-day-past) {
  background-color: var(--background-light);
}

:deep(.fc-day-future) {
  background-color: white;
}

:deep(.fc-daygrid-day-number) {
  padding: 0.5rem;
  font-weight: 500;
}

:deep(.fc-daygrid-day-events) {
  margin-top: 0.25rem;
}

:deep(.fc-timegrid-slot) {
  height: 2.5rem;
}

:deep(.fc-timegrid-now-indicator-line) {
  border-color: var(--primary-color);
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-color: var(--primary-color);
}
</style> 