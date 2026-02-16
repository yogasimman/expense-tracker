<template>
  <div>
    <PageHeader title="New Trip" icon="bi bi-briefcase" subtitle="Create a new trip request" />

    <div class="trip-container">
      <form @submit.prevent="submit">
        <!-- Trip Name -->
        <div class="form-group">
          <label class="form-label">Trip Name *</label>
          <input v-model="form.tripName" type="text" class="form-input" placeholder="eg: Trip to New York" required />
        </div>

        <!-- Admin: Select Users -->
        <div v-if="auth.isAdmin" class="form-group">
          <label class="form-label">Select Users</label>
          <select v-model="form.selectedUsers" multiple class="form-select user-select">
            <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} ({{ u.email }})</option>
          </select>
          <span class="form-hint">Hold Ctrl/Cmd to select multiple users.</span>
        </div>

        <!-- Travel Type -->
        <div class="form-group">
          <label class="form-label">Travel Type *</label>
          <div class="travel-type-options">
            <label class="travel-type-radio" :class="{ active: form.travelType === 'local' }">
              <input type="radio" v-model="form.travelType" value="local" @change="handleTravelTypeChange" />
              <span class="radio-label">Local</span>
              <span class="radio-desc">You are creating this request for a trip within your company locality.</span>
            </label>
            <label class="travel-type-radio" :class="{ active: form.travelType === 'domestic' }">
              <input type="radio" v-model="form.travelType" value="domestic" @change="handleTravelTypeChange" />
              <span class="radio-label">Domestic</span>
              <span class="radio-desc">You are creating this request for a trip within your home country.</span>
            </label>
            <label class="travel-type-radio" :class="{ active: form.travelType === 'international' }">
              <input type="radio" v-model="form.travelType" value="international" @change="handleTravelTypeChange" />
              <span class="radio-label">International</span>
              <span class="radio-desc">You are creating this request for a trip outside your home country.</span>
            </label>
          </div>
        </div>

        <!-- TRIP ITINERARY -->
        <div class="itinerary-header">TRIP ITINERARY</div>
        <div class="itinerary-form">

          <!-- Flight Section -->
          <div class="transport-option" :class="{ disabled: form.travelType === 'local' }">
            <button type="button" class="toggle-btn" @click="toggleSection('flights')" :disabled="form.travelType === 'local'">
              {{ openSections.flights ? '−' : '+' }}
            </button>
            <i class="bi bi-airplane transport-icon"></i>
            <span>Flight</span>
          </div>
          <Transition :css="false" @enter="onExpand" @after-enter="afterExpand" @leave="onCollapse" @after-leave="afterCollapse">
          <div v-if="openSections.flights && form.travelType !== 'local'" class="transport-section">
            <div v-for="(f, i) in form.itinerary.flights" :key="'f'+i" class="transport-entry">
              <div class="entry-grid">
                <div class="form-group">
                  <label class="form-label form-label-sm">Depart From *</label>
                  <input v-model="f.departFrom" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Arrive At *</label>
                  <input v-model="f.arriveAt" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Departure Date *</label>
                  <input v-model="f.departureDate" type="date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Return Date *</label>
                  <input v-model="f.returnDate" type="date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Description</label>
                  <input v-model="f.description" class="form-input" placeholder="Description" />
                </div>
              </div>
              <button v-if="i > 0" type="button" class="remove-entry-btn" @click="removeRow('flights', i)">
                <i class="bi bi-dash-lg"></i>
              </button>
            </div>
            <button type="button" class="btn btn-outline btn-sm add-entry-btn" @click="addRow('flights')">
              + Add Another Flight
            </button>
          </div>
          </Transition>

          <!-- Bus Section -->
          <div class="transport-option" :class="{ disabled: form.travelType === 'local' }">
            <button type="button" class="toggle-btn" @click="toggleSection('buses')" :disabled="form.travelType === 'local'">
              {{ openSections.buses ? '−' : '+' }}
            </button>
            <i class="bi bi-bus-front transport-icon"></i>
            <span>Bus</span>
          </div>
          <Transition :css="false" @enter="onExpand" @after-enter="afterExpand" @leave="onCollapse" @after-leave="afterCollapse">
          <div v-if="openSections.buses && form.travelType !== 'local'" class="transport-section">
            <div v-for="(b, i) in form.itinerary.buses" :key="'b'+i" class="transport-entry">
              <div class="entry-grid entry-grid-4">
                <div class="form-group">
                  <label class="form-label form-label-sm">Depart From *</label>
                  <input v-model="b.departFrom" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Arrive At *</label>
                  <input v-model="b.arriveAt" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Departure Date *</label>
                  <input v-model="b.departureDate" type="date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Description</label>
                  <input v-model="b.description" class="form-input" placeholder="Description" />
                </div>
              </div>
              <button v-if="i > 0" type="button" class="remove-entry-btn" @click="removeRow('buses', i)">
                <i class="bi bi-dash-lg"></i>
              </button>
            </div>
            <button type="button" class="btn btn-outline btn-sm add-entry-btn" @click="addRow('buses')">
              + Add Another Bus
            </button>
          </div>
          </Transition>

          <!-- Train Section -->
          <div class="transport-option" :class="{ disabled: form.travelType === 'local' }">
            <button type="button" class="toggle-btn" @click="toggleSection('trains')" :disabled="form.travelType === 'local'">
              {{ openSections.trains ? '−' : '+' }}
            </button>
            <i class="bi bi-train-front transport-icon"></i>
            <span>Train</span>
          </div>
          <Transition :css="false" @enter="onExpand" @after-enter="afterExpand" @leave="onCollapse" @after-leave="afterCollapse">
          <div v-if="openSections.trains && form.travelType !== 'local'" class="transport-section">
            <div v-for="(t, i) in form.itinerary.trains" :key="'t'+i" class="transport-entry">
              <div class="entry-grid entry-grid-4">
                <div class="form-group">
                  <label class="form-label form-label-sm">Depart From *</label>
                  <input v-model="t.departFrom" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Arrive At *</label>
                  <input v-model="t.arriveAt" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Departure Date *</label>
                  <input v-model="t.departureDate" type="date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Description</label>
                  <input v-model="t.description" class="form-input" placeholder="Description" />
                </div>
              </div>
              <button v-if="i > 0" type="button" class="remove-entry-btn" @click="removeRow('trains', i)">
                <i class="bi bi-dash-lg"></i>
              </button>
            </div>
            <button type="button" class="btn btn-outline btn-sm add-entry-btn" @click="addRow('trains')">
              + Add Another Train
            </button>
          </div>
          </Transition>

          <!-- Cab Section (always available) -->
          <div class="transport-option">
            <button type="button" class="toggle-btn" @click="toggleSection('cabs')">
              {{ openSections.cabs ? '−' : '+' }}
            </button>
            <i class="bi bi-taxi-front transport-icon"></i>
            <span>Cab</span>
          </div>
          <Transition :css="false" @enter="onExpand" @after-enter="afterExpand" @leave="onCollapse" @after-leave="afterCollapse">
          <div v-if="openSections.cabs" class="transport-section">
            <div v-for="(c, i) in form.itinerary.cabs" :key="'c'+i" class="transport-entry">
              <div class="entry-grid entry-grid-4">
                <div class="form-group">
                  <label class="form-label form-label-sm">Pick-up Location *</label>
                  <input v-model="c.pickUpLocation" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Drop-off Location *</label>
                  <input v-model="c.dropOffLocation" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Pick-up Date *</label>
                  <input v-model="c.pickUpDate" type="date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label form-label-sm">Description</label>
                  <input v-model="c.description" class="form-input" placeholder="Description" />
                </div>
              </div>
              <button v-if="i > 0" type="button" class="remove-entry-btn" @click="removeRow('cabs', i)">
                <i class="bi bi-dash-lg"></i>
              </button>
            </div>
            <button type="button" class="btn btn-outline btn-sm add-entry-btn" @click="addRow('cabs')">
              + Add Another Cab
            </button>
          </div>
          </Transition>

          <p v-if="resultMsg" class="result-msg">{{ resultMsg }}</p>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <router-link to="/app/trips" class="btn btn-outline">Cancel</router-link>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="spinner" style="width:16px;height:16px;border-width:2px"></span>
            {{ submitting ? 'Saving…' : 'Save and Submit' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { api } from '@/api'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const tripStore = useTripsStore()
const auth = useAuthStore()
const toast = useToast()
const submitting = ref(false)
const resultMsg = ref('')
const users = ref([])

const openSections = reactive({
  flights: false,
  buses: false,
  trains: false,
  cabs: false
})

const form = reactive({
  tripName: '',
  travelType: 'domestic',
  selectedUsers: [],
  itinerary: {
    flights: [{ departFrom: '', arriveAt: '', departureDate: '', returnDate: '', description: '' }],
    buses: [{ departFrom: '', arriveAt: '', departureDate: '', description: '' }],
    trains: [{ departFrom: '', arriveAt: '', departureDate: '', description: '' }],
    cabs: [{ pickUpLocation: '', dropOffLocation: '', pickUpDate: '', description: '' }]
  }
})

function toggleSection(section) {
  openSections[section] = !openSections[section]
}

function handleTravelTypeChange() {
  if (form.travelType === 'local') {
    openSections.flights = false
    openSections.buses = false
    openSections.trains = false
  }
}

function addRow(type) {
  const templates = {
    flights: { departFrom: '', arriveAt: '', departureDate: '', returnDate: '', description: '' },
    buses: { departFrom: '', arriveAt: '', departureDate: '', description: '' },
    trains: { departFrom: '', arriveAt: '', departureDate: '', description: '' },
    cabs: { pickUpLocation: '', dropOffLocation: '', pickUpDate: '', description: '' }
  }
  form.itinerary[type].push({ ...templates[type] })
}

function removeRow(type, index) {
  form.itinerary[type].splice(index, 1)
}

// Expand/collapse animation hooks (jQuery slideDown/Up style)
function onExpand(el, done) {
  el.style.overflow = 'hidden'
  el.style.maxHeight = '0'
  el.offsetHeight // force reflow
  el.style.transition = 'max-height 0.35s ease'
  el.style.maxHeight = el.scrollHeight + 'px'
  setTimeout(done, 350)
}
function afterExpand(el) {
  el.style.maxHeight = 'none'
  el.style.overflow = ''
  el.style.transition = ''
}
function onCollapse(el, done) {
  el.style.overflow = 'hidden'
  el.style.maxHeight = el.scrollHeight + 'px'
  el.offsetHeight
  el.style.transition = 'max-height 0.3s ease'
  el.style.maxHeight = '0'
  setTimeout(done, 300)
}
function afterCollapse(el) {
  el.style.maxHeight = ''
  el.style.overflow = ''
  el.style.transition = ''
}

async function submit() {
  if (!form.tripName.trim()) return toast.error('Trip name is required')
  submitting.value = true
  try {
    const data = {
      tripName: form.tripName,
      travelType: form.travelType,
      itinerary: {
        flights: openSections.flights ? form.itinerary.flights : [],
        buses: openSections.buses ? form.itinerary.buses : [],
        trains: openSections.trains ? form.itinerary.trains : [],
        cabs: openSections.cabs ? form.itinerary.cabs : []
      }
    }
    if (auth.isAdmin && form.selectedUsers.length) {
      data.userId = form.selectedUsers
    }
    await tripStore.createTrip(data)
    toast.success('Trip created successfully')
    router.push('/app/trips')
  } catch (e) {
    toast.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (auth.isAdmin) {
    try {
      users.value = await api.getUsers()
    } catch (e) {
      console.error('Failed to load users:', e)
    }
  }
})
</script>

<style scoped>
.trip-container {
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xs);
  max-width: 900px;
}

/* Travel Type Radio */
.travel-type-options {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.travel-type-radio {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex: 1;
  min-width: 180px;
}
.travel-type-radio input { display: none; }
.travel-type-radio.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.travel-type-radio:hover { border-color: var(--color-primary); }
.radio-label {
  font-weight: 600;
  font-size: var(--font-size-sm);
}
.travel-type-radio.active .radio-label { color: var(--color-primary); }
.radio-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.4;
}

/* User select */
.user-select {
  min-height: 80px;
}

/* Itinerary */
.itinerary-header {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
  color: var(--color-text);
}
.itinerary-form {
  margin-top: var(--space-3);
}

/* Transport toggle options */
.transport-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  font-weight: 500;
  font-size: var(--font-size-sm);
}
.transport-option.disabled {
  opacity: 0.4;
  pointer-events: none;
}
.toggle-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast), transform 0.2s ease;
  flex-shrink: 0;
}
.toggle-btn:hover { background: var(--color-primary-hover); }
.toggle-btn:active { transform: scale(0.85); }
.toggle-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.transport-icon {
  font-size: 18px;
  color: var(--color-text-secondary);
}

/* Transport section entries */
.transport-section {
  margin-left: 42px;
  margin-bottom: var(--space-4);
  padding-left: var(--space-4);
  border-left: 2px solid var(--color-border-light);
}
.transport-entry {
  position: relative;
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
}
.entry-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-3);
}
.entry-grid-4 {
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 768px) {
  .entry-grid, .entry-grid-4 {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 480px) {
  .entry-grid, .entry-grid-4 {
    grid-template-columns: 1fr;
  }
  .travel-type-options { flex-direction: column; }
}

.form-label-sm {
  font-size: var(--font-size-xs);
  margin-bottom: 2px;
}

.remove-entry-btn {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--color-danger);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-entry-btn:hover { background: #b91c1c; }

.add-entry-btn {
  margin-top: var(--space-2);
  margin-bottom: var(--space-2);
}

.result-msg {
  text-align: center;
  margin-top: var(--space-4);
  color: var(--color-text-muted);
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}
</style>
