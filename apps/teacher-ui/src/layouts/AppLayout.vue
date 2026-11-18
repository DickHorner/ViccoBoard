<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Zum Inhalt springen</a>

    <header class="app-header">
      <Button
        id="sidebar-toggle"
        class="menu-button"
        severity="secondary"
        outlined
        :icon="isCompact ? 'pi pi-bars' : isRailCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"
        :label="isCompact ? 'Menü' : isRailCollapsed ? 'Ausklappen' : 'Einklappen'"
        :aria-label="isCompact ? (isSidebarOpen ? 'Menü schließen' : 'Menü öffnen') : isRailCollapsed ? 'Navigation ausklappen' : 'Navigation einklappen'"
        :aria-expanded="isCompact ? isSidebarOpen : !isRailCollapsed"
        aria-controls="primary-navigation"
        @click="toggleSidebar"
      />

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

    <div class="app-body" :class="{ 'sidebar-collapsed': isRailCollapsed }">
      <aside
        id="primary-navigation"
        class="app-sidebar"
        :class="{ open: isSidebarOpen, collapsed: isRailCollapsed }"
        :inert="isCompact && !isSidebarOpen"
        :aria-hidden="isCompact && !isSidebarOpen ? 'true' : undefined"
        aria-label="Hauptnavigation"
      >
        <nav class="nav-menu">
          <section
            v-for="section in navSections"
            :key="section.id"
            class="nav-section"
            :class="{ 'nav-section-collapsible': section.collapsible }"
          >
            <button
              v-if="section.collapsible && !isRailCollapsed"
              class="nav-section-toggle"
              type="button"
              :aria-expanded="isSectionExpanded(section.id)"
              @click="toggleSection(section.id)"
            >
              <span class="nav-section-title">{{ section.title }}</span>
              <span class="nav-section-chevron" :class="{ expanded: isSectionExpanded(section.id) }" aria-hidden="true">▾</span>
            </button>
            <p v-else class="nav-section-title">{{ section.title }}</p>

            <div v-show="isRailCollapsed || !section.collapsible || isSectionExpanded(section.id)" class="nav-section-items">
              <RouterLink
                v-for="item in section.items"
                :key="item.to"
                :to="item.to"
                class="nav-item"
                :class="{ active: isNavItemActive(item.to) }"
                :aria-current="isNavItemActive(item.to) ? 'page' : undefined"
                :aria-label="isRailCollapsed ? item.label : undefined"
                :title="isRailCollapsed ? `${item.label}: ${item.hint}` : undefined"
                @click="handleNavClick"
              >
                <i :class="['nav-icon', item.icon]" aria-hidden="true"></i>
                <span class="nav-label">{{ item.label }}</span>
                <span class="nav-hint">{{ item.hint }}</span>
              </RouterLink>
            </div>
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
          <component :is="Component" :key="route.fullPath" />
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Button from 'openvue/button'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { primaryNavSections, resolvePrimaryNavTarget } from '../navigation'

const route = useRoute()
const router = useRouter()

const navSections = primaryNavSections
const sectionState = ref<Record<string, boolean>>({})

const activeNavTarget = computed(() => resolvePrimaryNavTarget(
  route.path,
  path => {
    const parent = router.resolve(path).meta.parent
    return typeof parent === 'string' ? parent : undefined
  }
))

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
const isSidebarCollapsed = ref(false)
const isRailCollapsed = computed(() => !isCompact.value && isSidebarCollapsed.value)

const updateLayout = () => {
  const compact = window.innerWidth < compactWidth
  if (compact !== isCompact.value) {
    isCompact.value = compact
    isSidebarOpen.value = !compact
  }
}

const toggleSidebar = () => {
  if (isCompact.value) {
    isSidebarOpen.value = !isSidebarOpen.value
  } else {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }
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

const isSectionExpanded = (sectionId: string) => {
  const section = navSections.find(entry => entry.id === sectionId)
  return sectionState.value[sectionId]
    ?? section?.items.some(item => isNavItemActive(item.to))
    ?? section?.defaultExpanded
    ?? false
}

const toggleSection = (sectionId: string) => {
  sectionState.value = {
    ...sectionState.value,
    [sectionId]: !isSectionExpanded(sectionId)
  }
}

const isNavItemActive = (target: string) => activeNavTarget.value === target

watch(activeNavTarget, target => {
  const section = navSections.find(entry => entry.collapsible && entry.items.some(item => item.to === target))
  if (section) {
    sectionState.value = { ...sectionState.value, [section.id]: true }
  }
}, { immediate: true })

watch(() => route.fullPath, closeSidebar)

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isCompact.value || !isSidebarOpen.value) return
  closeSidebar()
  document.getElementById('sidebar-toggle')?.focus()
}

onMounted(() => {
  updateLayout()
  window.addEventListener('resize', updateLayout)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped src="./AppLayout.css"></style>
