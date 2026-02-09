<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="app-header">
      <button
        class="menu-button"
        type="button"
        :aria-expanded="isSidebarOpen"
        aria-controls="primary-navigation"
        @click="toggleSidebar"
      >
        Menu
      </button>

      <div class="brand">
        <div class="brand-mark">VB</div>
        <div class="brand-text">
          <h1 class="brand-title">ViccoBoard</h1>
          <p class="brand-subtitle">Teacher workspace</p>
        </div>
      </div>

      <div class="header-meta">
        <div class="page-title">{{ pageTitle }}</div>
        <div class="status-pill">Offline-ready</div>
      </div>
    </header>

    <div class="app-body">
      <aside
        id="primary-navigation"
        class="app-sidebar"
        :class="{ open: isSidebarOpen }"
        aria-label="Primary"
      >
        <nav class="nav-menu">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            active-class="active"
            @click="handleNavClick"
          >
            <span class="nav-dot" aria-hidden="true"></span>
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-hint">{{ item.hint }}</span>
          </RouterLink>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-card">
            <p class="sidebar-card-title">Quick actions</p>
            <p class="sidebar-card-body">New class, attendance, and grading shortcuts land in P2-3.</p>
          </div>
        </div>
      </aside>

      <button
        v-if="isCompact && isSidebarOpen"
        class="sidebar-backdrop"
        type="button"
        aria-label="Close navigation"
        @click="closeSidebar"
      ></button>

      <main id="main-content" class="app-content">
        <RouterView v-slot="{ Component }">
          <Transition name="view-fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/', label: 'Dashboard', hint: 'Classes and activity' },
  { to: '/exams', label: 'Exams', hint: 'KURT assessments' },
  { to: '/students', label: 'Students', hint: 'Roster and profiles' },
  { to: '/lessons', label: 'Lessons', hint: 'Schedule and history' },
  { to: '/attendance', label: 'Attendance', hint: 'Daily check-in' },
  { to: '/grading', label: 'Grading', hint: 'Entries and history' },
  { to: '/tools/timer', label: 'Timer', hint: 'Tools' },
  { to: '/tools/multistop', label: 'Multistop', hint: 'Tools' },
  { to: '/tools/scoreboard', label: 'Scoreboard', hint: 'Tools' },
  { to: '/tools/teams', label: 'Teams', hint: 'Tools' },
  { to: '/tools/tournaments', label: 'Tournaments', hint: 'Tools' },
  { to: '/tools/tactics', label: 'Tactics', hint: 'Tools' },
  { to: '/tools/feedback', label: 'Feedback', hint: 'Tools' }
]

const pageTitle = computed(() => {
  const metaTitle = route.meta?.title
  if (typeof metaTitle === 'string' && metaTitle.trim().length > 0) {
    return metaTitle
  }
  return 'Dashboard'
})

const compactWidth = 900

const getInitialLayout = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < compactWidth
  }
  return false
}

const isCompact = ref(getInitialLayout())
const isSidebarOpen = ref(!isCompact.value)

const updateLayout = () => {
  const compact = window.innerWidth < compactWidth
  if (compact !== isCompact.value) {
    isCompact.value = compact
    isSidebarOpen.value = !compact
  }
}

const toggleSidebar = () => {
  if (!isCompact.value) {
    return
  }
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  if (isCompact.value) {
    isSidebarOpen.value = false
  }
}

const handleNavClick = () => {
  if (isCompact.value) {
    isSidebarOpen.value = false
  }
}

onMounted(() => {
  updateLayout()
  window.addEventListener('resize', updateLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
})
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  background: var(--page-background);
  color: var(--color-ink);
  --app-header-offset: 96px;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 16px;
  padding: 8px 12px;
  background: var(--color-ink);
  color: white;
  border-radius: 999px;
  font-size: 0.85rem;
  z-index: 20;
}

.skip-link:focus {
  top: 16px;
}

.app-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: var(--surface-glass);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 0;
  z-index: 5;
}

.menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  height: 44px;
  min-width: 84px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: white;
  color: var(--color-ink);
  font-weight: 600;
  cursor: pointer;
  transition: outline 0.2s ease;
}

.menu-button:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #06b6d4 100%);
  color: white;
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.brand-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.9rem;
  color: var(--color-muted);
}

.header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.page-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-ink);
}

.status-pill {
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  background: rgba(14, 116, 144, 0.12);
  color: #0e7490;
  font-size: 0.75rem;
  font-weight: 600;
}

.app-sidebar {
  padding: 1.5rem 1.25rem;
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  background: white;
  height: calc(100vh - var(--app-header-offset));
  position: sticky;
  top: var(--app-header-offset);
  overflow-y: auto;
  transition: transform 0.3s ease;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-item {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 0.75rem;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  text-decoration: none;
  color: var(--color-ink);
  background: rgba(15, 23, 42, 0.04);
  min-height: 48px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.nav-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(14, 116, 144, 0.15), rgba(56, 189, 248, 0.15));
  border: 1px solid rgba(14, 116, 144, 0.25);
}

.nav-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-strong);
}

.nav-label {
  font-weight: 600;
  display: block;
}

.nav-hint {
  display: block;
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-top: 0.1rem;
}

.sidebar-footer {
  margin-top: 2rem;
}

.sidebar-card {
  background: var(--surface-soft);
  border-radius: 16px;
  padding: 1rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.sidebar-card-title {
  margin: 0 0 0.35rem;
  font-weight: 600;
  color: var(--color-ink);
}

.sidebar-card-body {
  margin: 0;
  line-height: 1.4;
}

.app-content {
  padding: 2rem 2.5rem 3rem;
  min-height: calc(100vh - var(--app-header-offset));
}

.sidebar-backdrop {
  position: fixed;
  inset: var(--app-header-offset) 0 0 0;
  background: rgba(15, 23, 42, 0.45);
  border: none;
  padding: 0;
  margin: 0;
}

.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .app-header {
    grid-template-columns: auto 1fr;
  }

  .menu-button {
    display: inline-flex;
  }

  .header-meta {
    align-items: flex-start;
  }

  .app-body {
    grid-template-columns: 1fr;
  }

  .app-sidebar {
    position: fixed;
    top: var(--app-header-offset);
    bottom: 0;
    left: 0;
    height: auto;
    transform: translateX(-100%);
    z-index: 10;
  }

  .app-sidebar.open {
    transform: translateX(0);
  }

  .app-content {
    padding: 1.5rem;
  }
}

@media (max-width: 600px) {
  .app-header {
    padding: 1rem 1.25rem;
  }

  .brand-mark {
    width: 40px;
    height: 40px;
  }

  .brand-title {
    font-size: 1.15rem;
  }

  .app-content {
    padding: 1rem;
  }
}

@media (min-width: 901px) and (max-width: 1200px) {
  .app-sidebar {
    width: 220px;
  }

  .app-body {
    grid-template-columns: 220px 1fr;
  }
}
</style>
