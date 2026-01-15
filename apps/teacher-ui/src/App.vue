<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { db } from './db'

const dbStatus = ref<'initializing' | 'ready' | 'error'>('initializing')
const errorMessage = ref('')

onMounted(async () => {
  try {
    // Test database connection
    await db.open()
    console.log('Database initialized successfully')
    dbStatus.value = 'ready'
  } catch (error) {
    console.error('Failed to initialize database:', error)
    dbStatus.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto">
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900">ViccoBoard</h1>
        <p class="text-gray-600 mt-2">Teacher Application - SportZens & KURT</p>
      </header>

      <Card class="mb-6">
        <template #title>System Status</template>
        <template #content>
          <div class="flex items-center gap-3">
            <i 
              :class="[
                'pi text-2xl',
                dbStatus === 'ready' ? 'pi-check-circle text-green-500' : 
                dbStatus === 'error' ? 'pi-times-circle text-red-500' : 
                'pi-spin pi-spinner text-blue-500'
              ]"
            />
            <div>
              <p class="font-semibold">
                Database: 
                <span :class="dbStatus === 'ready' ? 'text-green-600' : dbStatus === 'error' ? 'text-red-600' : 'text-blue-600'">
                  {{ dbStatus === 'ready' ? 'Connected' : dbStatus === 'error' ? 'Error' : 'Initializing...' }}
                </span>
              </p>
              <p v-if="errorMessage" class="text-sm text-red-600 mt-1">{{ errorMessage }}</p>
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <template #title>
            <i class="pi pi-users mr-2" />
            Classes & Students
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">Manage your classes, students, and attendance records.</p>
            <Button label="Open" icon="pi pi-arrow-right" />
          </template>
        </Card>

        <Card>
          <template #title>
            <i class="pi pi-trophy mr-2" />
            SportZens
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">Sports assessments, tests, and performance tracking.</p>
            <Button label="Open" icon="pi pi-arrow-right" />
          </template>
        </Card>

        <Card>
          <template #title>
            <i class="pi pi-file-edit mr-2" />
            KURT (Exams)
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">Exam creation, grading, and diagnostic feedback.</p>
            <Button label="Open" icon="pi pi-arrow-right" />
          </template>
        </Card>

        <Card>
          <template #title>
            <i class="pi pi-chart-bar mr-2" />
            Statistics
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">View performance statistics and analytics.</p>
            <Button label="Open" icon="pi pi-arrow-right" />
          </template>
        </Card>

        <Card>
          <template #title>
            <i class="pi pi-download mr-2" />
            Export & Reports
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">Generate PDFs, CSV exports, and email reports.</p>
            <Button label="Open" icon="pi pi-arrow-right" />
          </template>
        </Card>

        <Card>
          <template #title>
            <i class="pi pi-cog mr-2" />
            Settings
          </template>
          <template #content>
            <p class="text-gray-600 mb-4">Configure app settings, security, and integrations.</p>
            <Button label="Open" icon="pi pi-arrow-right" />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
