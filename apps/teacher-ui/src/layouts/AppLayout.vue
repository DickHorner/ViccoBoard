<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Zum Inhalt springen</a>

    <header class="app-header">
      <button
        class="menu-button"
        type="button"
        :aria-expanded="isSidebarOpen"
        aria-controls="primary-navigation"
        @click="toggleSidebar"
      >
        Menü
      </button>

      <div class="brand">
        <div class="brand-mark">VB</div>
        <div class="brand-text">
          <h1 class="brand-title">ViccoBoard</h1>
          <p class="brand-subtitle">Lehrkraft-Arbeitsbereich</p>
        </div>
      </div>

      <div class="header-meta">
        <div class="page-title">{{ pageTitle }}</div>
        <div class="status-pill">Offline bereit</div>
      </div>
    </header>

    <div class="app-body">
      <aside
        id="primary-navigation"
        class="app-sidebar"
        :class="{ open: isSidebarOpen }"
        aria-label="Hauptnavigation"
      >
        <nav class="nav-menu">
          <section
            v-for="section in navSections"
            :key="section.id"
            class="nav-section"
          >
            <p class="nav-section-title">{{ section.title }}</p>
            <RouterLink
              v-for="item in section.items"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ active: isNavItemActive(item.to) }"
              @click="handleNavClick"
            >
              <span class="nav-dot" aria-hidden="true"></span>
              <span class="nav-label">{{ item.label }}</span>
              <span class="nav-hint">{{ item.hint }}</span>
            </RouterLink>
          </section>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-card">
            <p class="sidebar-card-title">Arbeitsprinzip</p>
            <p class="sidebar-card-body">Organisation bleibt fachneutral. Fachtools öffnen wir erst im passenden Arbeitsbereich.</p>
          </div>
        </div>
      </aside>

      <button
        v-if="isCompact && isSidebarOpen"
        class="sidebar-backdrop"
        type="button"
        aria-label="Navigation schließen"
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
import { primaryNavSections } from '../navigation'

const route = useRoute()

const navSections = primaryNavSections

const pageTitle = computed(() => {
  const metaTitle = route.meta?.title
  if (typeof metaTitle === 'string' && metaTitle.trim().length > 0) {
    return metaTitle
  }
  return 'Start'
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

const isNavItemActive = (target: string) => {
  if (target === '/') {
    return route.path === '/' || route.path === '/dashboard'
  }

  if (target === '/subjects/sport') {
    return route.path === target
      || route.path.startsWith('/grading')
      || route.path.startsWith('/tools/')
  }

  if (target === '/subjects/kbr') {
    return route.path === target || route.path.startsWith('/exams')
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}

onMounted(() => {
  updateLayout()
  window.addEventListener('resize', updateLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
})
</script>

<style scoped src="./AppLayout.css"></style>
