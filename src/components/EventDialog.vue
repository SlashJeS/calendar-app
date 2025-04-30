<script setup>
import { ref, computed, watch } from 'vue'
import { useEventsStore } from '../stores/events'

const props = defineProps({
  modelValue: Boolean,
  event: { type: Object, default: null },
  date: Date,
  clickedElement: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'save', 'delete', 'refresh'])

/* ───────────── state ───────────── */
const eventsStore = useEventsStore()
const text   = ref('')
const time   = ref('12:00')
const color  = ref('#3B86FF')
const notes  = ref('')
const colorInput = ref(null)
const showColorPicker = ref(false)
const isTitleValid = ref(true)
const selectedDate = ref(null)
const showValidationError = ref(false)

/* ───────────── helpers ───────────── */
const isEditing = computed(() => !!props.event)
const title     = computed(() => (isEditing.value ? 'Edit Event' : 'Create Event'))
const formattedDate = computed(() =>
  selectedDate.value
    ? selectedDate.value.toLocaleDateString('default', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : props.date
      ? props.date.toLocaleDateString('default', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
      : ''
)

/* dialog position */
const dialogStyle = computed(() => {
  if (!props.clickedElement) return { top:'50%', left:'50%', transform:'translate(-50%, -50%)' }
  const rect  = props.clickedElement.getBoundingClientRect()
  const vh    = window.innerHeight
  const dH    = 470
  const fitsBelow = rect.bottom + dH <= vh
  return {
    top : `${fitsBelow ? rect.bottom - 10 : rect.top - dH - rect.height}px`,
    left: `${rect.left + rect.width / 2 - 150}px`
  }
})
const triangleClass = computed(() => {
  if (!props.clickedElement) return ''
  const rect = props.clickedElement.getBoundingClientRect()
  return rect.bottom + 470 > window.innerHeight ? 'triangle-bottom' : 'triangle-top'
})

/* ───────────── watches ───────────── */
watch(() => props.event, ev => {
  if (!ev) {
    resetFields()
    return
  }
  
  // Only update fields if we're editing an existing event
  text.value = ev.title || ''
  time.value = new Date(ev.start).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
  color.value = ev.extendedProps?.color || ev.color || '#3B86FF'
  if (colorInput.value) {
    colorInput.value.value = color.value
  }
  notes.value = ev.extendedProps?.notes || ev.notes || ''
}, { immediate: true })

watch(() => props.date, d => {
  if (d && !props.event) {
    // For new events, always use the provided date
    const selectedDate = new Date(d)
    time.value = selectedDate.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}, { immediate: true })

/* ───────────── actions ───────────── */
function resetFields() {
  text.value = ''
  time.value = '12:00'
  color.value = '#3B86FF'
  if (colorInput.value) {
    colorInput.value.value = '#3B86FF'
  }
  notes.value = ''
}
function close() { emit('update:modelValue', false) }

function validateTitle() {
  isTitleValid.value = text.value.trim().length > 0
  return isTitleValid.value
}

function updateSelectedDate(event) {
  const newDate = new Date(event.target.value)
  newDate.setHours(selectedDate.value?.getHours() || 0)
  newDate.setMinutes(selectedDate.value?.getMinutes() || 0)
  selectedDate.value = newDate
}

function handleSave() {
  showValidationError.value = true
  if (!validateTitle()) {
    return
  }

  const [h, m] = time.value.split(':')
  const when = selectedDate.value || new Date(props.date)
  when.setHours(parseInt(h), parseInt(m), 0, 0)
  
  const finalColor = color.value.startsWith('#') ? color.value : `#${color.value}`
  
  const data = {
    title: text.value.trim(),
    start: when,
    color: finalColor,
    notes: notes.value.trim(),
    backgroundColor: finalColor,
    borderColor: finalColor
  }

  try {
    if (isEditing.value) {
      eventsStore.updateEvent(props.event.id, data)
    } else {
      eventsStore.addEvent(data)
    }
    emit('save', data)
    close()
  } catch (error) {
    console.error('Error saving event:', error)
  }
}

function handleDelete() {
  if (!props.event?.id) return
  eventsStore.deleteEvent(props.event.id)
  emit('delete', props.event.id); close()
}

function toggleColorPicker() {
  showColorPicker.value = !showColorPicker.value
}

function updateColor(event) {
  const newColor = event.target.value
  color.value = newColor
  // Update the color preview immediately
  const colorPreview = document.querySelector('.color-preview')
  if (colorPreview) {
    colorPreview.style.backgroundColor = newColor
  }
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    showValidationError.value = false
    isTitleValid.value = true
  }
})

// Initialize selected date
watch(() => props.date, (newDate) => {
  if (newDate) {
    selectedDate.value = new Date(newDate)
  }
}, { immediate: true })
</script>

<template>
  <div v-if="modelValue" class="dialog-overlay" @click="close">
    <div class="dialog" :style="dialogStyle" @click.stop>
      <div class="triangle" :class="triangleClass"></div>

      <!-- header -->
      <div class="dialog-header">
        <h2>{{ title }}</h2>
        <button class="close-button" @click="close"><span class="close-icon">×</span></button>
      </div>

      <!-- body -->
      <div class="dialog-content">
        <div class="form-group">
          <label>Event Name</label>
          <input 
            v-model="text" 
            type="text" 
            maxlength="30" 
            class="form-input" 
            :class="{ 'invalid': !isTitleValid && showValidationError }"
          />
          <div v-if="!isTitleValid && showValidationError" class="error-message">Event name is required</div>
        </div>

        <div class="form-group">
          <label>Event Date</label>
          <div class="input-with-icon">
            <input 
              type="date" 
              class="form-input"
              :value="selectedDate ? selectedDate.toISOString().split('T')[0] : ''"
              @input="updateSelectedDate"
            />
            <span class="icon">📅</span>
          </div>
        </div>

        <div class="form-group">
          <label>Event Time</label>
          <div class="input-with-icon">
            <input v-model="time" type="time" class="form-input" />
            <span class="icon">🕒</span>
          </div>
        </div>

        <div class="form-group">
          <label>Color</label>
          <div class="color-picker-container">
            <div
              class="color-preview"
              :style="{ backgroundColor: color }"
              @click="() => colorInput?.click()"
            ></div>
            <input
              ref="colorInput"
              v-model="color"
              type="color"
              class="color-input"
              @input="updateColor"
              @change="updateColor"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <input v-model="notes" class="form-input" maxlength="30" />
        </div>
      </div>

      <!-- footer -->
      <div class="dialog-actions">
        <button v-if="isEditing" class="delete-button" @click="handleDelete">Delete</button>
        <button class="cancel-button" @click="close">{{ isEditing ? 'Discard' : 'Cancel' }}</button>
        <button class="save-button"   @click="handleSave">{{ isEditing ? 'Edit' : 'Save' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.dialog {
  position: absolute;
  background: #FFFFFF;
  box-shadow: 0px 3px 18px #00000029;
  border: 1px solid #43425D;
  border-radius: 10px;
  width: 300px;
  z-index: 1001;
}

.triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  left: 50%;
  transform: translateX(-50%);
}

.triangle-top {
  top: -10px;
  border-bottom: 10px solid #43425D;
}

.triangle-bottom {
  bottom: -10px;
  border-top: 10px solid #43425D;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
}

.dialog-header h2 {
  font: normal normal normal 12px/25px Source Sans Pro;
  letter-spacing: 0px;
  color: #D6D6D6;
  margin: 0;
}

.close-button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F0F0F7;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-icon {
  font-size: 16px;
  color: #43425D;
}

.dialog-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  text-align: left;
  font: normal normal normal 9px/20px Source Sans Pro;
  letter-spacing: 0px;
  color: #D6D6D6;
  margin-bottom: -10px;
}

.form-input {
  width: 100%;
  padding: 8px 0;
  border: none;
  border-bottom: 1px solid #D6D6D6;
  font: normal normal normal 12px/20px Source Sans Pro;
  color: #43425D;
  background: transparent;
}

.form-input:focus {
  outline: none;
  border-bottom-color: #43425D;
}

.input-with-icon {
  position: relative;
}

.input-with-icon .icon {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #D6D6D6;
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  padding: 0 40px 20px 40px;
  gap: 10px;
}

.delete-button {
  text-align: right;
  font: normal normal normal 12px/20px Source Sans Pro;
  letter-spacing: 0px;
  color: #FF5F5F;
  background: none;
  border: none;
  cursor: pointer;
  margin-right: auto;
}

.cancel-button {
  text-align: right;
  font: normal normal normal 12px/20px Source Sans Pro;
  letter-spacing: 0px;
  color: #FF5F5F;
  background: none;
  border: none;
  cursor: pointer;
}

.save-button {
  text-align: right;
  font: normal normal normal 12px/25px Source Sans Pro;
  letter-spacing: 0px;
  color: #6A6996;
  background: none;
  border: none;
  cursor: pointer;
}

.save-button:hover,
.cancel-button:hover,
.delete-button:hover {
  opacity: 0.8;
}

textarea.form-input {
  resize: none;
  min-height: 60px;
}

.color-picker-container {
  position: relative;
  display: flex;
  margin-top: 10px;
  align-items: center;
  gap: 10px;
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #D6D6D6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-preview:hover {
  transform: scale(1.05);
}

.color-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.form-input.invalid {
  border-bottom-color: #FF5F5F !important;
}

.error-message {
  color: #FF5F5F;
  font-size: 11px;
  margin-top: 4px;
  font-family: 'Source Sans Pro', sans-serif;
}

input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  border: none;
  border-bottom: 1px solid #D6D6D6;
  padding: 8px 0;
  font: normal normal normal 12px/20px Source Sans Pro;
  color: #43425D;
  width: 100%;
}

input[type="date"]:focus {
  outline: none;
  border-bottom-color: #43425D;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>
