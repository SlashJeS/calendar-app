import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'calendar-events'

export const useEventsStore = defineStore('events', () => {
  // Load events from localStorage or initialize empty array
  const events = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

  // Watch for changes and persist to localStorage
  watch(events, (newEvents) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents))
  }, { deep: true })

  function addEvent(event) {
    const newEvent = {
      id: Date.now(),
      title: event.text.slice(0, 30),
      start: new Date(event.date),
      backgroundColor: event.color,
      borderColor: event.color,
      extendedProps: {
        text: event.text,
        time: event.time
      }
    }
    
    // Set time if provided
    if (event.time) {
      const [hours, minutes] = event.time.split(':')
      newEvent.start.setHours(parseInt(hours), parseInt(minutes))
    }
    
    events.value.push(newEvent)
    return newEvent
  }

  function updateEvent(id, updates) {
    const index = events.value.findIndex(event => event.id === id)
    if (index === -1) return null

    const updatedEvent = {
      ...events.value[index],
      ...updates,
      title: updates.text ? updates.text.slice(0, 30) : events.value[index].title,
      backgroundColor: updates.color || events.value[index].backgroundColor,
      borderColor: updates.color || events.value[index].borderColor,
      extendedProps: {
        ...events.value[index].extendedProps,
        text: updates.text || events.value[index].extendedProps.text,
        time: updates.time || events.value[index].extendedProps.time
      }
    }

    // Update time if provided
    if (updates.time) {
      const [hours, minutes] = updates.time.split(':')
      updatedEvent.start = new Date(updatedEvent.start)
      updatedEvent.start.setHours(parseInt(hours), parseInt(minutes))
    }

    events.value[index] = updatedEvent
    return updatedEvent
  }

  function deleteEvent(id) {
    events.value = events.value.filter(event => event.id !== id)
  }

  function getEventsForDate(date) {
    return events.value.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === date.toDateString()
    }).sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime()
    })
  }

  function getEventsForCalendar() {
    return events.value
  }

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForCalendar
  }
}) 