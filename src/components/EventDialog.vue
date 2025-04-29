<script setup>
import { ref, computed } from 'vue'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'

const props = defineProps({
  modelValue: Boolean,
  event: Object,
  date: Date,
  clickedElement: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const text = ref(props.event?.text || '')
const time = ref(props.event?.time || '12:00')
const color = ref(props.event?.color || '#4CAF50')

const isEditing = computed(() => !!props.event)

const title = computed(() => isEditing.value ? 'Edit Event' : 'Create Event')
const formattedDate = computed(() => {
  if (!props.date) return ''
  return props.date.toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Calculate dialog position
const dialogStyle = computed(() => {
  if (!props.clickedElement) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const rect = props.clickedElement.getBoundingClientRect()
  const windowHeight = window.innerHeight - 150
  const dialogHeight = 300 

  let top = rect.bottom - 10
  let triangleClass = 'triangle-top'
  if (rect.bottom + dialogHeight > windowHeight) {
    top = rect.top - dialogHeight - 250
    triangleClass = 'triangle-bottom'
  }

  return {
    top: `${top}px`,
    left: `${rect.left + rect.width / 2 - 150}px`
  }
})

const triangleClass = computed(() => {
  if (!props.clickedElement) return ''
  const rect = props.clickedElement.getBoundingClientRect()
  const windowHeight = window.innerHeight - 150
  const dialogHeight = 300
  return rect.bottom + dialogHeight > windowHeight ? 'triangle-bottom' : 'triangle-top'
})

function handleSave() {
  if (!text.value.trim()) {
    alert('Please enter event text')
    return
  }
  
  emit('save', {
    id: props.event?.id,
    text: text.value,
    time: time.value,
    color: color.value,
    date: props.date
  })
  resetForm()
}

function handleDelete() {
  if (confirm('Are you sure you want to delete this event?')) {
    emit('delete', props.event.id)
    resetForm()
  }
}

function resetForm() {
  text.value = ''
  time.value = '12:00'
  color.value = '#4CAF50'
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="dialog-overlay" @click="resetForm">
    <div class="dialog" :style="dialogStyle" @click.stop>
      <div class="triangle" :class="triangleClass"></div>
      <div class="dialog-header">
        <h2>{{ title }}</h2>
        <button class="close-button" @click="resetForm">
          <span class="close-icon">×</span>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="form-group">
          <label>Event Name</label>
          <input
            v-model="text"
            type="text"
            maxlength="30"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label>Event Date</label>
          <div class="input-with-icon">
            <input
              :value="formattedDate"
              type="text"
              readonly
              class="form-input"
            />
            <span class="icon calendar-icon">📅</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>Event Time</label>
          <div class="input-with-icon">
            <input
              v-model="time"
              type="time"
              class="form-input"
            />
            <span class="icon time-icon">🕒</span>
          </div>
        </div>
        
        <div class="form-group">
          <label>Notes</label>
          <input
            v-model="text"
            class="form-input"
          />
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="cancel-button" @click="resetForm">Cancel</button>
        <button class="save-button" @click="handleSave">Save</button>
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

textarea.form-input {
  resize: none;
  min-height: 60px;
}
</style> 