<script setup>
import { ref, watch, nextTick } from 'vue'
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
    validator: v => ['dayGridMonth','timeGridWeek','timeGridDay','listWeek'].includes(v)
  }
})
const emit = defineEmits(['update:view'])

/* ───────────── refs ───────────── */
const dialogOpen     = ref(false)
const selectedEvent  = ref(null)
const selectedDate   = ref(null)
const clickedElement = ref(null)
const calendarRef    = ref(null)

const eventsStore = useEventsStore()

const currentView = ref(props.view)
const isToday = ref(false)
const currentDate = ref('')

/* ───────────── handlers ───────────── */
function openDialog(ev, date, el, time = null) {
  selectedEvent.value = ev
  selectedDate.value = new Date(date)
  clickedElement.value = el

  if (!ev && time) {
    nextTick(() => {
      const eventDialog = document.querySelector('.dialog')
      if (eventDialog) {
        const timeInput = eventDialog.querySelector('input[type="time"]')
        if (timeInput) {
          timeInput.value = time
        }
      }
    })
  }

  dialogOpen.value = true
}

function handleEventClick(info) {
  const eventData = {
    id: info.event.id,
    title: info.event.title,
    start: info.event.start,
    color: info.event.backgroundColor || info.event.color,
    notes: info.event.extendedProps?.notes || ''
  }

  const clickedElement = info.jsEvent.target.closest('.fc-event') || info.jsEvent.target
  openDialog(eventData, info.event.start, clickedElement)
}

function handleDateSelect(info) {
  const clickedDate = new Date(info.start)
  const formattedTime = clickedDate.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })

  const clickedElement = info.jsEvent.target.closest('.fc-timegrid-slot') ||
                        info.jsEvent.target.closest('.fc-daygrid-day') ||
                        info.jsEvent.target

  const selectedDate = new Date(clickedDate)
  openDialog(null, selectedDate, clickedElement, formattedTime)
}

function handleMoveResize(info) {
  const data = {
    title: info.event.title,
    start: info.event.start,
    color: info.event.backgroundColor || info.event.color,
    notes: info.event.extendedProps?.notes || ''
  }
  eventsStore.updateEvent(info.event.id, data)
}

function handleDelete() {
  if (!props.event?.id) return
  eventsStore.deleteEvent(props.event.id)
  emit('delete', props.event.id)
  close()

  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    const eventToRemove = calendarApi.getEventById(props.event.id)
    if (eventToRemove) {
      eventToRemove.remove()
    }
    calendarApi.render()
  }
}

function refreshEvents() { calendarRef.value?.getApi()?.refetchEvents() }

/* ─────────────  react to pinia changes ───────────── */
watch(() => eventsStore.events, (newEvents) => {
  const calendarApi = calendarRef.value?.getApi()
  if (calendarApi) {
    calendarApi.getEvents().forEach(event => event.remove())
    newEvents.forEach(event => {
      calendarApi.addEvent(event)
    })
    calendarApi.render()
  }
}, { deep: true })

/* ───────────── calendar options ───────────── */
function updateTodayState() {
  const calendarApi = calendarRef.value?.getApi()
  if (!calendarApi) return

  const currentDateObj = calendarApi.getDate()
  const today = new Date()
  
  // Reset time components to compare only dates
  currentDateObj.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  isToday.value = currentDateObj.getTime() === today.getTime()
}

function updateCurrentDate() {
  const calendarApi = calendarRef.value?.getApi()
  if (!calendarApi) return
  currentDate.value = calendarApi.getCurrentData()?.viewTitle || ''
}

