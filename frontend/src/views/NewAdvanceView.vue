<template>
  <div>
    <PageHeader title="New Advance" icon="bi bi-credit-card-fill" subtitle="Request a cash advance" />

    <div class="form-card card">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Amount *</label>
              <div class="input-with-prefix">
                <span class="input-prefix">₹</span>
                <input v-model.number="form.amount" type="number" step="0.01" min="0" class="form-input pl-prefix" placeholder="0.00" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Currency</label>
              <select v-model="form.currency" class="form-input">
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Paid Through *</label>
              <select v-model="form.paidThrough" class="form-input" required>
                <option value="" disabled>Select method</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Reference Number</label>
              <input v-model="form.reference" type="text" class="form-input" placeholder="Transaction / cheque ref" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Trip *</label>
            <select v-model="form.tripId" class="form-input" required>
              <option value="" disabled>Select trip</option>
              <option v-for="trip in trips" :key="trip.id" :value="trip.id">{{ trip.tripName || trip.trip_name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea v-model="form.notes" class="form-input" rows="3" placeholder="Additional details about this advance"></textarea>
          </div>

          <div class="form-actions">
            <router-link to="/app/advances" class="btn btn-outline">Cancel</router-link>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="loading-spinner" style="width:16px;height:16px;border-width:2px"></span>
              {{ submitting ? 'Saving…' : 'Request Advance' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdvancesStore } from '@/stores/advances'
import { useTripsStore } from '@/stores/trips'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const advanceStore = useAdvancesStore()
const tripStore = useTripsStore()
const toast = useToast()
const submitting = ref(false)
const trips = ref([])

const form = reactive({
  amount: '',
  currency: 'INR',
  paidThrough: '',
  reference: '',
  tripId: '',
  notes: ''
})

async function submit() {
  if (!form.amount || form.amount <= 0) return toast.error('Valid amount is required')
  if (!form.paidThrough) return toast.error('Payment method is required')
  if (!form.tripId) return toast.error('Trip is required')

  submitting.value = true
  try {
    await advanceStore.createAdvance({
      amount: form.amount,
      currency: form.currency,
      paidThrough: form.paidThrough,
      reference: form.reference,
      tripId: form.tripId,
      notes: form.notes
    })
    toast.success('Advance requested')
    router.push('/app/advances')
  } catch (e) {
    toast.error(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await tripStore.fetchTrips()
  trips.value = tripStore.trips.filter(t => t.status === 'pending' || t.status === 'approved')
})
</script>

<style scoped>
.form-card { max-width: 600px; }

.grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
}
@media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }

.input-with-prefix { position: relative; }
.input-prefix {
  position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%);
  color: var(--color-text-muted); font-weight: 500; font-size: var(--font-size-sm);
  pointer-events: none;
}
.pl-prefix { padding-left: var(--space-8); }

.form-actions {
  display: flex; justify-content: flex-end; gap: var(--space-3);
  margin-top: var(--space-6); padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}
</style>
