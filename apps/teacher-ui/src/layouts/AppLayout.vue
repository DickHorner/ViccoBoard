<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">🎓 ViccoBoard</h1>
        <p class="app-subtitle">Unified Teacher Suite</p>
      </div>
    </header>
    
    <aside class="app-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <nav class="nav-menu">
        <RouterLink to="/" class="nav-item" exact-active-class="active">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </RouterLink>
        <RouterLink to="/attendance" class="nav-item" active-class="active">
          <span class="nav-icon">✓</span>
          <span class="nav-label">Attendance</span>
        </RouterLink>
      </nav>
      
      <button 
        class="sidebar-toggle"
        @click="toggleSidebar"
        aria-label="Toggle sidebar"
      >
        <span v-if="sidebarCollapsed">☰</span>
        <span v-else>✕</span>
      </button>
    </aside>
    
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Auto-collapse on small screens
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  sidebarCollapsed.value = true
}
</script>

<style scoped>
.app-layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar content";
  grid-template-columns: 240px 1fr;
  grid-template-rows: 80px 1fr;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  grid-area: header;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.app-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.app-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 400;
}

.app-sidebar {
  grid-area: sidebar;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 1rem;
  position: relative;
  transition: transform 0.3s ease;
}

.app-sidebar.collapsed {
  transform: translateX(-100%);
  position: absolute;
  z-index: 100;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  min-height: 44px; /* Touch target minimum */
  font-weight: 500;
}

.nav-item:hover {
  background: #e9ecef;
  transform: translateX(2px);
}

.nav-item.active {
  background: #667eea;
  color: white;
}

.nav-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.nav-label {
  font-size: 0.95rem;
}

.sidebar-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  width: 44px; /* Touch target minimum */
  height: 44px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.app-content {
  grid-area: content;
  overflow-y: auto;
  padding: 2rem;
  background: #ffffff;
}

/* Responsive design for iPad split-view */
@media (max-width: 768px) {
  .app-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "content";
  }
  
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 80px;
    bottom: 0;
    width: 240px;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
  
  .sidebar-toggle {
    display: flex;
  }
  
  .app-content {
    padding: 1rem;
  }
}

/* Portrait orientation adjustments */
@media (max-width: 600px) {
  .app-header {
    padding: 0.75rem 1rem;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .app-subtitle {
    font-size: 0.75rem;
  }
  
  .app-sidebar {
    width: 200px;
  }
}

/* Landscape orientation on tablets */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .app-layout {
    grid-template-columns: 200px 1fr;
  }
  
  .nav-label {
    font-size: 0.875rem;
  }
}
</style>
