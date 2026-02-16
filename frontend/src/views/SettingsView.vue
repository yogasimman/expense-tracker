<template>
  <div>
    <PageHeader title="Settings" icon="bi bi-gear-fill" subtitle="Manage your profile and preferences" />

    <div class="settings-grid">
      <!-- Profile -->
      <div class="card">
        <div class="card-header"><span class="card-title">Profile</span></div>
        <div class="card-body">
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input v-model="profile.name" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input v-model="profile.email" type="email" class="form-input" disabled />
              <small class="text-muted">Email cannot be changed</small>
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <input :value="auth.user?.role" type="text" class="form-input" disabled />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Change Password -->
      <div class="card">
        <div class="card-header"><span class="card-title">Change Password</span></div>
        <div class="card-body">
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input v-model="pw.current" type="password" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input v-model="pw.newPw" type="password" class="form-input" minlength="6" required />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input v-model="pw.confirm" type="password" class="form-input" required />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="pwSaving">
              {{ pwSaving ? 'Updating…' : 'Update Password' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Categories (Admin) -->
      <div v-if="auth.isAdmin" class="card">
        <div class="card-header"><span class="card-title">Expense Categories</span></div>
        <div class="card-body">
          <div class="category-list">
            <div v-for="cat in categoryStore.categories" :key="cat.id" class="category-item">
              <span>{{ cat.name }}</span>
              <button class="btn btn-ghost btn-sm text-danger" @click="removeCategory(cat.id)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <form @submit.prevent="addCategory" class="add-category-form">
            <input v-model="newCat" type="text" class="form-input" placeholder="New category name" />
            <button type="submit" class="btn btn-outline btn-sm" :disabled="!newCat.trim()">Add</button>
          </form>
        </div>
      </div>

      <!-- Users (Admin) -->
      <div v-if="auth.isAdmin" class="card">
        <div class="card-header"><span class="card-title">Manage Users</span></div>
        <div class="card-body">
          <div v-if="usersLoading" class="loading-spinner" style="width:24px;height:24px"></div>
          <div v-else class="user-list">
            <div v-for="u in users" :key="u.id" class="user-item">
              <div>
                <span class="user-name">{{ u.name }}</span>
                <span class="user-email">{{ u.email }}</span>
              </div>
              <span class="user-role" :class="u.role">{{ u.role }}</span>
            </div>
          </div>
          <form @submit.prevent="addUser" class="add-user-form mt-4">
            <h4 class="form-label">Add User</h4>
            <div class="grid-2">
              <input v-model="newUser.name" class="form-input" placeholder="Name" required />
              <input v-model="newUser.email" type="email" class="form-input" placeholder="Email" required />
            </div>
            <div class="grid-2 mt-2">
              <input v-model="newUser.password" type="password" class="form-input" placeholder="Password" required />
              <select v-model="newUser.role" class="form-input">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary btn-sm mt-3" :disabled="addingUser">Add User</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { useToast } from '@/composables/useToast'
import { api } from '@/api'
import PageHeader from '@/components/common/PageHeader.vue'

const auth = useAuthStore()
const categoryStore = useCategoriesStore()
const toast = useToast()

const saving = ref(false)
const pwSaving = ref(false)
const usersLoading = ref(false)
const addingUser = ref(false)
const users = ref([])
const newCat = ref('')

const profile = reactive({ name: '', email: '' })
const pw = reactive({ current: '', newPw: '', confirm: '' })
const newUser = reactive({ name: '', email: '', password: '', role: 'user' })

async function updateProfile() {
  saving.value = true
  try {
    await auth.updateProfile({ name: profile.name })
    toast.success('Profile updated')
  } catch (e) { toast.error(e.message) }
  finally { saving.value = false }
}

async function changePassword() {
  if (pw.newPw !== pw.confirm) return toast.error('Passwords do not match')
  pwSaving.value = true
  try {
    await api.updateUser(auth.user.id, { password: pw.newPw })
    pw.current = ''; pw.newPw = ''; pw.confirm = ''
    toast.success('Password updated')
  } catch (e) { toast.error(e.message) }
  finally { pwSaving.value = false }
}

async function addCategory() {
  try {
    await categoryStore.addCategory(newCat.value)
    newCat.value = ''
    toast.success('Category added')
  } catch (e) { toast.error(e.message) }
}

async function removeCategory(id) {
  try {
    await categoryStore.removeCategory(id)
    toast.success('Category removed')
  } catch (e) { toast.error(e.message) }
}

async function addUser() {
  addingUser.value = true
  try {
    await api.addUser(newUser)
    newUser.name = ''; newUser.email = ''; newUser.password = ''; newUser.role = 'user'
    toast.success('User added')
    await loadUsers()
  } catch (e) { toast.error(e.message) }
  finally { addingUser.value = false }
}

async function loadUsers() {
  usersLoading.value = true
  try { users.value = await api.getUsers() }
  catch (e) { console.error(e) }
  finally { usersLoading.value = false }
}

onMounted(async () => {
  profile.name = auth.user?.name || ''
  profile.email = auth.user?.email || ''
  categoryStore.fetchCategories()
  if (auth.isAdmin) loadUsers()
})
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-4);
}
@media (max-width: 480px) { .settings-grid { grid-template-columns: 1fr; } }

.text-muted { color: var(--color-text-muted); font-size: var(--font-size-xs); display: block; margin-top: var(--space-1); }
.text-danger { color: var(--color-danger); }

.category-list { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-3); }
.category-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-alt); border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.add-category-form { display: flex; gap: var(--space-2); }
.add-category-form .form-input { flex: 1; }

.user-list { display: flex; flex-direction: column; gap: var(--space-2); }
.user-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-alt); border-radius: var(--radius-md);
}
.user-name { font-weight: 500; font-size: var(--font-size-sm); display: block; }
.user-email { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.user-role {
  font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase;
  padding: var(--space-1) var(--space-2); border-radius: var(--radius-full);
}
.user-role.admin { background: var(--color-primary-light); color: var(--color-primary); }
.user-role.user { background: var(--color-surface-hover); color: var(--color-text-secondary); }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.mt-2 { margin-top: var(--space-2); }
.mt-3 { margin-top: var(--space-3); }
.mt-4 { margin-top: var(--space-4); }
</style>