const calendarOptions = {
  plugins:[dayGridPlugin,timeGridPlugin,interactionPlugin],
  initialView: props.view,
  headerToolbar: {
    left: '',
    center: '',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  buttonText:{ 
    prev:'Back', 
    next:'Next',
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day'
  },
  editable:true, 
  selectable:true, 
  selectMirror:true, 
  dayMaxEvents:true, 
  weekends:true,
  height:'100%', 
  contentHeight:'auto', 
  aspectRatio:1.35,
  eventDisplay:'block', 
  displayEventTime:true, 
  displayEventEnd:true,
  eventTimeFormat:{ hour:'2-digit', minute:'2-digit', hour12:false },
  slotMinTime: '00:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00',
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  allDaySlot: false,
  expandRows: true,
  selectOverlap: false,
  eventOverlap: false,
  selectConstraint: {
    startTime: '00:00',
    endTime: '24:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  },
  select: function(info) {
    const clickedDate = new Date(info.start)
    const formattedTime = '12:00'
    const clickedElement = info.jsEvent.target.closest('.fc-daygrid-day') || info.jsEvent.target
    openDialog(null, clickedDate, clickedElement, formattedTime)
  },
  dayCellDidMount: function(info) {
    info.el.addEventListener('click', function(e) {
      if (!e.target.closest('.fc-event')) {
        const date = info.date
        const formattedTime = '12:00'
        const clickedElement = info.el
        openDialog(null, date, clickedElement, formattedTime)
      }
    })
  },
  events: eventsStore.getAllEvents,
  eventClick: handleEventClick,
  eventDrop: handleMoveResize,
  eventResize: handleMoveResize,

  eventDidMount(info){
    const eventColor = info.event.backgroundColor || info.event.color
    info.el.style.backgroundColor = eventColor
  },
  eventContent(arg){
    const eventColor = arg.event.backgroundColor || arg.event.color
    return {
      html:`<div class="fc-event-title"
                style="background:${eventColor};color:#fff;padding:2px 4px;border-radius:3px;">
               ${arg.event.title}
             </div>`
    }
  },
  eventOrder: 'start',
  eventOrderStrict: true,
  datesSet: function() {
    updateTodayState()
    updateCurrentDate()
  },
  viewDidMount: function() {
    updateTodayState()
    updateCurrentDate()
  }
}

watch(() => props.view, (newView) => {
  currentView.value = newView
  nextTick(() => {
    updateTodayState()
    updateCurrentDate()
  })
})

// Watch for calendar initialization
watch(() => calendarRef.value?.getApi(), (api) => {
  if (api) {
    updateTodayState()
    updateCurrentDate()
  }
}, { immediate: true })
</script>

<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <div class="header-top">
        <div class="header-title">Calendar View</div>
        <div class="view-buttons">
          <button 
            v-for="view in ['dayGridMonth', 'timeGridWeek', 'timeGridDay']" 
            :key="view"
            :class="{ active: currentView === view }"
            @click="calendarRef?.getApi()?.changeView(view); currentView = view"
          >
            {{ view === 'dayGridMonth' ? 'Month' : view === 'timeGridWeek' ? 'Week' : 'Day' }}
          </button>
        </div>
      </div>
      <div class="header-bottom">
        <div class="navigation-buttons">
          <button 
            class="today-button" 
            :class="{ active: isToday }"
            @click="calendarRef?.getApi()?.today()"
          >Today</button>
          <button 
            class="prev-button" 
            @click="calendarRef?.getApi()?.prev()"
          >Back</button>
          <button 
            class="next-button" 
            @click="calendarRef?.getApi()?.next()"
          >Next</button>
        </div>
        <div class="current-date">
          {{ currentDate }}
        </div>
      </div>
    </div>
    <FullCalendar ref="calendarRef" :options="calendarOptions" />

    <EventDialog
      v-model="dialogOpen"
      :event="selectedEvent"
      :date="selectedDate"
      :clicked-element="clickedElement"
      @save="selectedEvent ? refreshEvents() : refreshEvents()"
      @delete="handleDelete"
    />
  </div>
</template>


<style scoped>
.calendar-container {
  width: 100%;
  height: 100%;
  padding: 1.5rem;
}

.calendar-header {
  margin-bottom: 1.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-title {
  font-size: 18px;
  color: #4D4F5C;
}

.view-buttons {
  display: flex;
  border: 1px solid #D7DAE2;
  border-radius: 4px;
  overflow: hidden;
  height: 32px;
}

.view-buttons button {
  padding: 0 1rem;
  background: transparent;
  border: none;
  border-right: 1px solid #D7DAE2;
  font: normal normal normal 13px/20px Source Sans Pro;
  color: #4D4F5C;
  cursor: pointer;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-buttons button:last-child {
  border-right: none;
}

.view-buttons button.active {
  color: #3B86FF;
  font-weight: 600;
  background-color: transparent;
}

.view-buttons button:hover {
  color: #3B86FF;
}

.header-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.navigation-buttons {
  display: flex;
  border: 1px solid #D7DAE2;
  border-radius: 4px;
  overflow: hidden;
  height: 32px;
  position: absolute;
  left: 0;
}

.today-button,
.prev-button,
.next-button {
  padding: 0 1rem;
  background: transparent;
  border: none;
  border-right: 1px solid #D7DAE2;
  font: normal normal normal 13px/20px Source Sans Pro;
  color: #4D4F5C;
  cursor: pointer;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.today-button:last-child,
.prev-button:last-child,
.next-button:last-child {
  border-right: none;
}

.today-button:hover,
.prev-button:hover,
.next-button:hover {
  color: #3B86FF;
}

.today-button.active {
  color: #3B86FF;
  font-weight: 600;
  background-color: transparent;
}

.current-date {
  font: normal normal normal 18px/24px Source Sans Pro;
  color: #A3A6B4;
  text-align: center;
}

:deep(.fc-toolbar) {
  display: none !important;
}

:deep(.fc) {
  height: 100%;
}

:deep(.fc-toolbar) {
  margin-bottom: 1.5rem !important;
  background-color: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
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
  color: #A3A6B4;
}

:deep(.fc-button-group) {
  display: none !important;
}

:deep(.fc-event) {
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  border: none;
  pointer-events: auto;
}

:deep(.fc-event-title) {
  font-weight: 500;
  padding: 0.25rem;
}

:deep(.fc-col-header) {
  background-color: #F5F6FA;
  border: none;
  border-bottom: 1px solid #EAF0F4;
}

:deep(.fc-col-header-cell) {
  padding: 0.5rem;
  border: none;
}

:deep(.fc-col-header-cell-cushion) {
  font: normal normal normal 11px/20px Source Sans Pro;
  color: #A3A6B4;
  text-decoration: none;
}

:deep(.fc-daygrid-day) {
  background-color: #FFFFFF;
  border: none;
  border-right: 1px solid #EAF0F4;
  border-bottom: 1px solid #EAF0F4;
  min-height: 100px;
  cursor: pointer;
  position: relative;
}

:deep(.fc-daygrid-day:last-child) {
  border-right: none;
}

:deep(.fc-daygrid-body tr:last-child .fc-daygrid-day) {
  border-bottom: none;
}

:deep(.fc-daygrid-day-frame) {
  height: 100%;
  min-height: 100px;
  pointer-events: none;
}

:deep(.fc-daygrid-day-events) {
  position: relative;
  z-index: 1;
  pointer-events: none;
}

:deep(.fc-daygrid-day-bg) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: auto;
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

:deep(.fc-scrollgrid) {
  border: 1px solid #EAF0F4;
}

:deep(.fc-scrollgrid-section > *) {
  border: none;
}

:deep(.fc-scrollgrid-section-header > *) {
  border: none;
}

:deep(.fc-scrollgrid-section-body > *) {
  border: none;
}

:deep(.fc-scrollgrid-section-footer > *) {
  border: none;
}

:deep(.fc-daygrid-day:hover) {
  background-color: #F5F6FA;
}

:deep(.fc-day-today) {
  background-color: #F5F6FA !important;
}

:deep(.fc-day-past) {
  background-color: #FFFFFF;
}

:deep(.fc-day-future) {
  background-color: #FFFFFF;
}

:deep(.fc-daygrid-day-number) {
  padding: 0.5rem;
  font: normal normal normal 15px/20px Source Sans Pro;
  color: #43425D;
  pointer-events: none;
}

:deep(.fc-daygrid-day-events) {
  margin-top: 0.25rem;
}

:deep(.fc-daygrid-bg-harness) {
  box-shadow: 0px 3px 6px #00000029;
  background-color: #FFFFFF;
}
:deep(.fc-highlight) {
  box-shadow: 0px 3px 6px #00000029;
  background-color: #FFFFFF;
}

:deep(.clickable-day-cell) {
  cursor: pointer;
}
</style>
