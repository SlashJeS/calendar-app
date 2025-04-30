import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useEventsStore = defineStore('events', () => {
  // Load events from localStorage on initialization
  const events = ref(JSON.parse(localStorage.getItem('calendarEvents') || '[]'))

  // Save events to localStorage whenever they change
  function saveEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(events.value))
  }

  // Add a new event
  function addEvent(event) {
    events.value.push({
      id: uuidv4(),
      title: event.title,
      start: event.start,
      color: event.color,
      notes: event.notes || '',
      allDay: false
    })
    saveEvents()
  }

  // Update an existing event
  function updateEvent(eventId, updatedEvent) {
    const index = events.value.findIndex(e => e.id === eventId)
    if (index !== -1) {
      events.value[index] = {
        ...events.value[index],
        title: updatedEvent.title,
        start: updatedEvent.start,
        color: updatedEvent.color,
        notes: updatedEvent.notes
      }
      saveEvents()
    }
  }

  // Delete an event
  function deleteEvent(eventId) {
    const newEvents = events.value.filter(e => e.id !== eventId)
    events.value = newEvents
    saveEvents()
  }

  // Get all events
  const getAllEvents = computed(() => events.value)

  // Get events for a specific date
  function getEventsForDate(date) {
    return events.value.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getAllEvents,
    getEventsForDate
  }
})
