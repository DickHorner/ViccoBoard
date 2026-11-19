import { createApp } from 'vue'
import { createPinia } from 'pinia'
import OpenVue from 'openvue/config'
import ToastService from 'openvue/toastservice'
import App from './App.vue'
import router from './router'
import { createAppI18n } from './i18n'
import { initializeStorage } from './services/storage.service'
import { initializeSportBridge } from './composables/useSportBridge'
import { initializeStudentsBridge } from './composables/useStudentsBridge'
import { initializeExamsBridge } from './composables/useExamsBridge'
import { initializePlanningBridge } from './composables/usePlanningBridge'
import { openVueOptions } from './openvue'
import { initializeColorScheme } from './composables/useColorScheme'
import '@openvue/openicons/primeicons.css'
import './volt.css'
import './style.css'

initializeColorScheme()

const app = createApp(App)
const pinia = createPinia()
const i18n = createAppI18n()

const bootstrap = async () => {
	try {
		// Initialize storage first
		await initializeStorage()
		
		// Then initialize all module bridges
		initializeSportBridge()
		initializeStudentsBridge()
		initializeExamsBridge()
		initializePlanningBridge()
		
		console.log('✓ All module bridges initialized')
	} catch (error) {
		console.error('Failed to initialize app:', error)
	}

	app.use(pinia)
	app.use(OpenVue, openVueOptions)
	app.use(ToastService)
	app.use(i18n)
	app.use(router)
	app.mount('#app')
}

void bootstrap()
